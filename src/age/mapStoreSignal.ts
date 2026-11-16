// Pure mapping from the native module's result to the app's StoreAgeSignal. No react-native imports so
// `node --test` can run it. The native result carries only status + bounds (see modules/store-age-signal).

export type StoreAgeSource = 'apple_declared_age_range' | 'google_play_age_signals';

export interface StoreAgeSignal {
  source: StoreAgeSource;
  /** Lowest age in the declared range, in whole years (null if the store gives no lower bound). */
  lower: number | null;
  /** Highest age in the declared range (null if open-ended, e.g. "18+"). */
  upper: number | null;
}

export const AGE_GATES: number[] = [16, 18];

export function validBound(v: unknown): number | null {
  return typeof v === 'number' && Number.isInteger(v) && v >= 0 && v <= 120 ? v : null;
}

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null;
}

/** True only for the native `revoked` status. Anything malformed is not "revoked". */
export function isRevokedResult(raw: unknown): boolean {
  return isObject(raw) && raw.status === 'revoked';
}

/**
 * sharing -> bounds (validated: integers 0..120, upper >= lower, at least one bound);
 * declined / unavailable / verification_required / revoked / anything malformed -> null (DOB alone).
 */
export function mapStoreSignal(raw: unknown, source: StoreAgeSource): StoreAgeSignal | null {
  if (!isObject(raw) || raw.status !== 'sharing') return null;
  const lower = validBound(raw.lower);
  const upper = validBound(raw.upper);
  if (lower === null && upper === null) return null;
  // A present-but-invalid bound means the response is untrustworthy: use nothing rather than half.
  if (raw.lower != null && lower === null) return null;
  if (raw.upper != null && upper === null) return null;
  if (lower !== null && upper !== null && upper < lower) return null;
  return { source, lower, upper };
}
