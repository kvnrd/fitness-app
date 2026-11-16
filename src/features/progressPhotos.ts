import type { Profile } from '../auth/SessionProvider';

/**
 * Counsel Q8: no progress photos for 16-17 users, ever (no capture, no upload, no storage).
 * This hides the UI. The server enforces it too: public.progress_photos trigger, and the
 * progress-photos storage bucket policy (adult + health_data consent only).
 * There is no photo UI yet; any future one must check this first.
 */
export function canUseProgressPhotos(profile: Pick<Profile, 'is_minor'> | null | undefined): boolean {
  return !!profile && profile.is_minor === false;
}
