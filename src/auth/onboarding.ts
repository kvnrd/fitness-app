import type { StoreAgeSignal } from '../age/storeAgeSignal';
import { supabase } from './supabase';

/**
 * Creates the profile. Calls public.complete_signup(p_birth_date, p_display_name, store bounds...).
 *
 * - The server combines the DOB with the store age signal (lowest age wins) and keeps only an age
 *   band + adult_on date. The client never computes or echoes an age.
 * - The birth date lives only in memory (AgeGateProvider / component state) and this RPC argument.
 *   It is never logged or persisted. Only the store signal's derived bounds are sent, never its payload.
 * - Not eligible: the server deletes this auth user (and its email) in the same request.
 * - Errors are collapsed to three outcomes so the UI cannot leak which rule fired or whether
 *   another account exists.
 */
export type SignupResult =
  | { ok: true }
  | { ok: false; kind: 'ineligible' } // server answered { eligible: false } (any reason)
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

export async function completeSignup(birthDateIso: string, displayName: string, store: StoreAgeSignal | null): Promise<SignupResult> {
  if (!supabase) return { ok: false, kind: 'retry' };
  try {
    const { data, error } = await supabase.rpc('complete_signup', {
      p_birth_date: birthDateIso,
      p_display_name: displayName.trim() || null,
      p_store_lower: store?.lower ?? null,
      p_store_upper: store?.upper ?? null,
      p_store_source: store?.source ?? null,
    });
    // already_signed_up, invalid_*, network, anything else: generic. Never say whether an account exists.
    if (error || !data || typeof data !== 'object') return { ok: false, kind: 'retry' };
    return (data as { eligible?: unknown }).eligible === true ? { ok: true } : { ok: false, kind: 'ineligible' };
  } catch {
    return { ok: false, kind: 'retry' };
  }
}
