/**
 * One-time "turned 18" card. Not now and Learn more are equal weight and turn
 * nothing on. Shown once; never again after Not now or if the user ignores it.
 * No notification entry. The same information stays in Settings › Photo privacy.
 */
import type { KeyValueAdapter } from '../onboarding/deviceSetupStore.ts';

export const TURNED_18_TURNS_PHOTOS_ON = false as const;
export const TURNED_18_REPEAT_PROMPTS = false as const;
export const TURNED_18_NOTIFICATION_ENTRY = false as const;

export type Turned18Decision = 'not_now' | 'learn_more' | 'ignored';

const key = (uid: string) => `progress.turned18.card.v1.${uid}`;

export function shouldShowTurned18Card(opts: {
  isMinor: boolean;
  alreadyRecorded: boolean;
}): boolean {
  if (opts.isMinor) return false;
  if (opts.alreadyRecorded) return false;
  return true;
}

export function createTurned18Store(opts: { storage: KeyValueAdapter }) {
  const { storage } = opts;
  return {
    async hasBeenShown(uid: string): Promise<boolean> {
      return (await storage.getItem(key(uid))) != null;
    },
    async shouldShow(uid: string, isMinor: boolean): Promise<boolean> {
      return shouldShowTurned18Card({ isMinor, alreadyRecorded: await this.hasBeenShown(uid) });
    },
    /** Record a decision or an ignore. Photos stay off. Never shown again. */
    async record(uid: string, decision: Turned18Decision): Promise<void> {
      await storage.setItem(key(uid), JSON.stringify({ v: 1, decision, at: new Date().toISOString() }));
    },
  };
}
