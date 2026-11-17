import type { StoreAgeSignal } from '../age/storeAgeSignal';
import type { DateParts } from '../onboarding/dob.ts';
import { PRIVACY_POLICY, TERMS } from '../legal/text';
import { createParentInvite } from '../onboarding/api';
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
  | { ok: true; isMinor: boolean }
  | { ok: false; kind: 'ineligible' } // server answered { eligible: false } (any reason)
  | { ok: false; kind: 'retry' };

// DOB validation lives in onboarding/dob (single implementation); re-exported for existing importers.
export type { DateParts };
export { toIsoDate } from '../onboarding/dob.ts';

/**
 * [ATTORNEY] Terms are bundled as v0.2-draft. Acceptances are pre-production and must be repeated
 * before launch (a production build will not count a draft acceptance).
 */
export async function completeSignup(birthDateIso: string, displayName: string, store: StoreAgeSignal | null): Promise<SignupResult> {
  if (!supabase) return { ok: false, kind: 'retry' };
  try {
    const { data, error } = await supabase.rpc('complete_signup', {
      p_birth_date: birthDateIso,
      p_display_name: displayName.trim() || null,
      p_store_lower: store?.lower ?? null,
      p_store_upper: store?.upper ?? null,
      p_store_source: store?.source ?? null,
      p_terms_version: TERMS.version,
      p_terms_hash: TERMS.hash,
      p_privacy_version: PRIVACY_POLICY.version,
      p_privacy_hash: PRIVACY_POLICY.hash,
    });
    // already_signed_up, invalid_*, network, anything else: generic. Never say whether an account exists.
    if (error || !data || typeof data !== 'object') return { ok: false, kind: 'retry' };
    const d = data as { eligible?: unknown; is_minor?: unknown };
    return d.eligible === true ? { ok: true, isMinor: d.is_minor === true } : { ok: false, kind: 'ineligible' };
  } catch {
    return { ok: false, kind: 'retry' };
  }
}

/**
 * After a session exists (any method): complete_signup, then for a 16-17 account create_parent_invite with the
 * parent email held in memory. The caller clears DOB + parent email from memory afterwards. A failed invite is
 * not fatal here: the pending-parent screen can send it again.
 */
export async function finishSignup(args: { birthDateIso: string; displayName: string; store: StoreAgeSignal | null; parentEmail: string }): Promise<SignupResult> {
  const r = await completeSignup(args.birthDateIso, args.displayName, args.store);
  if (r.ok && r.isMinor && args.parentEmail) await createParentInvite(args.parentEmail);
  return r;
}
