import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { ANTHROPIC_MESSAGES_URL, assertAllowedRequest, assertModelAllowed, createAnthropicClient, type AnthropicClient } from '../_shared/ai/anthropic.ts';
import { planToDraft, type PlanDraft } from '../_shared/ai/draft.ts';
import type { Plan } from '../_shared/ai/plan.ts';
import { handleAiPlan, type AiContextRow } from '../_shared/ai/handler.ts';
import { AI_PLAN_NOTICE } from '../_shared/ai/notice.ts';
import { buildPlanRequest, type MessagesRequest } from '../_shared/ai/prompt.ts';
import { parsePlanRequest, type PlanRequest } from '../_shared/ai/schema.ts';
import { encryptField, fieldAad } from '../_shared/crypto/envelope.ts';
import { ALICE, devProvider } from './helpers.ts';

const here = dirname(fileURLToPath(import.meta.url));
const VALID: PlanRequest = { goal: 'build_strength', experience: 'beginner', equipment: ['dumbbells', 'bench'], daysPerWeek: 3, sessionMinutes: 45 };
const PII = {
  name: 'Alice Example', email: 'alice@example.com', user_id: ALICE, photo: 'file:///progress/1.jpg',
  location: 'Austin, TX', injury_notes: 'tore my ACL skiing in Aspen last March',
};

function goodPlanJson(days = 3): string {
  const keys = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
  return JSON.stringify({
    days: keys.map((d, i) => i < days
      ? { day: d, title: `Day ${i + 1}`, focus: 'Full body', duration_min: 45, rest: false,
          exercises: [{ name: 'Goblet squat', sets: 3, target: '8-10 reps', notes: 'Smooth tempo' }] }
      : { day: d, title: 'Rest', focus: '', duration_min: 0, rest: true, exercises: [] }),
    swaps: [{ avoid: 'Jump squats', instead: 'Box squats' }],
  });
}

/** The facts object inside the user message, plus the full text Anthropic would receive. */
function facts(req: MessagesRequest): Record<string, unknown> {
  const c = req.messages[0].content;
  return JSON.parse(c.slice(c.indexOf('{')));
}
function allText(req: MessagesRequest): string {
  return JSON.stringify(req) + '\n' + req.system + '\n' + req.messages.map((m) => m.content).join('\n');
}

function mockAnthropic(text: string, stopReason: string | null = 'end_turn') {
  const sent: MessagesRequest[] = [];
  const client: AnthropicClient = { async createMessage(req) { sent.push(req); return { text, stopReason }; } };
  return { client, sent };
}

async function ctxFor(opts: { band?: string; category?: string | null; healthOk?: boolean } = {}) {
  const provider = devProvider();
  const k = await provider.generateDataKey({ userId: ALICE });
  const ctx: AiContextRow = {
    age_band: opts.band ?? '18_plus',
    health_ok: opts.healthOk ?? true,
    wrapped_key: k.wrapped, key_provider: 'local-dev', kms_key_ref: k.keyRef,
    injury_category_ct: opts.category ? await encryptField(k.plaintext, opts.category, fieldAad(ALICE, 'injury_category')) : null,
  };
  return { ctx, providers: { 'local-dev': provider } };
}

function deps(ctx: AiContextRow, providers: Record<string, unknown>, client: AnthropicClient, filtered: string[] = []) {
  let n = 0;
  return {
    db: { aiContext: async () => ctx },
    providers: providers as never,
    anthropic: client,
    model: 'claude-test-model',
    newRequestId: () => `00000000-0000-4000-8000-00000000000${++n}`,
    onFiltered: (c: string) => { filtered.push(c); },
  };
}

// ---------------------------------------------------------------- redaction
test('redaction: requests carrying name/email/user id/photo/location/notes are rejected outright', () => {
  for (const [k, v] of Object.entries(PII)) assert.equal(parsePlanRequest({ ...VALID, [k]: v }), null, k);
  assert.equal(parsePlanRequest({ ...VALID, goal: 'write me a poem about Alice' }), null);
  assert.equal(parsePlanRequest({ ...VALID, equipment: ['dumbbells', 'my garage at 12 Main St'] }), null);
  assert.ok(parsePlanRequest(VALID));
});

