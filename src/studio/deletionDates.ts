/**
 * Coach deletion calendar. Dates are calendar days, not timestamptz intervals,
 * so DST in America/Denver cannot shift the due day.
 *
 * trigger + 23 = reminder (6.10)
 * trigger + 30 = due (coach-facing deadline)
 * trigger + 31 = pause new clients + T&S ticket (6.11)
 * trigger + 45 = suspend the coach account (6.12). Never shown as "45 days".
 */

export const DELETION_TIME_ZONE = 'America/Denver';

export type DeletionSchedule = {
  trigger: string;
  reminder: string;
  due: string;
  pause: string;
  suspend: string;
};

const ISO = /^\d{4}-\d{2}-\d{2}$/;

function parseIsoDate(iso: string): Date {
  if (!ISO.test(iso)) throw new Error('invalid_date');
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

function fmt(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function addDays(iso: string, days: number): string {
  const d = parseIsoDate(iso);
  d.setUTCDate(d.getUTCDate() + days);
  return fmt(d);
}

/** Calendar schedule from the trigger date (the date coaching ended in America/Denver). */
export function deletionSchedule(triggerIso: string): DeletionSchedule {
  return {
    trigger: triggerIso,
    reminder: addDays(triggerIso, 23),
    due: addDays(triggerIso, 30),
    pause: addDays(triggerIso, 31),
    suspend: addDays(triggerIso, 45),
  };
}

/** Short coach-facing due label, e.g. "Dec 17". */
export function dueShort(dueIso: string, locale = 'en-US'): string {
  const d = parseIsoDate(dueIso);
  return d.toLocaleDateString(locale, { month: 'short', day: 'numeric', timeZone: 'UTC' });
}

export const SAMPLE_TRIGGER = '2026-11-17';
export const SAMPLE_SCHEDULE = deletionSchedule(SAMPLE_TRIGGER);
