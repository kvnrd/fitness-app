/**
 * Counsel-approved Phase 5b rev 5 copy (rev 3 UI strings plus the rev 5 streak rule). Word for word. Curly apostrophes only.
 * Photo opt-in body below is the hashed consent text (version photos-v2-2026-11-17-draft).
 */
export const ADD_PHOTOS_BUTTON = 'Add photos' as const;
export const ADD_PHOTOS_SHEET_TITLE = 'Add progress photos' as const;
export const ADD_PHOTOS_TAKE_PHOTO = 'Take photo' as const;
export const ADD_PHOTOS_TAKE_PHOTO_SUB = 'Use the pose guide for front, side and back.' as const;
export const ADD_PHOTOS_CHOOSE_FROM_LIBRARY = 'Choose from library' as const;
export const ADD_PHOTOS_CHOOSE_FROM_LIBRARY_SUB = 'Pick photos of yourself you already have.' as const;
export const ADD_PHOTOS_CAMERA_ROLL_LABEL = 'Save copies to camera roll' as const;
export const ADD_PHOTOS_CAMERA_ROLL_SUB =
  'Off by default. Copies there aren’t locked or encrypted, and we can’t delete them.';
export const ADD_PHOTOS_CAMERA_ROLL_NOTE = 'Applies to photos you take in the app.' as const;
export const ADD_PHOTOS_CANCEL = 'Cancel' as const;

export const IMPORT_CONSENT_TITLE = 'Add photos from your library?' as const;
export const IMPORT_CONSENT_BODY =
  'Photos you take in the app or choose from your photo library, and each photo’s date. We remove location and device details before upload. Your phone’s photo picker shares only the photos you choose.';
export const IMPORT_CONSENT_CANCEL = 'Cancel' as const;
export const IMPORT_CONSENT_AGREE = 'Agree' as const;

export const IMPORT_CONFIRM_TITLE = (i: number, n: number) => `Add photos · ${i} of ${n}`;
export const IMPORT_POSE_LABEL = 'Pose' as const;
export const IMPORT_DATE_LABEL = 'Date taken' as const;
export const IMPORT_DATE_EDIT = 'Edit' as const;
export const IMPORT_DATE_CONFIRM =
  'We read this date from the photo. Change it if it’s wrong. We keep only the date.';
export const IMPORT_STRIP_NOTE =
  'We remove location and device details before upload. The original stays in your photo library; deleting it here won’t remove it there.';
export const IMPORT_SKIP = 'Skip' as const;
export const IMPORT_ADD = 'Add photo' as const;
export const IMPORT_BLOCKED = 'This photo can’t be added.' as const;
export function importAddedToast(n: number): string {
  return n === 1 ? '1 photo added.' : `${n} photos added.`;
}

export const PHOTO_LIBRARY_LINE =
  'We don’t access your photo library. If you import a photo, your phone’s photo picker shares only the photos you choose.';

export const PHOTO_OPT_IN_TITLE = 'Progress photos' as const;
export const PHOTO_OPT_IN_INTRO =
  'Take private front, side and back photos to see how your body changes over time.';
export const PHOTO_OPT_IN_COLLECT_LABEL = 'What we collect' as const;
export const PHOTO_OPT_IN_COLLECT =
  'Photos you take in the app or choose from your photo library, and each photo’s date. We remove location and device details before upload.';
export const PHOTO_OPT_IN_WHY_LABEL = 'Why' as const;
export const PHOTO_OPT_IN_WHY =
  'Only to show your progress to you, and to your coach if you choose to share a photo. Never used for ads, analytics or AI.';
export const PHOTO_OPT_IN_WHO_LABEL = 'Who sees them' as const;
export const PHOTO_OPT_IN_WHO =
  'Only you. Photos are encrypted before they leave your phone and locked behind Face ID or your passcode unless you turn the lock off. A coach sees a photo only if you turn on coach sharing and pick it.';