test('redaction: the prompt is built from an allowlist (no PII even if a caller smuggles it in)', () => {
  const req = buildPlanRequest({ ...(VALID as PlanRequest), ...PII, requestId: 'req-1', ageBand: '18_plus', injuryCategory: 'knee' } as never, 'm');
  const wire = allText(req);
  for (const v of Object.values(PII)) assert.ok(!wire.includes(v), `leaked: ${v}`);
  assert.deepEqual(Object.keys(facts(req)).sort(),
    ['age_range', 'equipment', 'experience', 'goal', 'injury_category', 'request_id', 'session_minutes', 'training_days_per_week']);
  assert.equal(facts(req).injury_category, 'knee');
  assert.equal(facts(req).age_range, '18+');
  assert.deepEqual(req.metadata, { user_id: 'req-1' });
  assert.deepEqual(Object.keys(req).sort(), ['max_tokens', 'messages', 'metadata', 'model', 'system']);
});

test('redaction (end to end): the user id, free-text notes and PII never reach Anthropic; a fresh random id per request', async () => {
  const { ctx, providers } = await ctxFor({ category: 'knee' });
  const { client, sent } = mockAnthropic(goodPlanJson());
  const d = deps(ctx, providers, client);
  assert.equal((await handleAiPlan(d, ALICE, VALID)).status, 200);
  assert.equal((await handleAiPlan(d, ALICE, VALID)).status, 200);
  assert.equal((await handleAiPlan(d, ALICE, { ...VALID, ...PII })).status, 400);
  assert.equal(sent.length, 2);
  for (const req of sent) {
    const wire = allText(req);
    assert.ok(!wire.includes(ALICE), 'user id leaked');
    for (const v of Object.values(PII)) assert.ok(!wire.includes(v));
    assert.equal(facts(req).injury_category, 'knee');
    assert.equal(facts(req).request_id, req.metadata.user_id);
  }
  assert.notEqual(sent[0].metadata.user_id, sent[1].metadata.user_id);
});

test('injury category is omitted ("none") without health-data consent', async () => {
  const { ctx, providers } = await ctxFor({ category: 'knee', healthOk: false });
  const { client, sent } = mockAnthropic(goodPlanJson());
  await handleAiPlan(deps(ctx, providers, client), ALICE, VALID);
  assert.equal(facts(sent[0]).injury_category, 'none');
});

test('injury category is only used to avoid/swap exercises (system prompt), never rehab', () => {
  const req = buildPlanRequest({ ...(VALID as PlanRequest), requestId: 'r', ageBand: '18_plus', injuryCategory: 'knee' }, 'm');
  assert.match(req.system, /ONLY to leave out or swap exercises/);
  assert.match(req.system, /never give treatment, rehab or physical-therapy plans/i);
});

test('minors: weight-loss goal refused and minor rules added to the system prompt', async () => {
  const { ctx, providers } = await ctxFor({ band: '16_17' });
  const { client, sent } = mockAnthropic(goodPlanJson());
  assert.deepEqual(await handleAiPlan(deps(ctx, providers, client), ALICE, { ...VALID, goal: 'lose_fat' }), { status: 400, body: { error: 'goal_not_available' } });
  assert.equal(sent.length, 0);
  await handleAiPlan(deps(ctx, providers, client), ALICE, VALID);
  assert.match(sent[0].system, /16 or 17 years old/);
  assert.match(sent[0].system, /No bulking, body-size or weight targets/);
  assert.match(sent[0].system, /no supplement suggestions/);
  assert.equal(facts(sent[0]).age_range, '16-17');
});

// ---------------------------------------------------------------- output handling
test('output: a clean plan is returned with the exact plan-screen notice', async () => {
  const { ctx, providers } = await ctxFor();
  const r = await handleAiPlan(deps(ctx, providers, mockAnthropic('Here you go:\n' + goodPlanJson()).client), ALICE, VALID);
  assert.equal(r.status, 200);
  assert.equal(r.body.notice, "Made with AI. It can be wrong, so check that it fits you. It isn't medical advice. Stop and see a professional if anything hurts.");
  assert.equal(r.body.ai_generated, true);
});

test('output: flagged content is withheld (fail closed), only the category is reported', async () => {
  const { ctx, providers } = await ctxFor();
  const filtered: string[] = [];
  const bad = goodPlanJson().replace('Smooth tempo', 'Do extra cardio to burn off what you ate');
  const r = await handleAiPlan(deps(ctx, providers, mockAnthropic(bad).client, filtered), ALICE, VALID);
  assert.deepEqual(r, { status: 422, body: { error: 'plan_unavailable' } });
  assert.deepEqual(filtered, ['eating_disorder']);
});

