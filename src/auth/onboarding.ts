import { supabase } from './supabase';

/**
 * Age gate. Calls public.complete_signup(p_birth_date, p_display_name).
 *
 * - The server computes the age and decides. The client never computes or echoes an age.
 * - The birth date lives only in component state and this one RPC argument. It is never logged or
 *   persisted on the device. No Apple Declared Age Range / Google Play Age Signals payload is read or stored.
 * - Errors are collapsed to three outcomes so the UI cannot leak which rule fired or whether
 *   another account exists.
 */
export type SignupResult =
  | { ok: true }
  | { ok: false; kind: 'ineligible' } // under_13_not_permitted or under_minimum_age
  | { ok: false; kind: 'retry' };

export type DateParts = { year: string; month: string; day: string };

/** 'YYYY-MM-DD' for a real calendar date that is not in the future, else null. Format check only, not an age check. */
export function toIsoDate({ year, month, day }: DateParts): string | null {
  if (!/^\d{4}$/.test(year) || !/^\d{1,2}$/.test(month) || !/^\d{1,2}$/.test(day)) return null;
  const y = Number(year);
  const m = Number(month);
  const d = Number(day);
  const dt = new Date(Date.UTC(y, m - 1, d));
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== m - 1 || dt.getUTCDate() !== d) return null;
  if (dt.getTime() > Date.now()) return null;
  return `${year}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

export async function completeSignup(birthDateIso: string, displayName: string): Promise<SignupResult> {
  if (!supabase) return { ok: false, kind: 'retry' };
  try {
    const { error } = await supabase.rpc('complete_signup', {
      p_birth_date: birthDateIso,
      p_display_name: displayName.trim() || null,
    });
    if (!error) return { ok: true };
    const text = `${error.message ?? ''}`;
    if (text.includes('under_13_not_permitted') || text.includes('under_minimum_age')) {
      return { ok: false, kind: 'ineligible' };
    }
    // already_signed_up, invalid_*, network, anything else: generic. Never say whether an account exists.
    return { ok: false, kind: 'retry' };
  } catch {
    return { ok: false, kind: 'retry' };
  }
}
