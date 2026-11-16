import type { KeyValueAdapter } from './deviceSetupStore.ts';

/**
 * Two tiny device-only values (non-secret):
 *  - goalDone: a linked 16-17 has finished Step 5 (so the gate does not skip it when the device draft upload
 *    already completed setup on the server). Cleared on sign-out.
 *  - installId: random per-install id used ONLY as a rate-limit key for trainer-code attempts. Not an advertising
 *    id, not derived from hardware, never linked to the account in the app.
 */
const goalKey = (uid: string) => `setup.goalDone.v1.${uid}`;
const INSTALL_KEY = 'install.rl.v1';

export function createDeviceFlags(storage: KeyValueAdapter, randomId: () => string) {
  const listeners = new Set<() => void>();
  const emit = () => listeners.forEach((l) => l());
  return {
    subscribe(l: () => void): () => void {
      listeners.add(l);
      return () => void listeners.delete(l);
    },
    async goalDone(uid: string): Promise<boolean> {
      return (await storage.getItem(goalKey(uid))) === '1';
    },
    async setGoalDone(uid: string): Promise<void> {
      await storage.setItem(goalKey(uid), '1');
      emit();
    },
    async clearUser(uid: string): Promise<void> {
      await storage.removeItem(goalKey(uid));
      emit();
    },
    async installId(): Promise<string> {
      const have = await storage.getItem(INSTALL_KEY);
      if (have && /^[A-Za-z0-9-]{16,64}$/.test(have)) return have;
      const id = randomId();
      await storage.setItem(INSTALL_KEY, id);
      return id;
    },
  };
}
