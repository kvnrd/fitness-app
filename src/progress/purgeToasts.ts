/**
 * Counsel Rev 3: outcome toasts may include a purge {date} (request + 30 days)
 * only when the purge job is proven to run by that deadline.
 */
export const PHOTO_PURGE_DAYS = 30;

/**
 * The server function app.photo_purge_deadline_guaranteed() is the source of truth:
 * true only when the daily job is confirmed running (successful run in the last 25 hours)
 * and no photo shred is overdue. See public.retention_purge_health() and the runbook.
 */
export type PurgeHealth = {
  jobConfirmedRunning: boolean;
  overduePhotoKeys: number;
  policyEnforced?: boolean;
};

export function photoPurgeDeadlineGuaranteed(health: PurgeHealth): boolean {
  return (health.policyEnforced ?? true) && health.jobConfirmedRunning === true && health.overduePhotoKeys === 0;
}

/**
 * "Clear weight" while Health stays on only nulls the live value; the health
 * key is still needed for other records, so backups of the old ciphertext are
 * not guaranteed gone by a date. The date is shown for teen weight only when
 * Health is withdrawn and the health-key shred path (already tested) applies.
 */
export const TEEN_WEIGHT_CLEAR_PURGE_DEADLINE_GUARANTEED = false;
export const TEEN_WEIGHT_WITHDRAWAL_PURGE_DEADLINE_GUARANTEED = true;

export function canShowPurgeDate(guaranteed: boolean): boolean {
  return guaranteed === true;
}

export function purgeDate(requestAt: Date, days: number = PHOTO_PURGE_DAYS): Date {
  const d = new Date(requestAt.getTime());
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

export function formatPurgeDate(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export type ToastOpts = {
  requestAt: Date;
  guaranteed: boolean;
  coachFirstName?: string | null;
};

function withCoach(base: string, coachFirstName?: string | null): string {
  if (!coachFirstName) return base;
  return `${base} ${coachFirstName} can't see them anymore.`;
}

export function turnOffPhotosToast(opts: ToastOpts): string {
  const dateBit = canShowPurgeDate(opts.guaranteed)
    ? `Your photos are deleted from this phone and will be gone from our servers and backups by ${formatPurgeDate(purgeDate(opts.requestAt))}.`
    : 'Your photos are deleted from this phone and will be gone from our servers and backups within 30 days.';
  return withCoach(`Progress photos are off. ${dateBit}`, opts.coachFirstName);
}

export function deleteAllPhotosToast(opts: ToastOpts): string {
  const dateBit = canShowPurgeDate(opts.guaranteed)
    ? `They'll be gone from our servers and backups by ${formatPurgeDate(purgeDate(opts.requestAt))}.`
    : "They'll be gone from our servers and backups within 30 days.";
  return withCoach(`All photos deleted from this phone. ${dateBit}`, opts.coachFirstName);
}

export function teenClearWeightToast(opts: { requestAt: Date; guaranteed: boolean }): string {
  if (canShowPurgeDate(opts.guaranteed)) {
    return `Weight cleared. It'll be gone from our servers and backups by ${formatPurgeDate(purgeDate(opts.requestAt))}.`;
  }
  return "Weight cleared. It's deleted from the app, and from our servers and backups within 30 days.";
}