export const PHOTO_OPT_IN_OFF_LABEL = 'How to turn it off' as const;
export const PHOTO_OPT_IN_OFF =
  'Anytime in Profile › Privacy. Turning it off stops new photos and deletes the ones you’ve taken (we’ll offer you a copy first). Deleted photos are removed from your phone right away and from our servers and backups within 30 days. Copies you saved to your camera roll, and the originals of photos you chose from your library, aren’t affected.';
export const PHOTO_OPT_IN_HEALTH_NOTE_PREFIX = 'Progress photos are health data. See our' as const;
export const PHOTO_OPT_IN_HEALTH_NOTE_LINK = 'Consumer Health Data Privacy Policy' as const;
export const PHOTO_OPT_IN_SWITCH = 'Allow progress photos' as const;
export const PHOTO_OPT_IN_NOT_NOW = 'Not now' as const;
export const PHOTO_OPT_IN_CONTINUE = 'Continue' as const;
export const PHOTO_OPT_IN_FOOTER = 'Separate from Health data, AI planning and coach sharing.' as const;

/** Hashed first-use / revised take-or-import opt-in body (the three Counsel sections, full How-to-turn-it-off). */
export const PHOTO_OPT_IN_CONSENT_TEXT =
  `${PHOTO_OPT_IN_COLLECT_LABEL}: ${PHOTO_OPT_IN_COLLECT}\n\n` +
  `${PHOTO_OPT_IN_WHO_LABEL}: ${PHOTO_OPT_IN_WHO}\n\n` +
  `${PHOTO_OPT_IN_OFF_LABEL}: ${PHOTO_OPT_IN_OFF}`;

export const PHOTO_PRIVACY_TITLE = 'Photo privacy' as const;
export const PHOTO_PRIVACY_NOT_OPTED_SUB =
  'No photos are collected while this is off. You can set them up whenever you like.';
export const PHOTO_PRIVACY_LOCK = 'Require Face ID' as const;
export const PHOTO_PRIVACY_BLUR = 'Blur thumbnails' as const;
export const PHOTO_PRIVACY_BLUR_SUB = 'Blurs small previews until you open them.' as const;
export const PHOTO_PRIVACY_DOWNLOAD = 'Download my photos' as const;
export const PHOTO_PRIVACY_TURN_OFF = 'Turn off progress photos' as const;
export const PHOTO_PRIVACY_TURN_OFF_SUB = 'Deletes your photos. We’ll offer a copy first.' as const;
export const PHOTO_PRIVACY_DELETE_ALL = 'Delete all photos' as const;
export const PHOTO_PRIVACY_COACH_SHARING = 'Coach sharing' as const;
export const PHOTO_PRIVACY_WEIGHT_NOTE =
  '‘Show weight on photos’ appears here only when Health data is on.';

export const PROGRESS_PHOTOS_ROW_LABEL = 'Progress photos' as const;
export const PROGRESS_PHOTOS_ON = 'On' as const;
export const PROGRESS_PHOTOS_OFF = 'Off' as const;
export const TEEN_PHOTOS_AVAILABLE_AT_18 = 'Available when you turn 18.' as const;
export const TEEN_PHOTOS_AVAILABLE_AT_18_A11Y = 'Progress photos. Available when you turn 18.' as const;

export const TURNED_18_TITLE = 'Progress photos are now available' as const;
export const TURNED_18_BODY =
  'Now that you’re 18, you can choose to take private progress photos. They stay off unless you turn them on.';
export const TURNED_18_NOT_NOW = 'Not now' as const;
export const TURNED_18_LEARN_MORE = 'Learn more' as const;

export const RECAP_COMPLETE = 'Workout complete' as const;
export const RECAP_SAVED = 'Workout saved' as const;
export const RECAP_TOTAL_VOLUME = 'Total volume' as const;
export const RECAP_SETS = 'Sets' as const;
export const RECAP_EXERCISES = 'Exercises' as const;
export const RECAP_TIME = 'Time' as const;
export const RECAP_PRS = 'Personal records' as const;
export const RECAP_NO_PRS = 'No new PRs this time. Your records are in Progress › Strength.' as const;
export const RECAP_DONE = 'Done' as const;
export const HEAVIEST_LIFT = 'Heaviest lift' as const;
export const EST_1RM_LABEL = 'Est. 1RM' as const;

