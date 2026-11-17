/**
 * Hash-matching (PhotoDNA) hook. Imported photos are checked before storage,
 * and again before any coach share. Camera photos keep the check on share.
 * The vendor must keep nothing on a non-match. A failure uses generic copy;
 * never say why, and never reveal a hash match.
 */
export const IMPORT_SAFETY_GENERIC_BLOCK = 'This photo can’t be added.';

export type PhotoSafetyStatus = 'pending' | 'passed' | 'failed';

export type PhotoSafetyResult = {
  status: PhotoSafetyStatus;
  /** Always false: the vendor keeps nothing on a non-match. */
  vendorRetainedOnNonMatch: false;
};

export type PhotoSafetyHook = (jpegPlaintext: Uint8Array) => Promise<PhotoSafetyResult> | PhotoSafetyResult;

export async function runImportSafetyCheck(jpegPlaintext: Uint8Array, hook: PhotoSafetyHook): Promise<PhotoSafetyResult> {
  const result = await hook(jpegPlaintext);
  return { status: result.status, vendorRetainedOnNonMatch: false };
}

export function assertSafetyPassed(result: PhotoSafetyResult | null | undefined): void {
  if (!result || result.status !== 'passed') throw new Error('safety_check_required');
}
