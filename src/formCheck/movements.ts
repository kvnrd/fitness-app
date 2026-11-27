import type { Joint } from './angles.ts';

/** Lifts form check supports in v1. Anything else gets no form check. */
export type Movement = 'squat' | 'deadlift' | 'bench_press' | 'overhead_press' | 'push_up';

export const MOVEMENTS: readonly Movement[] = ['squat', 'deadlift', 'bench_press', 'overhead_press', 'push_up'];

/** Flag codes. Copy for each is pending (no Counsel strings yet), so screens show codes only via a table Kevin approves. */
export type FlagCode =
  | 'depth_short'
  | 'torso_lean'
  | 'lockout_incomplete'
  | 'bar_drift'
  | 'hip_sag'
  | 'low_confidence';

export type MovementRule = {
  /** Angle that drives the rep count. */
  primary: Joint;
  /** At or below this the lifter is "down". */
  downAt: number;
  /** At or above this the lifter is "up". Gap to downAt is the hysteresis band. */
  upAt: number;
  /** Shorter reps are noise. */
  minRepMs: number;
  /** Flags this movement can raise. */
  flags: readonly FlagCode[];
  /** Thresholds used by the flag rules. */
  limits: {
    /** depth_short when the bottom primary angle stays above this. */
    depthMaxAngle?: number;
    /** torso_lean above this many degrees from vertical at the bottom. */
    torsoLeanMax?: number;
    /** lockout_incomplete when the top primary angle stays below this. */
    lockoutMin?: number;
    /** bar_drift when horizontal bar travel exceeds this share of torso length. */
    barDriftMax?: number;
    /** hip_sag when the shoulder–hip–ankle line bends below this. */
    bodyLineMin?: number;
  };
  /** Track the wrists as the bar. */
  barPath: boolean;
};

export const MOVEMENT_RULES: Record<Movement, MovementRule> = {
  squat: {
    primary: 'knee', downAt: 110, upAt: 155, minRepMs: 500,
    flags: ['depth_short', 'torso_lean', 'bar_drift', 'low_confidence'],
    limits: { depthMaxAngle: 95, torsoLeanMax: 55, barDriftMax: 0.25 },
    barPath: true,
  },
  deadlift: {
    primary: 'hip', downAt: 120, upAt: 155, minRepMs: 500,
    flags: ['lockout_incomplete', 'bar_drift', 'low_confidence'],
    limits: { lockoutMin: 165, barDriftMax: 0.25 },
    barPath: true,
  },
  bench_press: {
    primary: 'elbow', downAt: 110, upAt: 150, minRepMs: 400,
    flags: ['depth_short', 'lockout_incomplete', 'low_confidence'],
    limits: { depthMaxAngle: 100, lockoutMin: 160 },
    barPath: true,
  },
  overhead_press: {
    primary: 'elbow', downAt: 100, upAt: 150, minRepMs: 400,
    flags: ['lockout_incomplete', 'low_confidence'],
    limits: { lockoutMin: 165 },
    barPath: true,
  },
  push_up: {
    primary: 'elbow', downAt: 110, upAt: 150, minRepMs: 400,
    flags: ['depth_short', 'hip_sag', 'low_confidence'],
    limits: { depthMaxAngle: 100, bodyLineMin: 155 },
    barPath: false,
  },
};

const MATCHERS: ReadonlyArray<[RegExp, Movement]> = [
  [/\b(romanian|rdl|stiff[- ]leg|sumo|trap[- ]bar|conventional)?\s*dead\s*lift\b|\brdl\b/i, 'deadlift'],
  [/\bbench\b/i, 'bench_press'],
  [/\b(overhead|military|shoulder|strict)\s+press\b|\bohp\b/i, 'overhead_press'],
  [/\bpush[- ]?ups?\b/i, 'push_up'],
  [/\bsquats?\b/i, 'squat'],
];

/** Maps a plan exercise name to a supported movement, or null (no form check offered). */
export function movementForExercise(name: string): Movement | null {
  for (const [re, m] of MATCHERS) if (re.test(name)) return m;
  return null;
}
