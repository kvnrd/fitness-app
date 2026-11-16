// Adapters from the service-only SQL functions (via PostgREST rpc) to the handler interfaces.
// `rpc` is supabase-js `client.rpc` bound to a SERVICE-ROLE client; it never runs in the app.
import { fromPgBytea, toPgBytea } from './bytes.ts';
import type { AiContextRow } from './ai/handler.ts';
import type { HealthCipherRow, HealthDb, WrappedKeyRow } from './health/handler.ts';

export type Rpc = (fn: string, args: Record<string, unknown>) => Promise<{ data: unknown; error: { message: string } | null }>;

async function call(rpc: Rpc, fn: string, args: Record<string, unknown>): Promise<Record<string, unknown>[]> {
  const { data, error } = await rpc(fn, args);
  if (error) throw new Error(error.message); // mapped to a generic code by the handler
  if (data == null) return [];
  return (Array.isArray(data) ? data : [data]) as Record<string, unknown>[];
}

function keyRow(r: Record<string, unknown>): WrappedKeyRow {
  const wk = fromPgBytea(r.wrapped_key as string);
  if (!wk) throw new Error('missing_wrapped_key');
  return { wrapped_key: wk, key_provider: String(r.key_provider), kms_key_ref: String(r.kms_key_ref) };
}
const bytesOrNull = (b: Uint8Array | null) => (b === null ? null : toPgBytea(b));

export function healthDb(rpc: Rpc): HealthDb {
  return {
    async prepareWrite(actor) {
      const rows = await call(rpc, 'health_prepare_write', { p_actor: actor });
      return rows.length ? keyRow(rows[0]) : null;
    },
    async registerKey(actor, row) {
      const rows = await call(rpc, 'health_register_key', {
        p_actor: actor, p_wrapped_key: toPgBytea(row.wrapped_key), p_key_provider: row.key_provider, p_kms_key_ref: row.kms_key_ref,
      });
      if (!rows.length) throw new Error('register_failed');
      return keyRow(rows[0]);
    },
    async write(actor, notes, screen, category) {
      await call(rpc, 'health_write', {
        p_actor: actor, p_injury_notes_ct: bytesOrNull(notes), p_health_screen_ct: bytesOrNull(screen), p_injury_category_ct: bytesOrNull(category),
      });
    },
    async read(actor, target): Promise<HealthCipherRow | null> {
      const rows = await call(rpc, 'health_read', { p_actor: actor, p_target: target });
      if (!rows.length) return null;
      const r = rows[0];
      return {
        ...keyRow(r),
        injury_notes_ct: fromPgBytea(r.injury_notes_ct as string | null),
        health_screen_ct: fromPgBytea(r.health_screen_ct as string | null),
        injury_category_ct: fromPgBytea(r.injury_category_ct as string | null),
      };
    },
  };
}

export function aiDb(rpc: Rpc): { aiContext(actor: string): Promise<AiContextRow> } {
  return {
    async aiContext(actor) {
      const rows = await call(rpc, 'ai_plan_context', { p_actor: actor });
      if (!rows.length) throw new Error('forbidden');
      const r = rows[0];
      return {
        age_band: String(r.age_band),
        health_ok: r.health_ok === true,
        wrapped_key: fromPgBytea(r.wrapped_key as string | null),
        key_provider: (r.key_provider as string | null) ?? null,
        kms_key_ref: (r.kms_key_ref as string | null) ?? null,
        injury_category_ct: fromPgBytea(r.injury_category_ct as string | null),
      };
    },
  };
}
