// Minimal Anthropic client: the Messages API only, from the backend only (Counsel section 12/13).
// Not used: Batch API (29-day storage), Files API, Skills, Managed Agents, beta headers, tools,
// structured-output JSON schemas, or any feedback endpoint. assertAllowedRequest() enforces this on
// every call so a later edit cannot quietly add one.
import type { MessagesRequest } from './prompt.ts';

export const ANTHROPIC_MESSAGES_URL = 'https://api.anthropic.com/v1/messages';
export const ANTHROPIC_VERSION = '2023-06-01';

const ALLOWED_KEYS = ['model', 'max_tokens', 'system', 'messages', 'metadata', 'temperature'];

/** Covered Models need 30-day retention, so they are refused when ZDR is in place (Counsel section 12). */
export function assertModelAllowed(model: string | undefined, zdr: boolean): string {
  if (!model || !/^[a-z0-9][a-z0-9.\-]{2,100}$/i.test(model)) throw new Error('anthropic_model_not_configured');
  if (zdr && /fable|mythos/i.test(model)) throw new Error('covered_model_not_allowed_under_zdr');
  return model;
}

export function assertAllowedRequest(req: Record<string, unknown>): void {
  for (const k of Object.keys(req)) if (!ALLOWED_KEYS.includes(k)) throw new Error(`anthropic_field_not_allowed:${k}`);
  const msgs = req.messages;
  if (!Array.isArray(msgs) || msgs.length === 0) throw new Error('anthropic_bad_messages');
  for (const m of msgs) {
    // Plain text only: no images (photos), documents or file references.
    if (typeof m !== 'object' || m === null || typeof (m as { content?: unknown }).content !== 'string') {
      throw new Error('anthropic_non_text_content');
    }
  }
  const meta = req.metadata as Record<string, unknown> | undefined;
  if (meta && Object.keys(meta).some((k) => k !== 'user_id')) throw new Error('anthropic_bad_metadata');
}

export type FetchLike = (url: string, init: { method: 'POST'; headers: Record<string, string>; body: string; signal?: AbortSignal }) => Promise<{
  ok: boolean;
  status: number;
  json(): Promise<unknown>;
}>;

export interface AnthropicClient {
  createMessage(req: MessagesRequest): Promise<{ text: string; stopReason: string | null }>;
}

export function createAnthropicClient(apiKey: string | undefined, fetchImpl: FetchLike, timeoutMs = 60_000): AnthropicClient {
  if (!apiKey) throw new Error('anthropic_key_not_configured');
  return {
    async createMessage(req) {
      assertAllowedRequest(req as unknown as Record<string, unknown>);
      const ctl = new AbortController();
      const timer = setTimeout(() => ctl.abort(), timeoutMs);
      try {
        const res = await fetchImpl(ANTHROPIC_MESSAGES_URL, {
          method: 'POST',
          headers: { 'content-type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': ANTHROPIC_VERSION },
          body: JSON.stringify(req),
          signal: ctl.signal,
        });
        if (!res.ok) throw new Error(`anthropic_http_${res.status}`); // never include the body
        const data = (await res.json()) as { content?: { type: string; text?: string }[]; stop_reason?: string | null };
        const text = (data.content ?? []).filter((c) => c.type === 'text' && typeof c.text === 'string').map((c) => c.text).join('');
        return { text, stopReason: data.stop_reason ?? null };
      } finally {
        clearTimeout(timer);
      }
    },
  };
}