export function recapLastVolume(workout: string, n: string, unit: string): string {
  return `Last ${workout}: ${n} ${unit}`;
}
export function recapNewCount(n: number): string {
  return n === 1 ? '1 new' : `${n} new`;
}
export const PR_TOAST_NEW = (exercise: string) => `New PR · ${exercise}`;
export const PR_TOAST_MULTI = (n: number, exercise: string) => `${n} new PRs · ${exercise}`;
export function prDeltaOverBest(delta: string, unit: string, load: string, reps: number): string {
  return `+${delta} ${unit} over your best of ${load} × ${reps}`;
}
export function mostRepsAt(load: string, unit: string): string {
  return `Most reps at ${load} ${unit}`;
}
export function plusReps(n: number): string {
  return n === 1 ? '+1 rep' : `+${n} reps`;
}
export function mostRepsToastLine(load: string, unit: string, n: number): string {
  return `${mostRepsAt(load, unit)} · ${plusReps(n)}`;
}
export function heaviestLiftEstLine(n: string, unit: string): string {
  return `${HEAVIEST_LIFT} · ${EST_1RM_LABEL} ${n} ${unit}`;
}

export function prA11ySingle(exercise: string, load: string, unit: string, reps: number): string {
  return `New personal record. ${exercise}, ${load} ${unit} for ${reps} reps. Double-tap for details.`;
}
export function prA11yHeaviestAndE1rm(
  exercise: string, load: string, unit: string, reps: number, e1rm: string,
): string {
  return `Two new personal records. ${exercise}, ${load} ${unit} for ${reps} reps: heaviest lift and estimated 1 rep max ${e1rm} ${unit}. Double-tap for details.`;
}
export function prA11yMostReps(exercise: string, reps: number, load: string, unit: string, n: number): string {
  const more = n === 1 ? '1 more' : `${n} more`;
  return `New personal record. ${exercise}: ${reps} reps at ${load} ${unit}, ${more} than your previous best. Double-tap for details.`;
}

export function coachShareTitle(first: string): string {
  return `Share photos with ${first}?`;
}
export function coachShareIntro(first: string): string {
  return `Let your 1:1 coach, ${first}, see the progress photos you pick. ${first} is an independent coach, not part of [App].`;
}
export const COACH_SHARE_WHAT_LABEL = 'What’s shared' as const;
export const COACH_SHARE_WHAT =
  'Only photos you pick, one at a time, with their dates. Never your whole gallery, and never your weight unless you choose to show it.';
export const COACH_SHARE_WHY_LABEL = 'Why' as const;
export function coachShareWhy(first: string): string {
  return `So ${first} can check your progress and adjust your plan.`;
}
export const COACH_SHARE_WHO_LABEL = 'Who sees them' as const;
export function coachShareWho(first: string): string {
  return `Only ${first}, in the app. No downloads, and each photo is watermarked with your initials, but we can’t block screenshots. Shared photos go through an automated safety check.`;
}
export const COACH_SHARE_OFF_LABEL = 'How to turn it off' as const;
export function coachShareOff(first: string): string {
  return `Anytime in Profile › Privacy, or on any shared photo. When you turn it off, ${first} loses access right away and must delete any copies within 30 days, under our coach terms.`;
}
export function coachShareSwitch(first: string): string {
  return `Share picked photos with ${first}`;
}
export const COACH_SHARE_FOOTER = 'Separate from your progress photos choice.' as const;

export const GALLERY_LOCK_LINE_FACE = 'Private · Face ID · Not in your camera roll' as const;
export const PHOTOS_TAB = 'Photos' as const;
