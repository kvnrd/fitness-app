import { jointAngle, torsoLeanDeg } from './angles.ts';
import { visible, type BodyFrame } from './landmarks.ts';
import { MOVEMENT_RULES, type FlagCode, type Movement, type MovementRule } from './movements.ts';

export type BarPoint = { t: number; x: number; y: number };

export type Rep = {
  index: number;
  startT: number;
  bottomT: number;
  endT: number;
  /** Smallest primary angle in the rep (the bottom). */
  bottomAngle: number;
  /** Largest primary angle at the top after the rep. */
  topAngle: number;
  flags: FlagCode[];
};

export type SetAnalysis = {
  movement: Movement;
  reps: Rep[];
  /** Wrist midpoint per frame for barbell lifts; empty otherwise. */
  barPath: BarPoint[];
  /** Horizontal bar travel over torso length, whole set. Null when not tracked. */
  barDrift: number | null;
};

const SMOOTH = 0.5;
const LOW_CONFIDENCE_SHARE = 0.3;

type Open = {
  startT: number;
  bottomT: number;
  bottomAngle: number;
  maxLean: number;
  minBodyLine: number;
  hipAboveKneeAtBottom: boolean | null;
  frames: number;
  missing: number;
  barXs: number[];
  torso: number[];
};

function wristMid(f: BodyFrame): { x: number; y: number } | null {
  const l = visible(f, 'left_wrist'), r = visible(f, 'right_wrist');
  if (l && r) return { x: (l.x + r.x) / 2, y: (l.y + r.y) / 2 };
  const one = l ?? r;
  return one ? { x: one.x, y: one.y } : null;
}

function torsoLength(f: BodyFrame): number | null {
  for (const s of ['left', 'right'] as const) {
    const sh = visible(f, `${s}_shoulder`), hip = visible(f, `${s}_hip`);
    if (sh && hip) return Math.hypot(sh.x - hip.x, sh.y - hip.y);
  }
  return null;
}

function hipAboveKnee(f: BodyFrame): boolean | null {
  for (const s of ['left', 'right'] as const) {
    const hip = visible(f, `${s}_hip`), knee = visible(f, `${s}_knee`);
    // y grows downward: a hip with a smaller y than the knee is above it.
    if (hip && knee) return hip.y < knee.y;
  }
  return null;
}

function median(xs: number[]): number | null {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b);
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

function drift(xs: number[], torso: number[]): number | null {
  const t = median(torso);
  if (!xs.length || !t) return null;
  return (Math.max(...xs) - Math.min(...xs)) / t;
}

/**
 * Live rep counter and form analysis for one set. Feed frames in time order with push();
 * read count at any time; call finish() at the end of the set for the full analysis.
 *
 * Counting uses a hysteresis band on the smoothed primary angle: a rep is the lifter going
 * from "down" (≤ downAt) back to "up" (≥ upAt). Lifts that start at the bottom (deadlift)
 * count on the first lockout. Rule-based only, no model or server call.
 */
export class RepAnalyzer {
  readonly movement: Movement;
  private rule: MovementRule;
  private smoothed: number | null = null;
  private state: 'unknown' | 'up' | 'down' = 'unknown';
  private open: Open | null = null;
  /** Rep waiting for its top angle (lockout) to be measured. */
  private pendingTop: { rep: Omit<Rep, 'topAngle' | 'flags'> & { o: Open }; top: number } | null = null;
  private done: Rep[] = [];
  private bar: BarPoint[] = [];
  private setBarXs: number[] = [];
  private setTorso: number[] = [];
  private lastT = -Infinity;

  constructor(movement: Movement) {
    this.movement = movement;
    this.rule = MOVEMENT_RULES[movement];
  }

  /** Reps counted so far, including one still waiting for its lockout measurement. */
  get count(): number {
    return this.done.length + (this.pendingTop ? 1 : 0);
  }

  private startOpen(t: number, angle: number): Open {
    return {
      startT: t, bottomT: t, bottomAngle: angle, maxLean: 0, minBodyLine: 180,
      hipAboveKneeAtBottom: null, frames: 0, missing: 0, barXs: [], torso: [],
    };
  }

