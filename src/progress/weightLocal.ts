/**
 * Free Home weight card weigh-ins.
 *
 * Counsel Rev 2 (02b): while Health data is off, no weigh-in is written to the
 * server or kept on the device as history. The adult weight *goal* may still
 * stay on the device until Health is on (approved goal line).
 *
 * 16–17s never store weigh-in history (no Progress/Home card). Their only
 * allowed body-weight surface is an optional current value in Profile.
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
    async loadWeighIns(uid: string, gate: { healthOn: boolean }): Promise<WeighIn[]> {
      if (!canUploadWeight(gate)) return [];
      return parse(await weightStorage.getItem(key(uid)));
    },

    /** Refuses to write history while Health data is off. */
    async saveWeighIn(uid: string, entry: WeighIn, gate: { healthOn: boolean }): Promise<'saved' | 'ignored'> {
      if (!canUploadWeight(gate)) return 'ignored';
      const cur = parse(await weightStorage.getItem(key(uid)));
      const next = cur.filter((e) => e.recordedOn !== entry.recordedOn);
      next.push(entry);
      next.sort((a, b) => (a.recordedOn < b.recordedOn ? -1 : 1));
      await weightStorage.setItem(key(uid), JSON.stringify({ v: 1, entries: next } satisfies WeighInRecord));
      return 'saved';
    },

    async clearWeighIns(uid: string): Promise<void> {
      await weightStorage.removeItem(key(uid));
    },

    /**
     * Upload stored weigh-ins (Health must already be on to have any). The device
     * copy is deleted only after a successful upload.
     */
    async takeWeighInsForUpload(
      uid: string,
      gate: { healthOn: boolean },
      upload: (entries: WeighIn[]) => Promise<UploadResult>,
    ): Promise<'none' | 'kept' | 'uploaded' | 'failed'> {
      if (!canUploadWeight(gate)) return 'none';
      const entries = parse(await weightStorage.getItem(key(uid)));
      if (!entries.length) return 'none';
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

/** Combined gate used by the adult goal (still allowed on-device) and by weigh-in history (not allowed while off). */
export function canLeaveDevice(opts: { healthOn: boolean }): boolean {
  return canUploadWeight(opts);
}

export function canSaveWeighInHistory(opts: { healthOn: boolean }): boolean {
  return canUploadWeight(opts);
}
