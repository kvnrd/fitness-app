// Small HTTP helpers. Error bodies are generic codes only: never echo SQL errors, KMS errors,
// prompts, model output or user input.

export type HandlerResult = { status: number; body: Record<string, unknown> };

export const ok = (body: Record<string, unknown>): HandlerResult => ({ status: 200, body });
export const fail = (status: number, error: string): HandlerResult => ({ status, body: { error } });

/** Maps a database error message to a generic client error. */
export function mapDbError(e: unknown): HandlerResult {
  const msg = e instanceof Error ? e.message : String(e);
  if (/consent_required/.test(msg)) return fail(403, 'consent_required');
  if (/forbidden|not_authenticated/.test(msg)) return fail(403, 'forbidden');
  if (/rate_limited/.test(msg)) return fail(429, 'rate_limited');
  return fail(500, 'server_error');
}

/** Rejects anything that is not a plain object with only the allowed keys. */
export function strictObject(input: unknown, allowed: readonly string[]): Record<string, unknown> | null {
  if (input === null || typeof input !== 'object' || Array.isArray(input)) return null;
  const obj = input as Record<string, unknown>;
  for (const k of Object.keys(obj)) if (!allowed.includes(k)) return null;
  return obj;
}
