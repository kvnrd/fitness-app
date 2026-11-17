/**
 * Free Home weight card: weigh-ins stay on the device until the Health data switch is on.
 * Same gate as the adult weight goal (Counsel, Nov 15). Minors never upload a weight goal;
 * a 16–17 may upload weigh-ins only after effective health_data is on (body_weight is allowed
 * for teens; the goal stays adults-only).
 *
 * Storage is the same health-data adapter as the goal (SecureStore on native, memory on web).
 * Never write weigh-ins to AsyncStorage or logs.
 */
import { canUploadWeight, type KeyValueAdapter, type UploadResult } from '../onboarding/deviceSetupStore.ts';
import type { MassUnit } from './units.ts';

export type WeighIn = { recordedOn: string; value: number; unit: MassUnit };

type WeighInRecord = { v: 1; entries: WeighIn[] };

const key = (uid: string) => `progress.weighins.v1.${uid}`;

const isOk = (r: UploadResult): boolean => r === true || (typeof r === 'object' && r !== null && r.ok === true);

function parse(raw: string | null): WeighIn[] {
  if (!raw) return [];
  try {
    const o = JSON.parse(raw) as WeighInRecord;
    return o && o.v === 1 && Array.isArray(o.entries) ? o.entries : [];
  } catch {
    return [];
  }
}

export type WeightLocalStore = ReturnType<typeof createWeightLocalStore>;

export function createWeightLocalStore(opts: { weightStorage: KeyValueAdapter }) {
  const { weightStorage } = opts;

  return {
    async loadWeighIns(uid: string): Promise<WeighIn[]> {
      return parse(await weightStorage.getItem(key(uid)));
    },

    async saveWeighIn(uid: string, entry: WeighIn): Promise<void> {
      const cur = parse(await weightStorage.getItem(key(uid)));
      const next = cur.filter((e) => e.recordedOn !== entry.recordedOn);
      next.push(entry);
      next.sort((a, b) => (a.recordedOn < b.recordedOn ? -1 : 1));
      await weightStorage.setItem(key(uid), JSON.stringify({ v: 1, entries: next } satisfies WeighInRecord));
    },

    async clearWeighIns(uid: string): Promise<void> {
      await weightStorage.removeItem(key(uid));
    },

    /**
     * Upload every stored weigh-in, then delete the device copy only if the upload succeeded.
     * Health off → kept. A thrown or false upload keeps the copy.
     */
    async takeWeighInsForUpload(
      uid: string,
      gate: { healthOn: boolean },
      upload: (entries: WeighIn[]) => Promise<UploadResult>,
    ): Promise<'none' | 'kept' | 'uploaded' | 'failed'> {
      const entries = parse(await weightStorage.getItem(key(uid)));
      if (!entries.length) return 'none';
      if (!canUploadWeight(gate)) return 'kept';
      try {
        const ok = isOk(await upload(entries));
        if (!ok) return 'failed';
        await weightStorage.removeItem(key(uid));
        return 'uploaded';
      } catch {
        return 'failed';
      }
    },
  };
}

/** Combined gate used by the Home weight card and the adult goal. */
export function canLeaveDevice(opts: { healthOn: boolean }): boolean {
  return canUploadWeight(opts);
}
