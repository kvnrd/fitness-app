import { Platform } from 'react-native';

/**
 * App-store age signal (Counsel C1): Apple's Declared Age Range API (iOS) or Google Play Age Signals
 * (Android). Only the derived whole-year bounds and which store answered ever leave this module; the
 * raw store response is dropped as soon as the bounds are read and is never logged, stored or sent.
 *
 * NOT WIRED YET: neither API has an Expo module. A small native module (config plugin + dev build)
 * must implement `readNativeSignal` below. Until then this returns null and the server uses the DOB
 * alone. See docs/phase-2-backend.md, "Kevin's setup checklist".
 */
export type StoreAgeSource = 'apple_declared_age_range' | 'google_play_age_signals';

export interface StoreAgeSignal {
  source: StoreAgeSource;
  /** Lowest age in the declared range, in whole years (null if the store gives no lower bound). */
  lower: number | null;
  /** Highest age in the declared range (null if open-ended, e.g. "18+"). */
  upper: number | null;
}

type RawRange = { lowerBound?: number | null; upperBound?: number | null } | null;

/** Placeholder for the native call. Must return the store's range or null (not available / declined). */
async function readNativeSignal(): Promise<RawRange> {
  return null;
}

function bound(v: unknown): number | null {
  return typeof v === 'number' && Number.isInteger(v) && v >= 0 && v <= 120 ? v : null;
}

export async function getStoreAgeSignal(): Promise<StoreAgeSignal | null> {
  if (Platform.OS !== 'ios' && Platform.OS !== 'android') return null;
  let raw: RawRange = null;
  try {
    raw = await readNativeSignal();
    if (!raw) return null;
    const lower = bound(raw.lowerBound);
    const upper = bound(raw.upperBound);
    if (lower === null && upper === null) return null;
    return { source: Platform.OS === 'ios' ? 'apple_declared_age_range' : 'google_play_age_signals', lower, upper };
  } catch {
    return null;
  } finally {
    raw = null; // drop the raw response (Texas SB 2420 §121.055(b))
  }
}
