/**
 * Maps a normalized pose point (0–1 in the analyzed frame) onto a camera preview drawn with
 * "aspect fill" (iOS resizeAspectFill, Android FILL_CENTER): the frame is scaled to cover the view
 * and centered, so its edges may be cropped. Returns null for points that land outside the view.
 */
export function previewPoint(
  x: number, y: number,
  frame: { w: number; h: number },
  view: { w: number; h: number },
): { x: number; y: number } | null {
  if (!(frame.w > 0 && frame.h > 0 && view.w > 0 && view.h > 0)) return null;
  const scale = Math.max(view.w / frame.w, view.h / frame.h);
  const ox = (view.w - frame.w * scale) / 2;
  const oy = (view.h - frame.h * scale) / 2;
  const px = ox + x * frame.w * scale;
  const py = oy + y * frame.h * scale;
  return px < 0 || py < 0 || px > view.w || py > view.h ? null : { x: px, y: py };
}

/** Bones drawn on the live skeleton (body joints only). */
export const BONES = [
  ['left_shoulder', 'right_shoulder'], ['left_hip', 'right_hip'],
  ['left_shoulder', 'left_elbow'], ['left_elbow', 'left_wrist'],
  ['right_shoulder', 'right_elbow'], ['right_elbow', 'right_wrist'],
  ['left_shoulder', 'left_hip'], ['right_shoulder', 'right_hip'],
  ['left_hip', 'left_knee'], ['left_knee', 'left_ankle'],
  ['right_hip', 'right_knee'], ['right_knee', 'right_ankle'],
  ['left_ankle', 'left_foot_index'], ['right_ankle', 'right_foot_index'],
] as const;
