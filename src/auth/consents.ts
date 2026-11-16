import * as Crypto from 'expo-crypto';
import { supabase } from './supabase';

/**
 * Consent kinds the UI offers. Each is a SEPARATE opt-in, off by default, no "accept all".
 * Each row has a grantor: 'self' (the user) or 'parent' (the active contracting parent of a 16-17
 * user). For a minor a scope is ON only when both are granted (enforced in SQL, app.has_consent);
 * the teen's switch stays locked until the parent's is on (record_consent raises
 * parent_consent_required).
 */
export const CONSENT_KINDS = ['health_data', 'ai_vendor', 'coach_sharing'] as const;
export type ConsentKind = (typeof CONSENT_KINDS)[number];

export type GrantPair = { self: boolean; parent: boolean };
export type ConsentState = Record<ConsentKind, GrantPair>;
const OFF: GrantPair = { self: false, parent: false };
export const NO_CONSENTS: ConsentState = { health_data: OFF, ai_vendor: OFF, coach_sharing: OFF };

type Loaded = { ok: true; state: ConsentState; rowCount: number } | { ok: false };

/** Reads public.consents (RLS: own rows, or an active contracting parent's). Missing row = not granted. */
export async function loadConsents(userId: string): Promise<Loaded> {
  if (!supabase) return { ok: false };
  try {
    const { data, error } = await supabase.from('consents').select('kind, grantor, granted, revoked_at').eq('user_id', userId);
    if (error || !data) return { ok: false };
    const state: ConsentState = { health_data: { ...OFF }, ai_vendor: { ...OFF }, coach_sharing: { ...OFF } };
    for (const row of data) {
      if (!(CONSENT_KINDS as readonly string[]).includes(row.kind)) continue;
      const on = row.granted === true && row.revoked_at == null;
      if (row.grantor === 'parent') state[row.kind as ConsentKind].parent = on;
      else if (row.grantor === 'self') state[row.kind as ConsentKind].self = on;
    }
    return { ok: true, state, rowCount: data.length };
  } catch {
    return { ok: false };
  }
}

export type SetResult = 'ok' | 'parent_required' | 'error';

/**
 * Grant or revoke one kind. A grant records the policy version and the SHA-256 of the exact text the
 * person saw. `forUser` is set only when an active parent/guardian acts for their teen.
 */
export async function setConsent(
  kind: ConsentKind,
  granted: boolean,
  opts: { forUser?: string; version: string; shownText: string },
): Promise<SetResult> {
  if (!supabase) return 'error';
  try {
    if (granted) {
      const hash = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, opts.shownText);
      const { error } = await supabase.rpc('record_consent', {
        p_kind: kind,
        p_policy_version: opts.version,
        p_for_user: opts.forUser ?? null,
        p_text_hash: hash.toLowerCase(),
      });
      if (!error) return 'ok';
      return /parent_consent_required/.test(error.message ?? '') ? 'parent_required' : 'error';
    }
    const { error } = await supabase.rpc('revoke_consent', { p_kind: kind, p_for_user: opts.forUser ?? null });
    return error ? 'error' : 'ok';
  } catch {
    return 'error';
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