  push(frame: BodyFrame): void {
    if (!(frame.t > this.lastT)) return; // out-of-order or duplicate frame
    this.lastT = frame.t;
    const r = this.rule;

    const torso = torsoLength(frame);
    if (torso) this.setTorso.push(torso);
    if (r.barPath) {
      const w = wristMid(frame);
      if (w) {
        this.bar.push({ t: frame.t, x: w.x, y: w.y });
        this.setBarXs.push(w.x);
      }
    }

    const raw = jointAngle(frame, r.primary);
    if (this.open) {
      this.open.frames++;
      if (raw === null) this.open.missing++;
      if (torso) this.open.torso.push(torso);
      const w = r.barPath ? wristMid(frame) : null;
      if (w) this.open.barXs.push(w.x);
    }
    if (raw === null) return;
    this.smoothed = this.smoothed === null ? raw : SMOOTH * raw + (1 - SMOOTH) * this.smoothed;
    const a = this.smoothed;

    if (this.pendingTop) {
      if (a > this.pendingTop.top) this.pendingTop.top = a;
      if (a < r.upAt) this.closePending();
    }

    if (this.open) {
      const lean = torsoLeanDeg(frame);
      if (a <= this.open.bottomAngle) {
        this.open.bottomAngle = a;
        this.open.bottomT = frame.t;
        this.open.hipAboveKneeAtBottom = hipAboveKnee(frame);
        if (lean !== null) this.open.maxLean = Math.max(this.open.maxLean, lean);
      }
      const line = jointAngle(frame, 'body_line');
      if (line !== null) this.open.minBodyLine = Math.min(this.open.minBodyLine, line);
    }

    if (this.state !== 'down' && a <= r.downAt) {
      this.state = 'down';
      if (!this.open) this.open = this.startOpen(frame.t, a);
    } else if (this.state === 'up' && a < r.upAt && !this.open) {
      // Leaving the top: the rep starts here, even before it reaches "down".
      this.open = this.startOpen(frame.t, a);
    } else if (this.state === 'unknown' && a >= r.upAt) {
      this.state = 'up';
    } else if (this.state === 'down' && a >= r.upAt) {
      this.state = 'up';
      const o = this.open;
      this.open = null;
      if (o && frame.t - o.startT >= r.minRepMs) {
        this.closePending();
        this.pendingTop = {
          rep: { index: 0, startT: o.startT, bottomT: o.bottomT, endT: frame.t, bottomAngle: o.bottomAngle, o },
          top: a,
        };
      }
    } else if (this.state === 'up' && this.open && a >= r.upAt) {
      // Dipped and came back without reaching "down": not a rep.
      this.open = null;
    }
  }

  private closePending(): void {
    const p = this.pendingTop;
    if (!p) return;
    this.pendingTop = null;
    const { o, ...rep } = p.rep;
    const full: Rep = { ...rep, index: this.done.length + 1, topAngle: p.top, flags: [] };
    full.flags = this.flagsFor(full, o);
    this.done.push(full);
  }

  private flagsFor(rep: Rep, o: Open): FlagCode[] {
    const { flags, limits } = this.rule;
    const out: FlagCode[] = [];
    const has = (f: FlagCode) => flags.includes(f);
    if (has('depth_short') && limits.depthMaxAngle !== undefined) {
      // Squats: hip above knee at the bottom is short, whatever the angle says.
      const short = this.movement === 'squat' && o.hipAboveKneeAtBottom !== null
        ? o.hipAboveKneeAtBottom
        : rep.bottomAngle > limits.depthMaxAngle;
      if (short) out.push('depth_short');
    }
    if (has('torso_lean') && limits.torsoLeanMax !== undefined && o.maxLean > limits.torsoLeanMax) out.push('torso_lean');
    if (has('lockout_incomplete') && limits.lockoutMin !== undefined && rep.topAngle < limits.lockoutMin) out.push('lockout_incomplete');
    if (has('bar_drift') && limits.barDriftMax !== undefined) {
      const d = drift(o.barXs, o.torso);
      if (d !== null && d > limits.barDriftMax) out.push('bar_drift');
    }
    if (has('hip_sag') && limits.bodyLineMin !== undefined && o.minBodyLine < limits.bodyLineMin) out.push('hip_sag');
    if (o.frames > 0 && o.missing / o.frames > LOW_CONFIDENCE_SHARE) out.push('low_confidence');
    return out;
  }

  finish(): SetAnalysis {
    this.closePending();
    return {
      movement: this.movement,
      reps: [...this.done],
      barPath: [...this.bar],
      barDrift: this.rule.barPath ? drift(this.setBarXs, this.setTorso) : null,
    };
  }
}

export function analyzeSet(movement: Movement, frames: Iterable<BodyFrame>): SetAnalysis {
  const a = new RepAnalyzer(movement);
  for (const f of frames) a.push(f);
  return a.finish();
}
