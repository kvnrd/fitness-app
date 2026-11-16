// POST /functions/v1/health-record
//   {"action":"write","injury_notes"?:string|null,"health_screen"?:string|null,"injury_category"?:string|null,
//    "weight_goal"?:string|null}   weight_goal = JSON string {current,target,unit,pace} (adults only).
//   Partial update: an omitted field keeps its stored value; an explicit null clears it.
//   {"action":"read","user_id"?:uuid}   (user_id = a client, for a coach; default = self)
// The only place health plaintext exists: in this function's memory, encrypted/decrypted with a
// per-user data key that KMS unwraps. Logs nothing about the request content.
import { handleHealthRead, handleHealthWrite } from '../_shared/health/handler.ts';
import { healthDb } from '../_shared/db.ts';
import { fail } from '../_shared/http.ts';
import { activeProviderId, keyProviders, readJson, respond, serviceRpc, verifiedUserId } from '../_shared/runtime.ts';

Deno.serve(async (req) => {
  if (req.method !== 'POST') return respond(fail(405, 'method_not_allowed'));
  const actor = await verifiedUserId(req);
  if (!actor) return respond(fail(401, 'not_authenticated'));
  const body = (await readJson(req)) as Record<string, unknown> | null;
  if (!body || typeof body !== 'object') return respond(fail(400, 'invalid_request'));
  const deps = { db: healthDb(serviceRpc()), providers: keyProviders(), activeProviderId: activeProviderId() };
  const { action, ...rest } = body;
  if (action === 'write') return respond(await handleHealthWrite(deps, actor, rest));
  if (action === 'read' && Object.keys(rest).every((k) => k === 'user_id')) return respond(await handleHealthRead(deps, actor, rest.user_id));
  return respond(fail(400, 'invalid_request'));
});
