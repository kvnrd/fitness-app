import type { SetAnalysis } from './analyzer.ts';
import { BODY_JOINTS, type BodyFrame } from './landmarks.ts';

/**
 * Sharing a form check with a coach (BUILD-PLAN Phase 7, health-data policy §7):
 *   - Only the user's own active 1:1 coach.
 *   - Adults: their opt-in; the coach may get the video, skeleton and numbers.
 *   - 16–17: skeleton and numbers only, never the video, and only after both the teen and the
 *     parent opt in. The server enforces the same rules (form_check_shares RLS).
 */
export type ShareContext = {
  ownerIsMinor: boolean;
  isOwnActiveCoach: boolean;
  ownerOptIn: boolean;
  /** Required for 16–17 only. */
  parentOptIn?: boolean;
};

export type ShareScope = { allowed: false } | { allowed: true; video: boolean; skeleton: true; metrics: true };

export function shareScope(c: ShareContext): ShareScope {
  if (!c.isOwnActiveCoach || !c.ownerOptIn) return { allowed: false };
  if (c.ownerIsMinor) {
    return c.parentOptIn === true ? { allowed: true, video: false, skeleton: true, metrics: true } : { allowed: false };
  }
  return { allowed: true, video: true, skeleton: true, metrics: true };
}

/** Compact skeleton for storage and sharing: body joints only, ~10 fps, 3 decimals. */
export type CompactFrame = { t: number; p: number[] };
export const SKELETON_FPS = 10;

const round = (n: number) => Math.round(n * 1000) / 1000;

export function compactSkeleton(frames: readonly BodyFrame[], fps = SKELETON_FPS): CompactFrame[] {
  const step = 1000 / fps;
  const out: CompactFrame[] = [];
  let next = -Infinity;
  for (const f of frames) {
    if (f.t < next) continue;
    next = f.t + step;
    const p: number[] = [];
    for (const j of BODY_JOINTS) {
      const pt = f.points[j];
      p.push(pt ? round(pt.x) : -1, pt ? round(pt.y) : -1, pt ? round(pt.v) : 0);
    }
    out.push({ t: Math.round(f.t), p });
  }
  return out;
}

/** Numbers a coach (or the owner's history) gets. No name, no video, no face. */
export type FormCheckMetrics = {
  movement: SetAnalysis['movement'];
  repCount: number;
  reps: { index: number; bottomAngle: number; topAngle: number; durationMs: number; flags: string[] }[];
  barDrift: number | null;
};

export function metricsOf(a: SetAnalysis): FormCheckMetrics {
  return {
    movement: a.movement,
    repCount: a.reps.length,
    reps: a.reps.map((r) => ({
      index: r.index,
      bottomAngle: Math.round(r.bottomAngle),
      topAngle: Math.round(r.topAngle),
      durationMs: Math.round(r.endT - r.startT),
      flags: [...r.flags],
    })),
    barDrift: a.barDrift === null ? null : round(a.barDrift),
  };
}
