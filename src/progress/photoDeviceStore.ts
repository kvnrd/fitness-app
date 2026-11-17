/**
 * On-device progress photo copies. Deleted immediately on turn-off or delete-all
 * (Counsel Rev 2). Server copies are shredded later via key destruction.
 */
import type { KeyValueAdapter } from '../onboarding/deviceSetupStore.ts';

export type DevicePhoto = { id: string; capturedOn: string };

type Rec = { v: 1; photos: DevicePhoto[] };

const key = (uid: string) => `progress.photos.device.v1.${uid}`;

function parse(raw: string | null): DevicePhoto[] {
  if (!raw) return [];
  try {
    const o = JSON.parse(raw) as Rec;
    return o && o.v === 1 && Array.isArray(o.photos) ? o.photos : [];
  } catch {
    return [];
  }
}

export function createPhotoDeviceStore(opts: { storage: KeyValueAdapter }) {
  const { storage } = opts;
  return {
    async list(uid: string): Promise<DevicePhoto[]> {
      return parse(await storage.getItem(key(uid)));
    },
    async add(uid: string, photo: DevicePhoto): Promise<void> {
      const cur = parse(await storage.getItem(key(uid)));
      await storage.setItem(key(uid), JSON.stringify({ v: 1, photos: [...cur.filter((p) => p.id !== photo.id), photo] }));
    },
    /** Device copies go away immediately. Does not change the server opt-in. */
    async deleteAllNow(uid: string): Promise<void> {
      await storage.removeItem(key(uid));
    },
  };
}
