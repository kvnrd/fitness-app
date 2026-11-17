/**
 * Texas CUBI (Bus. & Com. Code §503.001) and RCW 19.373.010: we never capture a record
 * of face geometry, and we never extract body or face measurements from photos.
 *
 * Alignment may use a ghost overlay, whole-image comparison, or on-device body-only
 * pose points. Face points are discarded and nothing from the pose is stored.
 * [ATTORNEY] Counsel phase5-review §2.
 */
export const PHOTO_ALIGNMENT_MODES = ['overlay', 'whole_image', 'on_device_body_pose'] as const;
export type PhotoAlignmentMode = (typeof PHOTO_ALIGNMENT_MODES)[number];

/** Things we must not build (or must bring back to Counsel first). */
export const CUBI_FORBIDDEN_FEATURES = [
  'face_detection',
  'face_landmarks',
  'auto_crop',
  'face_blur',
  'face_recognition',
  'body_measurements_from_photos',
  'face_measurements_from_photos',
] as const;

/** Landmark names treated as face geometry and dropped from any on-device pose. */
export const FACE_POSE_POINTS = [
  'nose',
  'nose_tip',
  'left_eye',
  'right_eye',
  'left_eye_inner',
  'right_eye_inner',
  'left_eye_outer',
  'right_eye_outer',
  'left_ear',
  'right_ear',
  'mouth',
  'mouth_left',
  'mouth_right',
  'lips',
  'jaw',
  'chin',
  'forehead',
  'face',
] as const;

export type PosePoint = { name: string; x: number; y: number };

export function isFacePosePoint(name: string): boolean {
  const n = name.trim().toLowerCase().replace(/[\s-]+/g, '_');
  return (FACE_POSE_POINTS as readonly string[]).includes(n) || n.startsWith('face') || n.includes('eye') || n.includes('ear') || n.includes('mouth') || n.includes('nose') || n.includes('jaw') || n.includes('lip');
}

/** Body-only pose points for alignment. Face points are discarded. The result is not stored. */
export function bodyOnlyPosePoints(points: readonly PosePoint[]): PosePoint[] {
  return points.filter((p) => !isFacePosePoint(p.name));
}

export function shouldStorePosePoints(): false {
  return false;
}

export function isAllowedAlignmentMode(mode: string): mode is PhotoAlignmentMode {
  return (PHOTO_ALIGNMENT_MODES as readonly string[]).includes(mode);
}
