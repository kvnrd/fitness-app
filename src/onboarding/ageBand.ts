/**
 * Client mirror of private.derive_age (supabase/migrations/20261115000100_phase2b_age.sql).
 * ONLY for tests and previews. Routing and every decision uses the server's band; the client never
 * enforces or stores an age. Keep in sync with the SQL: lower of DOB age and store lower bound,
 * upper-only store range counts as 0, < 16 ineligible, 16-17 band 16_17, 18+ band 18_plus.
 */
export type StoreBounds = { lower: number | null; upper: number | null };

export type AgeBandResult =
  | { eligible: false }
  | { eligible: true; band: '18_plus'; adultOn: null }
  | { eligible: true; band: '16_17'; adultOn: string };

const pad2 = (n: number) => String(n).padStart(2, '0');
const iso = (y: number, m: number, d: number) => `${String(y).padStart(4, '0')}-${pad2(m)}-${pad2(d)}`;

function lastDay(y: number, m: number): number {
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
}

/** Whole years between a birth date and `today` (birthday counts on the day; Feb 29 birthdays fall on Mar 1 in non-leap years). */
export function ageYears(by: number, bm: number, bd: number, today: Date): number {
  const ty = today.getFullYear();
  const tm = today.getMonth() + 1;
  const td = today.getDate();
  let age = ty - by;
  if (tm < bm || (tm === bm && td < bd)) age -= 1;
  return age;
}

/** date + n years, clamping Feb 29 to Feb 28 (what Postgres `date + interval 'n years'` does). */
export function addYears(y: number, m: number, d: number, n: number): string {
  const ny = y + n;
  return iso(ny, m, Math.min(d, lastDay(ny, m)));
}

export function deriveAgeBand(birthIso: string, store: StoreBounds | null, today: Date = new Date()): AgeBandResult {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(birthIso);
  if (!m) throw new Error('invalid_birth_date');
  const by = Number(m[1]);
  const bm = Number(m[2]);
  const bd = Number(m[3]);
  const dobAge = ageYears(by, bm, bd, today);
  if (dobAge < 0 || dobAge > 120) throw new Error('invalid_birth_date');

  const storeLow = store == null ? null : store.lower != null ? store.lower : store.upper != null ? 0 : null;
  const low = Math.min(dobAge, storeLow ?? dobAge);
  if (low < 16) return { eligible: false };
  if (low >= 18) return { eligible: true, band: '18_plus', adultOn: null };

  const dobAdult = dobAge < 18 ? addYears(by, bm, bd, 18) : null;
  const storeAdult =
    storeLow != null && storeLow < 18 ? addYears(today.getFullYear(), today.getMonth() + 1, today.getDate(), 18 - storeLow) : null;
  // ISO date strings compare correctly; the latest implied 18th birthday wins.
  const adultOn = [dobAdult, storeAdult].filter((x): x is string => x != null).sort().pop() as string;
  return { eligible: true, band: '16_17', adultOn };
}
