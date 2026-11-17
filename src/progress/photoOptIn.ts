/**
 * First-use progress-photo opt-in. Never pre-checked. No row / no flag means off.
 * This is separate from health_data and from coach sharing (Counsel: collection vs sharing).
 */
import type { KeyValueAdapter } from '../onboarding/deviceSetupStore.ts';
import { DEFAULT_PHOTO_OPT_IN_CHECKED } from './photoConsent.ts';

export { DEFAULT_PHOTO_OPT_IN_CHECKED };

const key = (uid: string) => `progress.photos.optin.v1.${uid}`;

export type PhotoOptInState = { optedIn: boolean; at: number | null };

export type PhotoOptInStore = ReturnType<typeof createPhotoOptInStore>;

export function createPhotoOptInStore(opts: { storage: KeyValueAdapter; now?: () => number }) {
  const now = opts.now ?? (() => Date.now());
  const { storage } = opts;

  return {
    async load(uid: string): Promise<PhotoOptInState> {
      const raw = await storage.getItem(key(uid));
      if (!raw) return { optedIn: false, at: null };
      try {
        const o = JSON.parse(raw) as { v: number; optedIn?: boolean; at?: number | null };
        if (!o || o.v !== 1) return { optedIn: false, at: null };
        return { optedIn: o.optedIn === true, at: o.at ?? null };
      } catch {
        return { optedIn: false, at: null };
      }
    },

    /** Only an explicit `true` turns it on. Passing true by default is impossible here. */
    async set(uid: string, optedIn: boolean): Promise<PhotoOptInState> {
      const state: PhotoOptInState = optedIn ? { optedIn: true, at: now() } : { optedIn: false, at: null };
      if (!state.optedIn) await storage.removeItem(key(uid));
      else await storage.setItem(key(uid), JSON.stringify({ v: 1, ...state }));
      return state;
    },
  };
}
