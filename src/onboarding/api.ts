import { supabase } from '../auth/supabase';
import type { WeightGoal } from './deviceSetupStore';
import type { SetupPayload } from './setupPayload';

/**
 * Client wrappers for the Phase 3 RPCs (supabase/migrations/20261116000*.sql). Every call uses NAMED args.
 * Every failure collapses to a generic result: no raw server error text reaches the UI and nothing is logged
 * (no emails, tokens, codes or dates ever go to a log). UI gating only; RLS and the functions enforce.
 */

export type OnboardingState = {
  is_minor: boolean;
  linked: boolean;
  invite_status: string | null;
  setup_done: boolean;
  privacy_done: boolean;
  can_train: boolean;
  /** null for adults. */
  parent_risk_done: boolean | null;
  health_reask_due: boolean;
};

const bool = (v: unknown) => v === true;

/** my_onboarding_state(): own row only. null on any error or when there is no profile (callers fail closed). */
export async function myOnboardingState(): Promise<OnboardingState | null> {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase.rpc('my_onboarding_state');
    if (error || !data || typeof data !== 'object') return null;
    const d = data as Record<string, unknown>;
    if (typeof d.is_minor !== 'boolean') return null;
    return {
      is_minor: d.is_minor,
      linked: bool(d.linked),
      invite_status: typeof d.invite_status === 'string' ? d.invite_status : null,
      setup_done: bool(d.setup_done),
      privacy_done: bool(d.privacy_done),
      can_train: bool(d.can_train),
      parent_risk_done: typeof d.parent_risk_done === 'boolean' ? d.parent_risk_done : null,
      health_reask_due: bool(d.health_reask_due),
    };
  } catch {
    return null;
  }
}

/** save_training_setup(p_setup). The payload never contains body weights (see buildSetupPayload). */
export async function saveTrainingSetup(payload: SetupPayload): Promise<boolean> {
  if (!supabase) return false;
  try {
    const { error } = await supabase.rpc('save_training_setup', { p_setup: payload });
    return !error;
  } catch {
    return false;
  }
}

/** create_parent_invite(p_parent_email). The server answers the same way every time; true = call went through. */
export async function createParentInvite(parentEmail: string): Promise<boolean> {
  if (!supabase) return false;
  try {
    const { error } = await supabase.rpc('create_parent_invite', { p_parent_email: parentEmail.trim() });
    return !error;
  } catch {
    return false;
  }
}

export type AcceptInviteArgs = {
  token: string;
  attestation: { version: string; hash: string };
  termsVersion: string;
  risk: { version: string; hash: string };
  privacyVersion?: string | null;
  privacyHash?: string | null;
};

/** accept_parent_invite(...). false = the one generic "invalid invite" answer (never says why). */
export async function acceptParentInvite(a: AcceptInviteArgs): Promise<boolean> {
  if (!supabase) return false;
  try {
    const { data, error } = await supabase.rpc('accept_parent_invite', {
      p_token: a.token,
      p_attestation_version: a.attestation.version,
      p_attestation_hash: a.attestation.hash,
      p_terms_version: a.termsVersion,
      p_risk_version: a.risk.version,
      p_risk_hash: a.risk.hash,
      p_privacy_version: a.privacyVersion ?? null,
      p_privacy_hash: a.privacyHash ?? null,
    });
    return !error && data === true;
  } catch {
    return false;
  }
}

export type PrivacySafetyArgs = {
  health: boolean;
  healthVersion: string;
  healthHash: string;
  ai: boolean;
  aiVersion: string;
  aiHash: string;
  riskVersion: string;
  riskHash: string;
  /** SHA-256 of the bundled health policy shown (HEALTH_POLICY.hash). */
  healthPolicyHash?: string | null;
};

export type PrivacySafetyResult = { ok: true; canTrain: boolean } | { ok: false; reason: 'parent_consent_required' | 'failed' };

/** submit_privacy_safety(...). A minor turning health/AI on before the parent agreed gets a calm, specific reason. */
export async function submitPrivacySafety(a: PrivacySafetyArgs): Promise<PrivacySafetyResult> {
  if (!supabase) return { ok: false, reason: 'failed' };
  try {
    const { data, error } = await supabase.rpc('submit_privacy_safety', {
      p_health: a.health,
      p_health_version: a.healthVersion,
      p_health_hash: a.healthHash,
      p_ai: a.ai,
      p_ai_version: a.aiVersion,
      p_ai_hash: a.aiHash,
      p_risk_version: a.riskVersion,
      p_risk_hash: a.riskHash,
      p_health_policy_hash: a.healthPolicyHash ?? null,
    });
    if (error) return { ok: false, reason: /parent_consent_required/.test(error.message ?? '') ? 'parent_consent_required' : 'failed' };
    return { ok: true, canTrain: !!data && typeof data === 'object' && (data as { can_train?: unknown }).can_train === true };
  } catch {
    return { ok: false, reason: 'failed' };
  }
}

export type RedeemResult = 'ok' | 'invalid' | 'rate_limited' | 'retry';

/** redeem_trainer_code(p_code, p_device_id). One generic 'invalid' for every refusal; 'rate_limited' is the only distinct one. */
export async function redeemTrainerCode(code: string, deviceId: string | null): Promise<RedeemResult> {
  if (!supabase) return 'retry';
  try {
    const { data, error } = await supabase.rpc('redeem_trainer_code', { p_code: code, p_device_id: deviceId });
    if (error) return /rate_limited/.test(error.message ?? '') ? 'rate_limited' : 'retry';
    return data === true ? 'ok' : 'invalid';
  } catch {
    return 'retry';
  }
}

/** Coach: create a code. The raw code is returned once; only its hash is stored. null on any failure. */
export async function createTrainerCode(opts: { maxRedemptions?: number; expiresInDays?: number } = {}): Promise<{ id: string; code: string } | null> {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase.rpc('create_trainer_code', {
      p_max_redemptions: opts.maxRedemptions ?? 25,
      p_expires_in_days: opts.expiresInDays ?? 30,
    });
    if (error || !data || typeof data !== 'object') return null;
    const d = data as { id?: unknown; code?: unknown };
    return typeof d.id === 'string' && typeof d.code === 'string' ? { id: d.id, code: d.code } : null;
  } catch {
    return null;
  }
}

export async function revokeTrainerCode(codeId: string): Promise<boolean> {
  if (!supabase) return false;
  try {
    const { error } = await supabase.rpc('revoke_trainer_code', { p_code_id: codeId });
    return !error;
  } catch {
    return false;
  }
}

/**
 * Adult body-weight goal, uploaded ONLY after the health switch is on (see canUploadWeight in deviceSetupStore),
 * through the health-record function (KMS envelope encryption). weight_goal is a JSON string.
 */
export async function uploadWeightGoal(goal: WeightGoal): Promise<boolean> {
  if (!supabase) return false;
  try {
    const { error } = await supabase.functions.invoke('health-record', { body: { action: 'write', weight_goal: JSON.stringify(goal) } });
    return !error;
  } catch {
    return false;
  }
}