test('output: model refusals, malformed JSON and wrong day counts are not passed through', async () => {
  const { ctx, providers } = await ctxFor();
  assert.equal((await handleAiPlan(deps(ctx, providers, mockAnthropic(goodPlanJson(), 'refusal').client), ALICE, VALID)).status, 422);
  assert.equal((await handleAiPlan(deps(ctx, providers, mockAnthropic('not json').client), ALICE, VALID)).status, 422);
  assert.equal((await handleAiPlan(deps(ctx, providers, mockAnthropic(goodPlanJson(5)).client), ALICE, VALID)).status, 422);
});

test('output: unknown fields from the model are dropped (no personal data in the output shape)', async () => {
  const { ctx, providers } = await ctxFor();
  const withExtra = JSON.stringify({ ...JSON.parse(goodPlanJson()), user: { name: 'Alice', email: 'a@b.c' } });
  const r = await handleAiPlan(deps(ctx, providers, mockAnthropic(withExtra).client), ALICE, VALID);
  assert.equal(r.status, 200);
  assert.ok(!JSON.stringify(r.body).includes('a@b.c'));
});

test('consent / rate-limit refusals from the database stop the call before Anthropic', async () => {
  const { client, sent } = mockAnthropic(goodPlanJson());
  const d = { ...deps({} as AiContextRow, {}, client), db: { aiContext: async () => { throw new Error('consent_required'); } } };
  assert.deepEqual(await handleAiPlan(d, ALICE, VALID), { status: 403, body: { error: 'consent_required' } });
  const d2 = { ...d, db: { aiContext: async () => { throw new Error('rate_limited'); } } };
  assert.equal((await handleAiPlan(d2, ALICE, VALID)).status, 429);
  const d3 = { ...d, db: { aiContext: async () => { throw new Error('health_screen_required'); } } };
  assert.deepEqual(await handleAiPlan(d3, ALICE, VALID), { status: 403, body: { error: 'health_screen_required' } });
  const d4 = { ...d, db: { aiContext: async () => { throw new Error('clearance_required'); } } };
  assert.deepEqual(await handleAiPlan(d4, ALICE, VALID), { status: 403, body: { error: 'clearance_required' } });
  assert.equal(sent.length, 0);
});

test('output: a minor-restricted plan is withheld and only the reason code is logged', async () => {
  const { ctx, providers } = await ctxFor({ band: '16_17' });
  const filtered: string[] = [];
  const bad = goodPlanJson().replace('Smooth tempo', 'Run a dirty bulk and take creatine');
  const r = await handleAiPlan(deps(ctx, providers, mockAnthropic(bad).client, filtered), ALICE, VALID);
  assert.deepEqual(r, { status: 422, body: { error: 'plan_unavailable' } });
  assert.deepEqual(filtered, ['minor_restricted']);
  assert.ok(!JSON.stringify(r.body).includes('creatine') && !JSON.stringify(r.body).includes('bulk'));
});

test('output: refusals and unparseable plans log only an allowlisted reason code', async () => {
  const { ctx, providers } = await ctxFor();
  const filtered: string[] = [];
  assert.equal((await handleAiPlan(deps(ctx, providers, mockAnthropic(goodPlanJson(), 'refusal').client, filtered), ALICE, VALID)).status, 422);
  assert.equal((await handleAiPlan(deps(ctx, providers, mockAnthropic('not json').client, filtered), ALICE, VALID)).status, 422);
  assert.deepEqual(filtered, ['refusal', 'unparseable']);
});

// ---------------------------------------------------------------- Anthropic client
test('anthropic client: Messages API only, no beta headers, key only in the header', async () => {
  const calls: { url: string; headers: Record<string, string>; body: string }[] = [];
  const c = createAnthropicClient('test-key-not-real', async (url, init) => {
    calls.push({ url, headers: init.headers, body: init.body });
    return { ok: true, status: 200, json: async () => ({ content: [{ type: 'text', text: 'hi' }], stop_reason: 'end_turn' }) };
  });
  const r = await c.createMessage(buildPlanRequest({ ...(VALID as PlanRequest), requestId: 'r', ageBand: '18_plus', injuryCategory: 'none' }, 'm'));
  assert.equal(r.text, 'hi');
  assert.equal(calls[0].url, 'https://api.anthropic.com/v1/messages');
  assert.equal(ANTHROPIC_MESSAGES_URL, 'https://api.anthropic.com/v1/messages');
  assert.deepEqual(Object.keys(calls[0].headers).sort(), ['anthropic-version', 'content-type', 'x-api-key']);
  assert.ok(!calls[0].body.includes('test-key-not-real'));
});

