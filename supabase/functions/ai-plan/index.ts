// POST /functions/v1/ai-plan  {"goal","experience","equipment":[],"daysPerWeek","sessionMinutes"}
// Calls Anthropic's Messages API from the backend only. The API key lives only in this function's
// environment (ANTHROPIC_API_KEY). Logs only a filter category, never prompts or output.
import { createAnthropicClient, assertModelAllowed } from '../_shared/ai/anthropic.ts';
import { handleAiPlan } from '../_shared/ai/handler.ts';
import { aiDb } from '../_shared/db.ts';
import { fail } from '../_shared/http.ts';
import { keyProviders, readJson, respond, serviceRpc, verifiedUserId } from '../_shared/runtime.ts';

Deno.serve(async (req) => {
  if (req.method !== 'POST') return respond(fail(405, 'method_not_allowed'));
  const actor = await verifiedUserId(req);
  if (!actor) return respond(fail(401, 'not_authenticated'));
  let model: string;
  let anthropic;
  try {
    model = assertModelAllowed(Deno.env.get('ANTHROPIC_MODEL'), Deno.env.get('ANTHROPIC_ZDR') === 'true');
    anthropic = createAnthropicClient(Deno.env.get('ANTHROPIC_API_KEY'), (u, init) => fetch(u, init));
  } catch {
    return respond(fail(503, 'ai_not_configured'));
  }
  const result = await handleAiPlan(
    {
      db: aiDb(serviceRpc()),
      providers: keyProviders(),
      anthropic,
      model,
      newRequestId: () => crypto.randomUUID(),
      onFiltered: (category) => console.warn(JSON.stringify({ event: 'ai_plan_filtered', category })),
    },
    actor,
    await readJson(req),
  );
  return respond(result);
});
