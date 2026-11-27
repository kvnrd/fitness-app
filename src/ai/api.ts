/**
 * RPCs and health-record writes for the AI-plan flow. Fail closed: a missing client or an
 * unexpected error looks the same as a refusal.
 */
import { supabase } from '../auth/supabase';
import { sha256Hex } from '../legal/hash';
import type { HealthScreenStatus } from './flow';
import { parseHealthScreenStatus } from './flow';
import { CLEARANCE_VERSION } from './healthScreen';

export type AiPlanServerState = {
  isMinor: boolean;
  healthConsent: boolean;
  aiConsent: boolean;
  healthScreenStatus: HealthScreenStatus;
  canAiPlan: boolean;
  firstSessionDone: boolean;
  planAccepted: boolean;
};

const bool = (v: unknown) => v === true;

export async function myAiPlanState(forUser?: string): Promise<AiPlanServerState | null> {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase.rpc('my_ai_plan_state', forUser ? { p_for_user: forUser } : {});
    if (error || !data || typeof data !== 'object') return null;
    const d = data as Record<string, unknown>;
    const hs = parseHealthScreenStatus(d.health_screen_status);
    if (hs === null) return null;
    return {
      isMinor: bool(d.is_minor),
      healthConsent: bool(d.health_consent),
      aiConsent: bool(d.ai_consent),
      healthScreenStatus: hs,
      canAiPlan: bool(d.can_ai_plan),
      firstSessionDone: bool(d.first_session_done),
      planAccepted: bool(d.plan_accepted),
    };
  } catch {
    return null;
  }
}

export type ScreenWriteResult = { ok: true } | { ok: false; reason: 'parent_required' | 'failed' };

/** Encrypt the answers, then record the derived any-yes gate. Parents pass the teen id as forUser. */
export async function submitHealthScreen(args: {
  payload: string;
  anyYes: boolean;
  forUser?: string;
}): Promise<ScreenWriteResult> {
  if (!supabase) return { ok: false, reason: 'failed' };
  try {
    const body: Record<string, unknown> = { action: 'write', health_screen: args.payload };
    if (args.forUser) body.user_id = args.forUser;
    const wr = await supabase.functions.invoke('health-record', { body });
    if (wr.error) return { ok: false, reason: 'failed' };
    const { error } = await supabase.rpc('submit_health_screen', {
      p_any_yes: args.anyYes,
      ...(args.forUser ? { p_for_user: args.forUser } : {}),
    });
    if (error) return { ok: false, reason: /parent_required/.test(error.message ?? '') ? 'parent_required' : 'failed' };
    return { ok: true };
  } catch {
    return { ok: false, reason: 'failed' };
  }
}

export async function attestHealthClearance(ackText: string, forUser?: string): Promise<ScreenWriteResult> {
  if (!supabase) return { ok: false, reason: 'failed' };
  try {
    const hash = await sha256Hex(ackText);
    const { error } = await supabase.rpc('attest_health_clearance', {
      p_version: CLEARANCE_VERSION,
      p_text_hash: hash,
      ...(forUser ? { p_for_user: forUser } : {}),
    });
    if (error) return { ok: false, reason: /parent_required/.test(error.message ?? '') ? 'parent_required' : 'failed' };
    return { ok: true };
  } catch {
    return { ok: false, reason: 'failed' };
  }
}

/** Accepts the plan. The server saves the draft it kept after the safety filter; the app sends only a name. */
export async function markAiPlanAccepted(planName?: string): Promise<boolean> {
  if (!supabase) return false;
  try {
    const { error } = await supabase.rpc('mark_ai_plan_accepted', planName ? { p_plan_name: planName } : {});
    return !error;
  } catch {
    return false;
  }
}

/** Ends the user's current AI plan (kept for history, logged sets included) so they can build a new one. */
export async function endAiPlan(): Promise<boolean> {
  if (!supabase) return false;
  try {
    const { error } = await supabase.rpc('end_ai_plan');
    return !error;
  } catch {
    return false;
  }
}

export async function markAiFirstSessionDone(): Promise<boolean> {
  if (!supabase) return false;
  try {
    const { error } = await supabase.rpc('mark_ai_first_session_done');
    return !error;
  } catch {
    return false;
  }
}

/** Current-only body weight (no target). Teens: only when both health opt-ins are on. */
export async function writeBodyWeight(current: number, unit: 'lb' | 'kg', forUser?: string): Promise<boolean> {
  if (!supabase) return false;
  try {
    const body: Record<string, unknown> = {
      action: 'write',
      body_weight: JSON.stringify({ current, unit }),
    };
    if (forUser) body.user_id = forUser;
    const { error } = await supabase.functions.invoke('health-record', { body });
    return !error;
  } catch {
    return false;
  }
}
