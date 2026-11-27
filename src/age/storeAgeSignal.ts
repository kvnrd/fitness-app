import { Platform } from 'react-native';
import { requireOptionalNativeModule } from 'expo';
import { AGE_GATES, isRevokedResult, mapStoreSignal } from './mapStoreSignal';
import type { StoreAgeSignal, StoreAgeSource } from './mapStoreSignal';

export type { StoreAgeSignal, StoreAgeSource } from './mapStoreSignal';

/**
 * App-store age signal (Counsel C1): Apple's Declared Age Range API (iOS 26+) or Google Play Age Signals
 * (Android). Only derived whole-year bounds and which store answered ever leave this module; the raw
 * native result is dropped as soon as it is mapped and is never logged, stored or sent.
 *
 * The native module (modules/store-age-signal) is optional: web, Expo Go and builds without it return null
 * and the server uses the date of birth alone. See docs/store-age-signal.md.
 */
interface NativeModule {
  requestAgeRange(gates: number[]): Promise<unknown>;
}

function native(): NativeModule | null {
  if (Platform.OS !== 'ios' && Platform.OS !== 'android') return null;
  try {
    return requireOptionalNativeModule<NativeModule>('StoreAgeSignal');
  } catch {
    return null;
  }
}

/**
 * The store prompt can hang (for example a build without the Declared Age Range entitlement, or the
 * store service not answering). Never block sign-up on it: after this long it counts as "no signal" and
 * the server uses the date of birth alone, the same as Expo Go and web.
 */
export const STORE_SIGNAL_TIMEOUT_MS = 20_000;

function withTimeout<T>(p: Promise<T>, ms = STORE_SIGNAL_TIMEOUT_MS): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('store_signal_timeout')), ms);
    p.then(
      (v) => { clearTimeout(timer); resolve(v); },
      (e) => { clearTimeout(timer); reject(e); },
    );
  });
}

function source(): StoreAgeSource {
  return Platform.OS === 'ios' ? 'apple_declared_age_range' : 'google_play_age_signals';
}

export async function getStoreAgeSignal(): Promise<StoreAgeSignal | null> {
  const mod = native();
  if (!mod) return null;
  let raw: unknown = null;
  try {
    raw = await withTimeout(mod.requestAgeRange(AGE_GATES));
    // revoked is "no signal" here; the launch check below handles it.
    return mapStoreSignal(raw, source());
  } catch {
    return null;
  } finally {
    raw = null; // drop the raw response (Texas SB 2420 §121.055(b))
  }
}

type RevokedListener = () => void;
const revokedListeners = new Set<RevokedListener>();

/** Hook point: called when checkStoreAgeSharingRevoked() finds that sharing / app approval was revoked. */
export function onStoreAgeSignalRevoked(listener: RevokedListener): () => void {
  revokedListeners.add(listener);
  return () => {
    revokedListeners.delete(listener);
  };
}

/**
 * Call at launch for signed-in users. Returns true if the store reports that the user or parent revoked
 * sharing / app approval. Nothing is stored or sent from here.
 *
 * TODO(server, Counsel rule): a signal once received counts as actual knowledge, so a revocation must
 * NEVER raise an age or reopen an adult path. The server should only (at most) keep the account in its
 * current, lower-or-equal band and may require parent re-confirmation. Record nothing personal
 * (no install id, no dates, no raw response).
 *
 * Note: the Play Age Signals 0.0.4 client API has no explicit "revoked" value; revocation is otherwise
 * reported to the developer through Play Console (installId list). See docs/store-age-signal.md.
 */
export async function checkStoreAgeSharingRevoked(): Promise<boolean> {
  const mod = native();
  if (!mod) return false;
  let raw: unknown = null;
  try {
    raw = await withTimeout(mod.requestAgeRange(AGE_GATES));
    const revoked = isRevokedResult(raw);
    if (revoked) {
      for (const l of Array.from(revokedListeners)) {
        try {
          l();
        } catch {
          // a listener's failure must not affect the others
        }
      }
    }
    return revoked;
  } catch {
    return false;
  } finally {
    raw = null;
  }
}
