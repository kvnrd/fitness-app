import { supabase } from './supabase';

/**
 * Parent / guardian link stubs.
 *
 * Deliberately NOT here: looking up a parent by email. From the client that would be an account
 * oracle ("does this email have an account?"). Email invites need a server function that sends the
 * same neutral response whether or not an account exists. See docs/phase-2-backend.md.
 */
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const isUuid = (v: string) => UUID_RE.test(v.trim());

export type PendingLink = { id: string; created_at: string; direction: 'incoming' | 'outgoing' };

/** Pending links where the current user is the parent (incoming) or the minor (outgoing). RLS limits rows to the user's own. */
export async function listPendingLinks(userId: string): Promise<PendingLink[] | null> {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from('parent_links')
      .select('id, minor_user_id, parent_user_id, created_at')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });
    if (error || !data) return null;
    return data.map((r) => ({
      id: r.id as string,
      created_at: r.created_at as string,
      direction: r.parent_user_id === userId ? 'incoming' : 'outgoing',
    }));
  } catch {
    return null;
  }
}

/** Dev/test path only: the minor asks to link to a parent account whose UUID they typed. Any failure is generic. */
export async function requestLinkByParentId(minorId: string, parentId: string): Promise<boolean> {
  if (!supabase || !isUuid(parentId)) return false;
  try {
    const { error } = await supabase.rpc('link_parent', { p_minor_id: minorId, p_parent_id: parentId.trim() });
    return !error; // invalid_parent / forbidden / conflicts all look the same to the caller
  } catch {
    return false;
  }
}

export type AcceptLinkArgs = {
  linkId: string;
  attestation: { version: string; hash: string };
  termsVersion: string;
  risk: { version: string; hash: string };
  privacyVersion?: string | null;
  privacyHash?: string | null;
};

/**
 * accept_parent_link now requires the parent's attestation and parent risk acknowledgement (no path links
 * without them). The screen that collects them is the parent-consent screen (UI job B).
 */
export async function acceptLink(a: AcceptLinkArgs): Promise<boolean> {
  if (!supabase) return false;
  try {
    const { error } = await supabase.rpc('accept_parent_link', {
      p_link_id: a.linkId,
      p_attestation_version: a.attestation.version,
      p_attestation_hash: a.attestation.hash,
      p_terms_version: a.termsVersion,
      p_risk_version: a.risk.version,
      p_risk_hash: a.risk.hash,
      p_privacy_version: a.privacyVersion ?? null,
      p_privacy_hash: a.privacyHash ?? null,
    });
    return !error;
  } catch {
    return false;
  }
}
