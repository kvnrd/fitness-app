import type { PaceId } from './goals.ts';
import type { SetupDraft } from './setupPayload.ts';

/**
 * Device-only store for onboarding data that must not reach the server yet:
 *  - the steps 6-8 draft of a pending 16-17 account (uploaded when the parent link goes live), and
 *  - the adult weight goal (health data: uploaded only when the effective health switch is on).
 *
 * Keyed per user id. Storage is an injected async key-value adapter (tests use a Map; the app uses
 * deviceStorage.ts). NEVER put a JWT/token or a birth date in here.
 * [ATTORNEY] Counsel phase3-review #4: pending minors' draft is deleted at day 14, on sign-out, on deletion.
 */
export type KeyValueAdapter = {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
};

export const PENDING_DRAFT_TTL_MS = 14 * 24 * 60 * 60 * 1000;

export type WeightGoal = { current: number | null; target: number | null; unit: 'lb' | 'kg'; pace: PaceId | null };

type DraftRecord = { v: 1; createdAt: number; accountCreatedAt: number | null; pendingMinor: boolean; draft: SetupDraft };
type WeightRecord = { v: 1; createdAt: number; goal: WeightGoal };

const draftKey = (uid: string) => `setup.draft.v1.${uid}`;
const weightKey = (uid: string) => `setup.weight.v1.${uid}`;

/** Upload callbacks resolve true (or {ok:true}) on success; anything else, or a throw, keeps the device copy. */
export type UploadResult = boolean | { ok: boolean } | void;
const isOk = (r: UploadResult): boolean => r === true || (typeof r === 'object' && r !== null && r.ok === true);

/** Weight may leave the device only when the effective health switch is on. */
export function canUploadWeight({ healthOn }: { healthOn: boolean }): boolean {
  return healthOn === true;
}

function parse<T extends { v: number }>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    const o = JSON.parse(raw) as T;
    return o && o.v === 1 ? o : null;
  } catch {
    return null;
  }
}

export type DeviceSetupStore = ReturnType<typeof createDeviceSetupStore>;

export function createDeviceSetupStore(opts: {
  /** Non-secret preferences. */
  draftStorage: KeyValueAdapter;
  /** Health data (weight goal): SecureStore on native. */
  weightStorage: KeyValueAdapter;
  now?: () => number;
}) {
  const { draftStorage, weightStorage } = opts;
  const now = opts.now ?? (() => Date.now());

  return {
    /** Save or replace the draft. createdAt is kept from the first save. accountCreatedAt = profile creation time (pending minors). */
    async saveDraft(uid: string, draft: SetupDraft, meta: { pendingMinor: boolean; accountCreatedAt: number | null }): Promise<void> {
      const prev = parse<DraftRecord>(await draftStorage.getItem(draftKey(uid)));
      const rec: DraftRecord = {
        v: 1,
        createdAt: prev?.createdAt ?? now(),
        accountCreatedAt: meta.accountCreatedAt ?? prev?.accountCreatedAt ?? null,
        pendingMinor: meta.pendingMinor,
        draft,
      };
      await draftStorage.setItem(draftKey(uid), JSON.stringify(rec));
    },

    async loadDraft(uid: string): Promise<{ draft: SetupDraft; createdAt: number; pendingMinor: boolean } | null> {
      const rec = parse<DraftRecord>(await draftStorage.getItem(draftKey(uid)));
      return rec ? { draft: rec.draft, createdAt: rec.createdAt, pendingMinor: rec.pendingMinor } : null;
    },

    /**
     * Delete a pending-minor draft once 14 days have passed since the ACCOUNT was created (matches the server's
     * invite expiry: expires_at = created + 14 days, so day 14 exactly is expired). Returns true if deleted.
     * `accountCreatedAt` (ms) overrides the stored value when given.
     */
    async purgeExpired(uid: string, nowMs: number = now(), accountCreatedAt?: number): Promise<boolean> {
      const rec = parse<DraftRecord>(await draftStorage.getItem(draftKey(uid)));
      if (!rec || !rec.pendingMinor) return false;
      const start = accountCreatedAt ?? rec.accountCreatedAt;
      // Unknown start: fall back to when the draft was first saved (never keep longer than 14 days).
      const base = start ?? rec.createdAt;
      if (nowMs - base < PENDING_DRAFT_TTL_MS) return false;
      await draftStorage.removeItem(draftKey(uid));
      return true;
    },

    /** Run `upload(draft)`; delete the device copy only if it resolves ok. Returns whether it was uploaded. */
    async takeForUpload(uid: string, upload: (draft: SetupDraft) => Promise<UploadResult>): Promise<boolean> {
      const rec = parse<DraftRecord>(await draftStorage.getItem(draftKey(uid)));
      if (!rec) return false;
      let ok = false;
      try {
        ok = isOk(await upload(rec.draft));
      } catch {
        ok = false;
      }
      if (ok) await draftStorage.removeItem(draftKey(uid));
      return ok;
    },

    async saveWeightGoal(uid: string, goal: WeightGoal): Promise<void> {
      const prev = parse<WeightRecord>(await weightStorage.getItem(weightKey(uid)));
      const rec: WeightRecord = { v: 1, createdAt: prev?.createdAt ?? now(), goal };
      await weightStorage.setItem(weightKey(uid), JSON.stringify(rec));
    },

    async loadWeightGoal(uid: string): Promise<WeightGoal | null> {
      return parse<WeightRecord>(await weightStorage.getItem(weightKey(uid)))?.goal ?? null;
    },

    async clearWeightGoal(uid: string): Promise<void> {
      await weightStorage.removeItem(weightKey(uid));
    },

    /** Upload the weight goal ONLY if the health switch is on; delete the device copy only after an ok upload. */
    async takeWeightForUpload(uid: string, gate: { healthOn: boolean }, upload: (g: WeightGoal) => Promise<UploadResult>): Promise<boolean> {
      if (!canUploadWeight(gate)) return false;
      const rec = parse<WeightRecord>(await weightStorage.getItem(weightKey(uid)));
      if (!rec) return false;
      let ok = false;
      try {
        ok = isOk(await upload(rec.goal));
      } catch {
        ok = false;
      }
      if (ok) await weightStorage.removeItem(weightKey(uid));
      return ok;
    },

    /** Sign-out and account deletion: remove everything for this user. */
    async clearForUser(uid: string): Promise<void> {
      await draftStorage.removeItem(draftKey(uid));
      await weightStorage.removeItem(weightKey(uid));
    },
  };
}
