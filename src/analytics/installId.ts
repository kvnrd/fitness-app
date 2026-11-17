/**
 * Counsel Rev 5: crash and analytics events may carry at most a random install ID.
 * It resets on sign-out and on account deletion, is never joined to account data,
 * and is shared only with our service providers. This is not the trainer-code
 * rate-limit id in deviceFlags, and must not be mixed with it.
 */
import type { KeyValueAdapter } from '../onboarding/deviceSetupStore.ts';

export const ANALYTICS_INSTALL_ID_KEY = 'analytics.installId.v1';

export function createAnalyticsInstallId(storage: KeyValueAdapter, randomId: () => string) {
  const read = async (): Promise<string | null> => {
    const have = await storage.getItem(ANALYTICS_INSTALL_ID_KEY);
    if (have && /^[A-Za-z0-9-]{16,64}$/.test(have)) return have;
    return null;
  };
  return {
    async current(): Promise<string | null> {
      return read();
    },
    async getOrCreate(): Promise<string> {
      const have = await read();
      if (have) return have;
      const id = randomId();
      await storage.setItem(ANALYTICS_INSTALL_ID_KEY, id);
      return id;
    },
    /** Drop the current ID and mint a new one so later events cannot be joined to the last account. */
    async reset(): Promise<string> {
      await storage.removeItem(ANALYTICS_INSTALL_ID_KEY);
      const id = randomId();
      await storage.setItem(ANALYTICS_INSTALL_ID_KEY, id);
      return id;
    },
  };
}
