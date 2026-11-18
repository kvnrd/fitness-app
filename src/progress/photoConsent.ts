/**
 * First-use photo opt-in and share-with-coach sheet logging (no UI in this pass).
 *
 * Continue with the switch off logs "off" with the text version and hash.
 * Not now logs "dismissed" (or the client can log nothing by not calling dismiss).
 * The sheet is shown again only when the user opens Photos / share again: no automatic re-prompts.
 * [ATTORNEY] Counsel phase5-review §1 and Phase 5b (1).
 *
 * Phase 5b: first Import tap shows the revised take-or-import opt-in just in time and logs a new
 * consent row. Launch is never blocked. Existing camera consents (photos-v1) stay valid for camera photos.
 */
import { sha256HexPure } from '../legal/hash.ts';
import { PHOTO_LIBRARY_LINE, PHOTO_OPT_IN_CONSENT_TEXT } from './phase5bCopy.ts';

export const DEFAULT_PHOTO_OPT_IN_CHECKED = false as const;
export const DEFAULT_PHOTO_SHARE_OPT_IN_CHECKED = false as const;

/** Automatic re-prompts are not allowed. */
export const PHOTO_AUTO_REPROMPT = false as const;

export type PhotoConsentKind = 'progress_photos' | 'photo_coach_sharing' | 'progress_photos_import';
export type PhotoSheetDecision = 'on' | 'off' | 'dismissed';

export type PhotoConsentLog = {
  kind: PhotoConsentKind;
  decision: PhotoSheetDecision;
  /** Required for Continue (on or off). Omitted for dismissed. */
  version?: string;
  textHash?: string;
};

const HASH = /^[0-9a-f]{64}$/;

/** Camera-only consents such as photos-v1 stay valid for camera photos. */
export const PHOTO_CAMERA_CONSENT_VERSION = 'photos-v1';

/** Revised take-or-import opt-in. Counsel Phase 5b rev 5, hashed body in phase5bCopy.ts. */
export const PHOTO_IMPORT_CONSENT_VERSION = 'photos-v2-2026-11-17-draft';
export const PHOTO_IMPORT_CONSENT_TEXT = PHOTO_OPT_IN_CONSENT_TEXT;
export const PHOTO_IMPORT_CONSENT_HASH = sha256HexPure(PHOTO_IMPORT_CONSENT_TEXT);

/** Gallery / Privacy settings line. Counsel-approved; not part of the hashed opt-in body. */
export const PHOTO_LIBRARY_PRIVACY_LINE = PHOTO_LIBRARY_LINE;

export function shouldAutoRepromptPhotos(): false {
  return PHOTO_AUTO_REPROMPT;
}

/** Existing opted-in users are not blocked at launch and are not forced to re-agree. */
export function photoConsentBlocksLaunch(): false {
  return false;
}

export function hasImportConsent(version: string | null | undefined): boolean {
  return version === PHOTO_IMPORT_CONSENT_VERSION;
}

/**
 * First Import tap shows the revised opt-in just in time.
 * Cancel imports nothing and changes no consent row.
 */
export function shouldShowImportConsentJustInTime(opts: {
  importTapped: boolean;
  importConsentVersion?: string | null;
}): boolean {
  if (!opts.importTapped) return false;
  return !hasImportConsent(opts.importConsentVersion);
}

export function importConsentCanceled(): { imported: false; consentUnchanged: true } {
  return { imported: false, consentUnchanged: true };
}

export function importConsentAgreed(): PhotoConsentLog {
  return photoSheetContinue('progress_photos_import', true, PHOTO_IMPORT_CONSENT_VERSION, PHOTO_IMPORT_CONSENT_HASH);
}

export function photoSheetContinue(
  kind: PhotoConsentKind,
  switchOn: boolean,
  version: string,
  textHash: string,
): PhotoConsentLog {
  if (!version.trim() || version.trim().length > 64) throw new Error('invalid_text_version');
  if (!HASH.test(textHash)) throw new Error('invalid_text_hash');
  return { kind, decision: switchOn ? 'on' : 'off', version: version.trim(), textHash };
}

export function photoSheetDismissed(kind: PhotoConsentKind): PhotoConsentLog {
  return { kind, decision: 'dismissed' };
}
