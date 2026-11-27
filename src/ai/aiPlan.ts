import { supabase } from '../auth/supabase';
import { AI_PLAN_NOTICE } from './notice';

/**
 * Client for the ai-plan server function. The app never talks to Anthropic and never holds an API key.
 * Only these enum/integer fields can be sent; the server rejects anything else (no name, email, notes,
 * photos, or location). Age band and injury category are added server-side.
 * Web also needs CORS on the function first.
 */
export type AiGoal = 'build_strength' | 'build_muscle' | 'general_fitness' | 'endurance' | 'mobility' | 'sport_performance' | 'lose_fat' | 'hybrid' | 'hyrox';
export type AiExperience = 'beginner' | 'intermediate' | 'advanced';
export type AiEquipment = 'none' | 'dumbbells' | 'barbell' | 'kettlebell' | 'machines' | 'cables' | 'bands' | 'pullup_bar' | 'bench' | 'cardio_machine';

export interface AiPlanRequest {
  goal: AiGoal;
  experience: AiExperience;
  equipment: AiEquipment[];
  daysPerWeek: number;
  sessionMinutes: number;
}

export interface AiPlanExercise { name: string; sets: number; target: string; notes: string }
export interface AiPlanDay { day: string; title: string; focus: string; duration_min: number; rest: boolean; exercises: AiPlanExercise[] }
export interface AiPlan { overview?: string; days: AiPlanDay[]; swaps: { avoid: string; instead: string }[] }

export type AiPlanResult =
  | { ok: true; plan: AiPlan; notice: string }
  | { ok: false; reason: 'consent_required' | 'health_screen_required' | 'clearance_required' | 'parent_required' | 'rate_limited' | 'goal_not_available' | 'unavailable' };

export async function requestAiPlan(req: AiPlanRequest): Promise<AiPlanResult> {
  if (!supabase) return { ok: false, reason: 'unavailable' };
  try {
    const { data, error } = await supabase.functions.invoke('ai-plan', { body: req });
    if (error) {
      // FunctionsHttpError carries the Response; the server only ever sends a generic error code.
      let code: unknown;
      try {
        code = (await (error as { context?: Response }).context?.json())?.error;
      } catch {
        code = undefined;
      }
      if (code === 'consent_required' || code === 'health_screen_required' || code === 'clearance_required' || code === 'parent_required' || code === 'rate_limited' || code === 'goal_not_available') return { ok: false, reason: code };
      return { ok: false, reason: 'unavailable' };
    }
    if (!data || data.ai_generated !== true || !data.plan) return { ok: false, reason: 'unavailable' };
    // Always show OUR copy of the notice (identical wording; never trust a server string for legal text).
    return { ok: true, plan: data.plan as AiPlan, notice: AI_PLAN_NOTICE };
  } catch {
    return { ok: false, reason: 'unavailable' };
  }
}
