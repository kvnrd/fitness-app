/**
 * Date-of-birth part validation. Pure (no react-native), shared by the age screen, sign-up and tests.
 * Format/range checks only: this is NOT an eligibility check (the server decides the age band).
 */
export type DateParts = { year: string; month: string; day: string };

export const MAX_AGE_YEARS = 120;

export type DobError = 'incomplete' | 'month' | 'day' | 'year' | 'future' | 'too_old';

export function isLeapYear(y: number): boolean {
  return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
}

export function daysInMonth(year: number, month: number): number {
  if (month === 2) return isLeapYear(year) ? 29 : 28;
  return [4, 6, 9, 11].includes(month) ? 30 : 31;
}

const pad2 = (n: number) => String(n).padStart(2, '0');

/** Local calendar date of `d` as numbers (the user's "today"). */
function localYmd(d: Date): { y: number; m: number; d: number } {
  return { y: d.getFullYear(), m: d.getMonth() + 1, d: d.getDate() };
}

/** True when every part has the right shape (4-digit year, 1-2 digit month and day). Says nothing about validity. */
export function isCompleteDob({ year, month, day }: DateParts): boolean {
  return /^\d{4}$/.test(year) && /^\d{1,2}$/.test(month) && /^\d{1,2}$/.test(day);
}

/** First problem with the parts, or null when it is a real, past, plausible date. `today` is injectable for tests. */
export function validateDob(parts: DateParts, today: Date = new Date()): DobError | null {
  if (!isCompleteDob(parts)) return 'incomplete';
  const y = Number(parts.year);
  const m = Number(parts.month);
  const d = Number(parts.day);
  if (m < 1 || m > 12) return 'month';
  if (d < 1 || d > daysInMonth(y, m)) return 'day';
  const t = localYmd(today);
  const key = (yy: number, mm: number, dd: number) => yy * 10000 + mm * 100 + dd;
  const k = key(y, m, d);
  if (k > key(t.y, t.m, t.d)) return 'future';
  if (k < key(t.y - MAX_AGE_YEARS, t.m, t.d)) return 'too_old';
  if (y < 1000) return 'year';
  return null;
}

/** 'YYYY-MM-DD' for a real calendar date that is not in the future nor over 120 years ago, else null. */
export function toIsoDate(parts: DateParts, today: Date = new Date()): string | null {
  if (validateDob(parts, today) !== null) return null;
  return `${parts.year}-${pad2(Number(parts.month))}-${pad2(Number(parts.day))}`;
}
