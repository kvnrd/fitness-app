/**
 * Counsel phase5-review §3 and Rev 3: 16–17s get no body-weight card, trend, or
 * sparkline on Progress or Home, whether or not Health data is on. The only
 * allowed teen weight surface (when the feature exists) is an optional current
 * value in Profile (both health opt-ins, no target, no history).
 *
 * Rev 3: a single overwritten value; if either opt-in turns off, delete it
 * immediately in the app (and on the server; backups within 30 days via the
 * health key). Notify the teen if a parent's change caused the deletion.
 * When turned back on, it starts empty.
 */
import { PARENT_CAN_EXPORT_TEEN_DATA, TEEN_WEIGHT_EXISTS, TEEN_WEIGHT_PROFILE_ONLY } from './phase5Flags.ts';
import { canShowPurgeDate, formatPurgeDate, purgeDate } from './purgeToasts.ts';
import type { KeyValueAdapter } from '../onboarding/deviceSetupStore.ts';
import type { MassUnit } from './units.ts';

export type WeightSurface = 'progress' | 'home' | 'profile';

export type TeenCurrentWeight = { value: number; unit: MassUnit; updatedOn: string };

type Rec = { v: 1; current: TeenCurrentWeight | null };

const key = (uid: string) => `progress.teenWeight.current.v1.${uid}`;

export function teenWeightExists(): boolean {
  return TEEN_WEIGHT_EXISTS === true;
}

export function canServeWeightTrend(isMinor: boolean): boolean {
  if (isMinor) return false;
  return true;
}

export function canServeWeightCard(surface: WeightSurface, isMinor: boolean): boolean {
  if (!isMinor) return true;
  if (!TEEN_WEIGHT_EXISTS) return false;
  if (TEEN_WEIGHT_PROFILE_ONLY) return surface === 'profile';
  return surface === 'profile';
}

/** Teens may store a current Profile weight only. No target, no goal, no history. */
export function canStoreTeenCurrentWeight(opts: { isMinor: boolean; healthOn: boolean; parentHealthOn: boolean }): boolean {
  if (!opts.isMinor) return opts.healthOn === true;
  if (!TEEN_WEIGHT_EXISTS) return false;
  return opts.healthOn === true && opts.parentHealthOn === true;
}

export function teenMayHaveWeightGoal(): false {
  return false;
}

/** Saving a new weight overwrites the old value. No history is kept. */
export function overwriteTeenCurrentWeight(previous: TeenCurrentWeight | null, next: TeenCurrentWeight): TeenCurrentWeight {
  void previous;
  return { value: next.value, unit: next.unit, updatedOn: next.updatedOn };
}

export function teenWeightCaption(updatedOn: string): string {
  return `Updated ${updatedOn}. Only your latest number: no goal, no chart. Your parent can see it.`;
}

export function turningHealthOffDeletesWeightCopy(viewer: 'teen' | 'parent', teenName?: string): string {
  if (viewer === 'parent') return `Turning this off deletes ${teenName ?? "your teen"}'s saved weight.`;
  return 'Turning this off deletes your saved weight.';
}

export function parentCausedWeightDeletionNotice(): string {
  return 'Your parent turned off Health data, so your saved weight was deleted.';
}

export function parentExportedDataNotice(): string {
  return 'Your parent downloaded a copy of your data.';
}

export function parentCanExportTeenData(): boolean {
  return PARENT_CAN_EXPORT_TEEN_DATA === true;
}

export function createTeenWeightStore(opts: { storage: KeyValueAdapter }) {
  const { storage } = opts;
  const parse = (raw: string | null): TeenCurrentWeight | null => {
    if (!raw) return null;
    try {
      const o = JSON.parse(raw) as Rec;
      return o && o.v === 1 ? o.current : null;
    } catch {
      return null;
    }
  };
  const gate = (g: { isMinor: boolean; healthOn: boolean; parentHealthOn: boolean }) => canStoreTeenCurrentWeight(g);

  return {
    async load(uid: string, g: { isMinor: boolean; healthOn: boolean; parentHealthOn: boolean }): Promise<TeenCurrentWeight | null> {
      if (!gate(g)) return null;
      return parse(await storage.getItem(key(uid)));
    },
    /** Overwrites the only stored value. Refuses when either opt-in is off. */
    async save(uid: string, next: TeenCurrentWeight, g: { isMinor: boolean; healthOn: boolean; parentHealthOn: boolean }): Promise<'saved' | 'ignored'> {
      if (!gate(g)) return 'ignored';
      const prev = parse(await storage.getItem(key(uid)));
      const current = overwriteTeenCurrentWeight(prev, next);
      await storage.setItem(key(uid), JSON.stringify({ v: 1, current } satisfies Rec));
      return 'saved';
    },
    /** Device copy is deleted immediately when either opt-in turns off, or on Clear weight. */
    async deleteNow(uid: string): Promise<void> {
      await storage.removeItem(key(uid));
    },
  };
}

/** Rev 4: turning Health off deletes all saved health info and turns AI planning off. */
export function turningHealthOffDeletesHealthCopy(viewer: 'teen' | 'parent', teenName?: string): string {
  if (viewer === 'parent') {
    const name = teenName ?? 'your teen';
    return `Turning this off turns off AI planning and deletes ${name}'s saved health info, including weight, from the app right away and from our servers and backups within 30 days.`;
  }
  return 'Turning this off turns off AI planning and deletes your saved health info, including your weight, from the app right away and from our servers and backups within 30 days.';
}

export const PARENT_HEALTH_DELETION_NOTICE_AFTER_DATE =
  'Your parent turned off Health data. Your saved health info, including your weight, was deleted. AI planning is off too.';

export function parentCausedHealthDeletionNotice(opts: { requestAt: Date; guaranteed: boolean; now?: Date }): string {
  const deadline = purgeDate(opts.requestAt);
  const now = opts.now ?? new Date();
  if (now.getTime() >= deadline.getTime()) {
    return PARENT_HEALTH_DELETION_NOTICE_AFTER_DATE;
  }
  const when = canShowPurgeDate(opts.guaranteed)
    ? `will be gone from our servers and backups by ${formatPurgeDate(deadline)}`
    : 'will be gone from our servers and backups within 30 days';
  return `Your parent turned off Health data. Your saved health info, including your weight, was deleted from the app and ${when}. AI planning is off too.`;
}
