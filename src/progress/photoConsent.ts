/**
 * First-use photo opt-in and share-with-coach sheet logging (no UI in this pass).
 *
 * Continue with the switch off logs "off" with the text version and hash.
 * Not now logs "dismissed" (or the client can log nothing by not calling dismiss).
 * The sheet is shown again only when the user opens Photos / share again: no automatic re-prompts.
 * [ATTORNEY] Counsel phase5-review §1.
 */
export const DEFAULT_PHOTO_OPT_IN_CHECKED = false as const;
export const DEFAULT_PHOTO_SHARE_OPT_IN_CHECKED = false as const;

/** Automatic re-prompts are not allowed. */
export const PHOTO_AUTO_REPROMPT = false as const;

export type PhotoConsentKind = 'progress_photos' | 'photo_coach_sharing';
export type PhotoSheetDecision = 'on' | 'off' | 'dismissed';

export type PhotoConsentLog = {
  kind: PhotoConsentKind;
  decision: PhotoSheetDecision;
  /** Required for Continue (on or off). Omitted for dismissed. */
  version?: string;
  textHash?: string;
};

const HASH = /^[0-9a-f]{64}$/;

export function shouldAutoRepromptPhotos(): false {
  return PHOTO_AUTO_REPROMPT;
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
