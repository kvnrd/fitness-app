/**
 * Photo lock, blur, compare, and gallery privacy line. Logic and copy only; no UI.
 * [ATTORNEY] Counsel phase5-review Rev 2.
 */
import { CAMERA_ROLL_SAVE_OPTION, PHOTO_LOCK_MODE, type PhotoLockMode } from './phase5Flags.ts';

export { CAMERA_ROLL_SAVE_OPTION, PHOTO_LOCK_MODE, type PhotoLockMode };

/** Re-lock after 1 minute away, whether the lock is always on or a setting. */
export const PHOTO_LOCK_RELOCK_MS = 60_000;

/** App-switcher blur is always on and is not tied to the thumbnail-blur setting. */
export const PHOTO_APP_SWITCHER_BLUR_ALWAYS_ON = true;

export type BiometricLockKind = 'face_id' | 'touch_id' | 'android';

export type PhotoLockState = {
  /** When the mode is always_on this is forced true. */
  lockOn: boolean;
  biometric: BiometricLockKind;
};

export type PhotoPrivacySettings = {
  lock: PhotoLockState;
  /** Independent of the app-switcher blur. */
  thumbnailBlur: boolean;
  /** Setting (or whether any copies were saved). Ignored when CAMERA_ROLL_SAVE_OPTION is false. */
  cameraRollCopies: boolean;
};

export function isPhotoLockOn(lockOn: boolean, mode: PhotoLockMode = PHOTO_LOCK_MODE): boolean {
  return mode === 'always_on' ? true : lockOn;
}

export function defaultPhotoLockOn(mode: PhotoLockMode = PHOTO_LOCK_MODE): boolean {
  return mode === 'always_on' || mode === 'default_on_setting';
}

/** User default for the camera-roll save option: off. */
export const DEFAULT_CAMERA_ROLL_COPIES = false;

export function defaultPhotoPrivacySettings(biometric: BiometricLockKind = 'face_id'): PhotoPrivacySettings {
  return {
    lock: { lockOn: defaultPhotoLockOn(), biometric },
    thumbnailBlur: true,
    cameraRollCopies: DEFAULT_CAMERA_ROLL_COPIES,
  };
}

export function shouldRelockPhotos(lastLeftAt: number | null, now: number, relockMs: number = PHOTO_LOCK_RELOCK_MS): boolean {
  if (lastLeftAt == null) return false;
  return now - lastLeftAt >= relockMs;
}

export function lockSubtitle(mode: PhotoLockMode = PHOTO_LOCK_MODE): string {
  if (mode === 'always_on') return 'Always on. Locks after 1 minute away.';
  return 'Locks after 1 minute away.';
}

export function lockOffWarning(): string {
  return 'Off. Anyone using your unlocked phone can open your photos.';
}

/** Platform lock-screen body. Touch ID is fingerprint only (Rev 2 correction). */
export function photoLockBody(kind: BiometricLockKind): string {
  const prefix = 'Unlock to see your progress photos. ';
  if (kind === 'face_id') return prefix + 'Your phone checks your face; we never receive or store face data.';
  if (kind === 'touch_id') return prefix + 'Your phone checks your fingerprint; we never receive or store it.';
  return prefix + 'Your phone checks your face or fingerprint; we never receive or store it.';
}

function lockPart(lock: PhotoLockState, mode: PhotoLockMode = PHOTO_LOCK_MODE): string {
  if (!isPhotoLockOn(lock.lockOn, mode)) return 'Not locked';
  if (lock.biometric === 'face_id') return 'Face ID';
  if (lock.biometric === 'touch_id') return 'Touch ID';
  return 'Locked';
}

function cameraRollPart(cameraRollCopies: boolean): string {
  if (!CAMERA_ROLL_SAVE_OPTION) return 'Not in your camera roll';
  return cameraRollCopies ? 'Some copies in your camera roll' : 'Not in your camera roll';
}

/** "Private · {lock} · {camera roll}" built from real state, never hard-coded. */
export function galleryPrivacyLine(settings: PhotoPrivacySettings, mode: PhotoLockMode = PHOTO_LOCK_MODE): string {
  return ['Private', lockPart(settings.lock, mode), cameraRollPart(settings.cameraRollCopies)].join(' · ');
}

/** Compare view: images are only scaled to fit and never cropped, rotated, or aligned. */
export const PHOTO_COMPARE_TRANSFORM = 'scale_to_fit' as const;

export function canCropCompare(): false {
  return false;
}
export function canAlignCompare(): false {
  return false;
}
export function canRotateCompare(): false {
  return false;
}

export const PHOTO_COMPARE_CAPTION = 'Shown as taken. Nothing is cropped or lined up for you.';

export function thumbnailBlurLabel(): string {
  return 'Blurs small previews until you open them.';
}

export type PhotoDeletionMode = 'turn_off' | 'delete_all';

export type PhotoDeletionPlan = {
  mode: PhotoDeletionMode;
  offerExportFirst: true;
  deleteDeviceImmediately: true;
  shredServerWithinDays: 30;
  revokeCoachImmediately: true;
  leavePhotosEnabled: boolean;
};

export function planPhotoDeletion(mode: PhotoDeletionMode): PhotoDeletionPlan {
  return {
    mode,
    offerExportFirst: true,
    deleteDeviceImmediately: true,
    shredServerWithinDays: 30,
    revokeCoachImmediately: true,
    leavePhotosEnabled: mode === 'delete_all',
  };
}

/** Row title. Android is "phone unlock" because the prompt may fall back to a PIN (Rev 3). */
export function lockRequireLabel(kind: BiometricLockKind): string {
  if (kind === 'face_id') return 'Require Face ID';
  if (kind === 'touch_id') return 'Require Touch ID';
  return 'Require phone unlock';
}
