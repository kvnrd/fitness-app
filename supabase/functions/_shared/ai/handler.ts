// ai-plan server function logic (transport-free; unit-tested in Node with mocks, no real API calls).
import { wipe } from '../bytes.ts';
import { decryptField, fieldAad } from '../crypto/envelope.ts';
import { providerFor, type Providers } from '../crypto/providers.ts';
import { fail, mapDbError, ok, type HandlerResult } from '../http.ts';
import type { AnthropicClient } from './anthropic.ts';
import { filterPlan } from './filter.ts';
import { AI_PLAN_NOTICE } from './notice.ts';
import { parsePlan } from './plan.ts';
import { buildPlanRequest } from './prompt.ts';
import { AGE_BANDS, INJURY_CATEGORIES, isOneOf, MINOR_BLOCKED_GOALS, parsePlanRequest, type InjuryCategory } from './schema.ts';

export interface AiContextRow {
  age_band: string;
  health_ok: boolean;
  wrapped_key: Uint8Array | null;
  key_provider: string | null;
  kms_key_ref: string | null;
  injury_category_ct: Uint8Array | null;
}

export interface AiDeps {
  db: { aiContext(actor: string): Promise<AiContextRow> };
  providers: Providers;
  anthropic: AnthropicClient;
  model: string;
  /** Random per-request id. Never derived from, logged with, or stored against the user id. */
  newRequestId: () => string;
  /** Category-only event log (no prompt, no output, no rejected draft, no user id in the payload). */
  onFiltered?: (category: string) => void | Promise<void>;
}

async function injuryCategory(deps: AiDeps, actor: string, ctx: AiContextRow): Promise<InjuryCategory> {
  if (!ctx.health_ok || !ctx.injury_category_ct || !ctx.wrapped_key || !ctx.key_provider || !ctx.kms_key_ref) return 'none';
  let dek: Uint8Array | null = null;
  try {
    dek = await providerFor(deps.providers, ctx.key_provider).unwrapDataKey(ctx.wrapped_key, ctx.kms_key_ref, { userId: actor });
    const v = await decryptField(dek, ctx.injury_category_ct, fieldAad(actor, 'injury_category'));
    return isOneOf(INJURY_CATEGORIES, v) ? v : 'none';
  } finally {
    wipe(dek);
  }
}

export async function handleAiPlan(deps: AiDeps, actor: string, input: unknown): Promise<HandlerResult> {
  const req = parsePlanRequest(input);
  if (!req) return fail(400, 'invalid_request');

  let ctx: AiContextRow;
  try {
    ctx = await deps.db.aiContext(actor); // consent (teen + parent for 16-17), onboarding, rate limit
  } catch (e) {
    return mapDbError(e);
  }
  if (!isOneOf(AGE_BANDS, ctx.age_band)) return fail(500, 'server_error');
  const minor = ctx.age_band === '16_17';
  if (minor && MINOR_BLOCKED_GOALS.includes(req.goal)) return fail(400, 'goal_not_available');

  let category: InjuryCategory;
  try {
    category = await injuryCategory(deps, actor, ctx);
  } catch {
    return fail(500, 'server_error');
  }

  const request = buildPlanRequest(
    { requestId: deps.newRequestId(), ...req, ageBand: ctx.age_band as '16_17' | '18_plus', injuryCategory: category },
    deps.model,
  );

  let text: string;
  try {
    const r = await deps.anthropic.createMessage(request);
    if (r.stopReason === 'refusal') {
      await deps.onFiltered?.('refusal');
      return fail(422, 'plan_unavailable');
    }
    text = r.text;
  } catch {
    return fail(502, 'plan_unavailable');
  }

  const plan = parsePlan(text, req.daysPerWeek);
  if (!plan) {
    await deps.onFiltered?.('unparseable');
    return fail(422, 'plan_unavailable');
  }
  const verdict = filterPlan(plan, { minor });
  if (!verdict.ok) {
    await deps.onFiltered?.(verdict.category);
    return fail(422, 'plan_unavailable');
  }
  // Nothing is sent back to Anthropic (no thumbs up/down feedback, ever).
  return ok({ plan, ai_generated: true, notice: AI_PLAN_NOTICE });
}
