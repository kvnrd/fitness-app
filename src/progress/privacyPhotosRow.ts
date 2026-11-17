/**
 * Profile › Privacy "Progress photos" row (logic + presentational props).
 * Counsel Phase 5b rev 3 / Kevin: 16–17 row is disabled, no chevron, no action.
 */
import { canUseProgressPhotos } from '../features/progressPhotos.ts';
import {
  PHOTO_LIBRARY_LINE,
  PROGRESS_PHOTOS_OFF,
  PROGRESS_PHOTOS_ON,
  PROGRESS_PHOTOS_ROW_LABEL,
  TEEN_PHOTOS_AVAILABLE_AT_18,
  TEEN_PHOTOS_AVAILABLE_AT_18_A11Y,
} from './phase5bCopy.ts';

export const PRIVACY_PHOTOS_LIBRARY_LINE = PHOTO_LIBRARY_LINE;
export const TEEN_PHOTOS_AVAILABLE_AT_18_COPY = TEEN_PHOTOS_AVAILABLE_AT_18;

export type PrivacyPhotosRowState = 'available_at_18' | 'not_opted_in' | 'opted_in';

export type PrivacyPhotosRow = {
  state: PrivacyPhotosRowState;
  label: typeof PROGRESS_PHOTOS_ROW_LABEL;
  libraryLine: typeof PRIVACY_PHOTOS_LIBRARY_LINE;
  statusCopy: string;
  subtitle?: string;
  accessibilityLabel: string;
  accessibilityState?: { disabled: true };
  opensOptIn: boolean;
  opensPicker: boolean;
  opensSettings: boolean;
  showChevron: boolean;
  disabled: boolean;
};

export function privacyPhotosRow(opts: { isMinor: boolean; photoOptedIn: boolean }): PrivacyPhotosRow {
  const libraryLine = PRIVACY_PHOTOS_LIBRARY_LINE;
  if (opts.isMinor || !canUseProgressPhotos({ is_minor: opts.isMinor })) {
    return {
      state: 'available_at_18',
      label: PROGRESS_PHOTOS_ROW_LABEL,
      libraryLine,
      statusCopy: TEEN_PHOTOS_AVAILABLE_AT_18,
      subtitle: TEEN_PHOTOS_AVAILABLE_AT_18,
      accessibilityLabel: TEEN_PHOTOS_AVAILABLE_AT_18_A11Y,
      accessibilityState: { disabled: true },
      opensOptIn: false,
      opensPicker: false,
      opensSettings: false,
      showChevron: false,
      disabled: true,
    };
  }
  if (!opts.photoOptedIn) {
    return {
      state: 'not_opted_in',
      label: PROGRESS_PHOTOS_ROW_LABEL,
      libraryLine,
      statusCopy: PROGRESS_PHOTOS_OFF,
      accessibilityLabel: `${PROGRESS_PHOTOS_ROW_LABEL}. ${PROGRESS_PHOTOS_OFF}`,
      opensOptIn: false,
      opensPicker: false,
      opensSettings: true,
      showChevron: true,
      disabled: false,
    };
  }
  return {
    state: 'opted_in',
    label: PROGRESS_PHOTOS_ROW_LABEL,
    libraryLine,
    statusCopy: PROGRESS_PHOTOS_ON,
    accessibilityLabel: `${PROGRESS_PHOTOS_ROW_LABEL}. ${PROGRESS_PHOTOS_ON}`,
    opensOptIn: false,
    opensPicker: false,
    opensSettings: true,
    showChevron: true,
    disabled: false,
  };
}