test('anthropic client: tools, files, images, containers, MCP and output schemas are refused', () => {
  const base = { model: 'm', max_tokens: 10, system: 's', messages: [{ role: 'user', content: 'x' }] };
  for (const extra of [{ tools: [] }, { container: 'c' }, { mcp_servers: [] }, { output_format: {} }, { output_config: {} }, { betas: ['files-api'] }, { stream: true }, { temperature: 0.4 }, { top_p: 0.9 }, { top_k: 5 }]) {
    assert.throws(() => assertAllowedRequest({ ...base, ...extra }), /field_not_allowed/);
  }
  assert.throws(() => assertAllowedRequest({ ...base, messages: [{ role: 'user', content: [{ type: 'image' }] }] }), /non_text/);
  assert.throws(() => assertAllowedRequest({ ...base, metadata: { user_id: 'r', email: 'a@b.c' } }), /bad_metadata/);
  assert.throws(() => createAnthropicClient(undefined, async () => ({ ok: true, status: 200, json: async () => ({}) })), /key_not_configured/);
});

test('anthropic client: HTTP errors do not echo the response body', async () => {
  const c = createAnthropicClient('k', async () => ({ ok: false, status: 400, json: async () => ({ error: 'echo of prompt' }) }));
  await assert.rejects(c.createMessage(buildPlanRequest({ ...(VALID as PlanRequest), requestId: 'r', ageBand: '18_plus', injuryCategory: 'none' }, 'm')), (e: Error) => e.message === 'anthropic_http_400');
});

test('model: required, and Covered Models are refused under ZDR', () => {
  assert.throws(() => assertModelAllowed(undefined, false), /not_configured/);
  assert.throws(() => assertModelAllowed('claude-fable-5-1', true), /covered_model/);
  assert.throws(() => assertModelAllowed('claude-mythos-5', true), /covered_model/);
  assert.equal(assertModelAllowed('claude-fable-5-1', false), 'claude-fable-5-1');
});

