/**
 * Import capture date: prefill from DateTimeOriginal on the phone, let the user
 * confirm or edit, store only the date. Future dates are blocked. Missing date → today.
 */

const DAY = /^\d{4}-\d{2}-\d{2}$/;

export const IMPORT_DATE_CONFIRM_COPY =
  'We read this date from the photo. Change it if it’s wrong. We keep only the date.';

export function toIsoDate(value: Date | string): string | null {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }
  if (typeof value === 'string') {
    const exif = /^(\d{4}):(\d{2}):(\d{2})(?:\s+\d{2}:\d{2}:\d{2})?$/.exec(value.trim());
    if (exif) return `${exif[1]}-${exif[2]}-${exif[3]}`;
    if (DAY.test(value.trim())) return value.trim();
    const d = new Date(value);
    if (!Number.isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  }
  return null;
}

export function resolveImportDate(opts: {
  dateTimeOriginal?: Date | string | null;
  confirmed?: string | null;
  today: Date;
}): { date: string; prefilled: string } {
  const today = toIsoDate(opts.today) ?? '1970-01-01';
  const prefilled = (opts.dateTimeOriginal != null ? toIsoDate(opts.dateTimeOriginal) : null) ?? today;
  const chosen = toIsoDate(opts.confirmed ?? prefilled) ?? today;
  if (chosen > today) throw new Error('future_date_not_allowed');
  return { date: chosen, prefilled };
}
