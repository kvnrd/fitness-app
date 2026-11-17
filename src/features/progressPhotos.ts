import type { Profile } from '../auth/SessionProvider';
import { FACE_RECOGNITION_ENABLED, assertNoFaceRecognition } from '../progress/photoCrypto.ts';
import { canShareProgressPhoto, type PhotoShareGate } from '../progress/photoShare.ts';

/**
 * Counsel Q8: no progress photos for 16-17 users, ever (no capture, no upload, no storage).
 * This hides the UI for everyone under 18. The server enforces it too: public.progress_photos
 * trigger, and the progress-photos storage bucket policy (adult + health_data + first-use
 * opt-in). There is no photo UI yet; any future one must check this first.
 */
export function canUseProgressPhotos(profile: Pick<Profile, 'is_minor'> | null | undefined): boolean {
  return !!profile && profile.is_minor === false;
}

/** Capture / upload also needs health_data and the first-use opt-in (never pre-checked). */
export function canUploadProgressPhoto(opts: {
  profile: Pick<Profile, 'is_minor'> | null | undefined;
  healthOn: boolean;
  photoOptedIn: boolean;
}): boolean {
  assertNoFaceRecognition();
  return canUseProgressPhotos(opts.profile) && opts.healthOn === true && opts.photoOptedIn === true;
}

export function canSharePhotoWithCoach(profile: Pick<Profile, 'is_minor'> | null | undefined, gate: Omit<PhotoShareGate, 'isMinor'>): boolean {
  return canShareProgressPhoto({ ...gate, isMinor: profile?.is_minor === true });
}

export { FACE_RECOGNITION_ENABLED };