test('source scan: no Batch/Files/Skills/Managed Agents/feedback endpoints anywhere in the server code', () => {
  const root = join(here, '..');
  const files: string[] = [];
  const walk = (d: string) => {
    for (const f of readdirSync(d)) {
      const p = join(d, f);
      if (f === 'tests' || f === 'node_modules') continue;
      if (statSync(p).isDirectory()) walk(p);
      else if (p.endsWith('.ts')) files.push(p);
    }
  };
  walk(root);
  assert.ok(files.length > 5);
  for (const f of files) {
    const src = readFileSync(f, 'utf8').split('\n').filter((l) => !/^\s*(\/\/|\*)/.test(l)).join('\n');
    for (const bad of [/\/v1\/messages\/batches/, /\/v1\/files/, /\/v1\/skills/, /\/v1\/agents/, /anthropic-beta/i, /feedback/i, /api\.anthropic\.com\/(?!v1\/messages')/]) {
      assert.ok(!bad.test(src), `${f} matches ${bad}`);
    }
  }
});

test('notice: the app shows exactly the same text as the server', () => {
  const app = readFileSync(join(here, '../../../src/ai/notice.ts'), 'utf8');
  assert.ok(app.includes(JSON.stringify(AI_PLAN_NOTICE)), 'src/ai/notice.ts must contain the exact notice');
});

test('ToS §12: health info, photos and messages never reach the AI prompt or request', () => {
  const ok = parsePlanRequest({ goal: 'build_strength', experience: 'beginner', equipment: ['dumbbells'], daysPerWeek: 3, sessionMinutes: 45 });
  assert.ok(ok);
  assert.equal(parsePlanRequest({ ...ok, notes: 'sore knee after practice' }), null);
  assert.equal(parsePlanRequest({ ...ok, photo: 's3://photo.jpg' }), null);
  assert.equal(parsePlanRequest({ ...ok, message: 'hey coach' }), null);
  assert.equal(parsePlanRequest({ ...ok, health_screen: 'yes' }), null);
  const req = buildPlanRequest({
    requestId: 'req-not-a-user-id',
    goal: 'build_strength',
    experience: 'beginner',
    equipment: ['dumbbells'],
    daysPerWeek: 3,
    sessionMinutes: 45,
    ageBand: '18_plus',
    injuryCategory: 'knee',
  }, 'claude-test');
  const blob = JSON.stringify(req);
  assert.equal(/sore knee|photo\.jpg|hey coach|health_screen|injury notes|email@|user id/i.test(blob), false);
  assert.equal(blob.includes('injury_category'), true);
  assert.equal(blob.includes('knee'), true);
  assert.equal(blob.includes('training_days_per_week'), true);
  assert.equal(blob.includes('session_minutes'), true);
  assert.throws(() => assertAllowedRequest({ ...req, messages: [{ role: 'user', content: [{ type: 'image', source: 'x' }] }] }), /non_text/);
});

test('goal weight is never sent to Anthropic, for every user', () => {
  for (const ageBand of ['16_17', '18_plus'] as const) {
    const req = buildPlanRequest({
      requestId: 'req-not-a-user-id',
      goal: 'build_strength',
      experience: 'beginner',
      equipment: ['dumbbells'],
      daysPerWeek: 3,
      sessionMinutes: 45,
      ageBand,
      injuryCategory: 'knee',
    }, 'claude-test');
    const blob = JSON.stringify(req);
    assert.equal(blob.includes('weight_goal'), false);
    assert.equal(/goal_weight|weightGoal|target_weight|138 lb/i.test(blob), false);
  }
  const ok = parsePlanRequest({ goal: 'build_strength', experience: 'beginner', equipment: ['dumbbells'], daysPerWeek: 3, sessionMinutes: 45 });
  assert.ok(ok);
  assert.equal(parsePlanRequest({ ...ok, weight_goal: { direction: 'Lose', target: 138, unit: 'lb' } }), null);
});

test('draft: a clean plan is kept server-side for "Start this plan"; a withheld one never is', async () => {
  const { ctx, providers } = await ctxFor();
  const saved: { actor: string; draft: PlanDraft }[] = [];
  const d = { ...deps(ctx, providers, mockAnthropic(goodPlanJson()).client), saveDraft: async (actor: string, draft: PlanDraft) => { saved.push({ actor, draft }); } };
  assert.equal((await handleAiPlan(d, ALICE, VALID)).status, 200);
  assert.equal(saved.length, 1);
  assert.equal(saved[0].actor, ALICE);
  assert.ok(saved[0].draft.days.length > 0);

  const bad = goodPlanJson().replace('Smooth tempo', 'Do extra cardio to burn off what you ate');
  const d2 = { ...deps(ctx, providers, mockAnthropic(bad).client), saveDraft: async (actor: string, draft: PlanDraft) => { saved.push({ actor, draft }); } };
  assert.equal((await handleAiPlan(d2, ALICE, VALID)).status, 422);
  assert.equal(saved.length, 1);

  const d3 = { ...deps(ctx, providers, mockAnthropic(goodPlanJson()).client), saveDraft: async () => { throw new Error('db down'); } };
  assert.deepEqual(await handleAiPlan(d3, ALICE, VALID), { status: 500, body: { error: 'server_error' } });
});

test('draft: exercises map to strength or cardio with matching log fields', () => {
  const plan: Plan = {
    days: [
      { day: 'mon', title: 'Strength', focus: 'Legs', duration_min: 45, rest: false, exercises: [
        { name: 'Back squat', sets: 4, target: '6-8 reps', notes: 'Brace' },
        { name: 'Easy run', sets: 1, target: '20 min', notes: '' },
        { name: 'Row', sets: 1, target: '2 km', notes: '' },
        { name: 'Walking lunge', sets: 3, target: '10 reps per leg, 20 m', notes: '' },
      ] },
      { day: 'tue', title: 'Rest', focus: '', duration_min: 0, rest: true, exercises: [] },
    ],
    swaps: [],
  };
  const draft = planToDraft(plan);
  assert.deepEqual(draft.days.map((x) => x.day_key), ['mon', 'tue']);
  const ex = draft.days[0].exercises;
  assert.deepEqual(ex.map((x) => x.kind), ['strength', 'cardio', 'cardio', 'strength']);
  assert.deepEqual(ex[0].fields, ['weight', 'reps']);
  assert.deepEqual(ex[1].fields, ['time', 'distance']);
  assert.equal(ex[0].description, 'Brace');
  assert.equal(draft.days[1].rest, true);
});
