/**
 * "Add photos" entry routing. Counsel Phase 5b rev 3 (c).
 */
import { canUseProgressPhotos, canUploadProgressPhoto } from '../features/progressPhotos.ts';
import {
  ADD_PHOTOS_BUTTON,
  ADD_PHOTOS_CANCEL,
  ADD_PHOTOS_CHOOSE_FROM_LIBRARY,
  ADD_PHOTOS_TAKE_PHOTO,
} from './phase5bCopy.ts';
import { hasImportConsent, shouldShowImportConsentJustInTime } from './photoConsent.ts';

export { ADD_PHOTOS_BUTTON, ADD_PHOTOS_CANCEL, ADD_PHOTOS_CHOOSE_FROM_LIBRARY, ADD_PHOTOS_TAKE_PHOTO };

export type AddPhotosStep =
  | { step: 'hidden_until_18' }
  | { step: 'opt_in' }
  | { step: 'chooser'; options: readonly ['Take photo', 'Choose from library'] }
  | { step: 'camera' }
  | { step: 'import_consent' }
  | { step: 'library_picker' };

export function addPhotosEntry(opts: {
  isMinor: boolean;
  photoOptedIn: boolean;
  importConsentVersion?: string | null;
  source?: 'entry' | 'take_photo' | 'choose_from_library';
}): AddPhotosStep {
  if (opts.isMinor) return { step: 'hidden_until_18' };
  if (!opts.photoOptedIn) return { step: 'opt_in' };
  if (opts.source === 'take_photo') return { step: 'camera' };
  if (opts.source === 'choose_from_library') {
    if (shouldShowImportConsentJustInTime({ importTapped: true, importConsentVersion: opts.importConsentVersion })) {
      return { step: 'import_consent' };
    }
    return { step: 'library_picker' };
  }
  return { step: 'chooser', options: [ADD_PHOTOS_TAKE_PHOTO, ADD_PHOTOS_CHOOSE_FROM_LIBRARY] };
}

export function addPhotosAvailable(opts: { isMinor: boolean }): boolean {
  if (opts.isMinor) return false;
  return canUseProgressPhotos({ is_minor: false });
}

export function importRequiresConsent(version: string | null | undefined): boolean {
  return !hasImportConsent(version);
}

export { canUploadProgressPhoto };
