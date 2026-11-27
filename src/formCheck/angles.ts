import { visible, type BodyFrame, type BodyJoint, type Point } from './landmarks.ts';

export type Side = 'left' | 'right';

/** Angle at b, in degrees (0–180), between rays b→a and b→c. Null if a ray has no length. */
export function angleDeg(a: Point, b: Point, c: Point): number | null {
  const v1x = a.x - b.x, v1y = a.y - b.y;
  const v2x = c.x - b.x, v2y = c.y - b.y;
  const n1 = Math.hypot(v1x, v1y), n2 = Math.hypot(v2x, v2y);
  if (n1 === 0 || n2 === 0) return null;
  const cos = Math.min(1, Math.max(-1, (v1x * v2x + v1y * v2y) / (n1 * n2)));
  return (Math.acos(cos) * 180) / Math.PI;
}

/** Joints we measure, each as the three points that form it. */
export type Joint = 'knee' | 'hip' | 'elbow' | 'shoulder' | 'body_line';

const TRIPLES: Record<Joint, (s: Side) => [BodyJoint, BodyJoint, BodyJoint]> = {
  knee: (s) => [`${s}_hip`, `${s}_knee`, `${s}_ankle`],
  hip: (s) => [`${s}_shoulder`, `${s}_hip`, `${s}_knee`],
  elbow: (s) => [`${s}_shoulder`, `${s}_elbow`, `${s}_wrist`],
  shoulder: (s) => [`${s}_elbow`, `${s}_shoulder`, `${s}_hip`],
  // Shoulder–hip–ankle: 180 is a straight plank.
  body_line: (s) => [`${s}_shoulder`, `${s}_hip`, `${s}_ankle`],
};

function sideAngle(frame: BodyFrame, joint: Joint, side: Side): { angle: number; vis: number } | null {
  const [a, b, c] = TRIPLES[joint](side).map((j) => visible(frame, j));
  if (!a || !b || !c) return null;
  const angle = angleDeg(a, b, c);
  return angle === null ? null : { angle, vis: Math.min(a.v, b.v, c.v) };
}

/**
 * Joint angle on the side the camera sees better (side-on filming hides the far limb).
 * Null when neither side is visible enough.
 */
export function jointAngle(frame: BodyFrame, joint: Joint, side: Side | 'best' = 'best'): number | null {
  if (side !== 'best') return sideAngle(frame, joint, side)?.angle ?? null;
  const l = sideAngle(frame, joint, 'left');
  const r = sideAngle(frame, joint, 'right');
  if (l && r) return l.vis >= r.vis ? l.angle : r.angle;
  return (l ?? r)?.angle ?? null;
}

/** Torso lean from vertical in degrees (0 = upright), using the better-seen side. */
export function torsoLeanDeg(frame: BodyFrame): number | null {
  const pick = (s: Side) => {
    const sh = visible(frame, `${s}_shoulder`);
    const hip = visible(frame, `${s}_hip`);
    return sh && hip ? { sh, hip, vis: Math.min(sh.v, hip.v) } : null;
  };
  const l = pick('left'), r = pick('right');
  const best = l && r ? (l.vis >= r.vis ? l : r) : (l ?? r);
  if (!best) return null;
  const dx = best.sh.x - best.hip.x, dy = best.hip.y - best.sh.y;
  if (dx === 0 && dy === 0) return null;
  return (Math.atan2(Math.abs(dx), dy) * 180) / Math.PI;
}
