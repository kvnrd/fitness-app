/**
 * Phase 7 form check: pose landmarks with the face removed.
 *
 * MediaPipe Pose Landmarker returns 33 points. Indices 0–10 are the face (nose, eyes, ears,
 * mouth). Legal review (Texas CUBI, Illinois BIPA) requires that face points are thrown away.
 * The native module drops them before anything crosses into JS; this file is the second line
 * of defense: a BodyFrame has no slot for a face point, so none can be stored, logged or shared.
 */

/** MediaPipe pose indices that belong to the face. Never copied anywhere. */
export const FACE_LANDMARK_INDICES = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const;

/** Body joints we keep, in MediaPipe index order (11–32). */
export const BODY_JOINTS = [
  'left_shoulder', 'right_shoulder',
  'left_elbow', 'right_elbow',
  'left_wrist', 'right_wrist',
  'left_pinky', 'right_pinky',
  'left_index', 'right_index',
  'left_thumb', 'right_thumb',
  'left_hip', 'right_hip',
  'left_knee', 'right_knee',
  'left_ankle', 'right_ankle',
  'left_heel', 'right_heel',
  'left_foot_index', 'right_foot_index',
] as const;

export type BodyJoint = (typeof BODY_JOINTS)[number];

/** First MediaPipe index that is a body joint. */
export const FIRST_BODY_INDEX = 11;
export const MEDIAPIPE_POSE_POINTS = 33;
export const BODY_POINTS = BODY_JOINTS.length; // 22

/** Normalized image coordinates (0–1, y grows downward) and MediaPipe visibility (0–1). */
export type Point = { x: number; y: number; v: number };

export type BodyFrame = {
  /** Milliseconds since the set started. */
  t: number;
  points: Partial<Record<BodyJoint, Point>>;
};

export type RawLandmark = { x: number; y: number; z?: number; visibility?: number };

/** Below this visibility a point is treated as missing. */
export const MIN_VISIBILITY = 0.5;

function toPoint(l: RawLandmark | undefined): Point | undefined {
  if (!l || !Number.isFinite(l.x) || !Number.isFinite(l.y)) return undefined;
  const v = Number.isFinite(l.visibility) ? (l.visibility as number) : 1;
  return { x: l.x, y: l.y, v };
}

/**
 * Builds a face-free frame. Accepts either all 33 MediaPipe points (face points are skipped)
 * or the 22 body-only points the native module sends. Any other length is rejected, so a
 * future model with a different layout can't slip face points into a body slot.
 */
export function toBodyFrame(raw: ArrayLike<RawLandmark>, t: number): BodyFrame {
  let offset: number;
  if (raw.length === MEDIAPIPE_POSE_POINTS) offset = FIRST_BODY_INDEX;
  else if (raw.length === BODY_POINTS) offset = 0;
  else throw new Error(`unexpected landmark count ${raw.length}`);
  const points: BodyFrame['points'] = {};
  BODY_JOINTS.forEach((joint, i) => {
    const p = toPoint(raw[offset + i]);
    if (p) points[joint] = p;
  });
  return { t, points };
}

/** Decodes the native module's packed buffer: 22 × (x, y, visibility), body joints only. */
export function bodyFrameFromPacked(buf: ArrayLike<number>, t: number): BodyFrame {
  if (buf.length !== BODY_POINTS * 3) throw new Error(`unexpected packed length ${buf.length}`);
  const raw: RawLandmark[] = [];
  for (let i = 0; i < BODY_POINTS; i++) {
    raw.push({ x: buf[i * 3], y: buf[i * 3 + 1], visibility: buf[i * 3 + 2] });
  }
  return toBodyFrame(raw, t);
}

/** A point if it is visible enough to measure from. */
export function visible(frame: BodyFrame, joint: BodyJoint): Point | undefined {
  const p = frame.points[joint];
  return p && p.v >= MIN_VISIBILITY ? p : undefined;
}

/** True when a skeleton (as stored or shared) holds only body joints. Used before upload. */
export function isFaceFree(skeleton: ReadonlyArray<{ points: Record<string, unknown> }>): boolean {
  const allowed = new Set<string>(BODY_JOINTS);
  return skeleton.every((f) => Object.keys(f.points).every((k) => allowed.has(k)));
}
