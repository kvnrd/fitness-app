import { supabase } from './supabase';

/**
 * Consent kinds the UI offers. Each is a SEPARATE opt-in, off by default, no "accept all".
 * (`parental` exists in SQL but is not surfaced here: whether and how a parent records it is a Counsel question.)
 */
export const CONSENT_KINDS = ['health_data', 'ai_vendor', 'coach_sharing'] as const;
export type ConsentKind = (typeof CONSENT_KINDS)[number];

/**
 * PLACEHOLDER. Counsel must supply the real consent text and the real policy version identifier.
 * Every grant records this string server-side, so changing the text means bumping this value.
 * Do not ship to users with this value.
 */
export const POLICY_VERSION = 'placeholder-v1';

export type ConsentState = Record<ConsentKind, boolean>;
export const NO_CONSENTS: ConsentState = { health_data: false, ai_vendor: false, coach_sharing: false };

type Loaded = { ok: true; state: ConsentState; rowCount: number } | { ok: false };

/** Reads public.consents (RLS: own rows, or an active contracting parent's). Missing row = not granted. */
export async function loadConsents(userId: string): Promise<Loaded> {
  if (!supabase) return { ok: false };
  try {
    const { data, error } = await supabase.from('consents').select('kind, granted, revoked_at').eq('user_id', userId);
    if (error || !data) return { ok: false };
    const state: ConsentState = { ...NO_CONSENTS };
    for (const row of data) {
      if ((CONSENT_KINDS as readonly string[]).includes(row.kind)) {
        state[row.kind as ConsentKind] = row.granted === true && row.revoked_at == null;
      }
    }
    return { ok: true, state, rowCount: data.length };
  } catch {
    return { ok: false };
  }
}

/** Grant or revoke one kind. `forUser` is set only when an active parent/guardian acts for a minor. */
export async function setConsent(kind: ConsentKind, granted: boolean, forUser?: string): Promise<boolean> {
  if (!supabase) return false;
  try {
    const { error } = granted
      ? await supabase.rpc('record_consent', { p_kind: kind, p_policy_version: POLICY_VERSION, p_for_user: forUser ?? null })
      : await supabase.rpc('revoke_consent', { p_kind: kind, p_for_user: forUser ?? null });
    return !error;
  } catch {
    return false;
  }
}

/** Minors the signed-in user is the active contracting parent of (ids only; RLS gives no names). */
export async function listActiveMinors(parentId: string): Promise<string[]> {
  if (!supabase) return [];
  try {
    const { data, error } = await supabase
      .from('parent_links')
      .select('minor_user_id')
      .eq('parent_user_id', parentId)
      .eq('status', 'active')
      .eq('is_contracting_party', true);
    if (error || !data) return [];
    return data.map((r) => r.minor_user_id as string);
  } catch {
    return [];
  }
}
