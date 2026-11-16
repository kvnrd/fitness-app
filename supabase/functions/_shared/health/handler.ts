// health-record server function logic (transport-free, so it is unit-tested in Node).
// The caller's id comes from a verified JWT (see health-record/index.ts). All authorization is
// decided by the service-only SQL functions; this layer only does the cryptography.
import { wipe } from '../bytes.ts';
import { decryptField, encryptField, fieldAad, type HealthField } from '../crypto/envelope.ts';
import { activeProvider, providerFor, type Providers } from '../crypto/providers.ts';
import { INJURY_CATEGORIES, isOneOf } from '../ai/schema.ts';
import { fail, mapDbError, ok, strictObject, type HandlerResult } from '../http.ts';

export interface WrappedKeyRow {
  wrapped_key: Uint8Array;
  key_provider: string;
  kms_key_ref: string;
}
export interface HealthCipherRow extends WrappedKeyRow {
  injury_notes_ct: Uint8Array | null;
  health_screen_ct: Uint8Array | null;
  injury_category_ct: Uint8Array | null;
}

/** Thin wrapper over the service-only RPCs (public.health_*). */
export interface HealthDb {
  prepareWrite(actor: string): Promise<WrappedKeyRow | null>;
  registerKey(actor: string, row: WrappedKeyRow): Promise<WrappedKeyRow>;
  write(actor: string, notes: Uint8Array | null, screen: Uint8Array | null, category: Uint8Array | null): Promise<void>;
  read(actor: string, target: string): Promise<HealthCipherRow | null>;
}

export interface HealthDeps {
  db: HealthDb;
  providers: Providers;
  activeProviderId: string | undefined;
}

const MAX_NOTES = 2000;
const MAX_SCREEN = 4000;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function getOrCreateDek(deps: HealthDeps, actor: string): Promise<Uint8Array> {
  const existing = await deps.db.prepareWrite(actor);
  if (existing) return providerFor(deps.providers, existing.key_provider).unwrapDataKey(existing.wrapped_key, existing.kms_key_ref, { userId: actor });
  const provider = activeProvider(deps.providers, deps.activeProviderId);
  const fresh = await provider.generateDataKey({ userId: actor });
  const stored = await deps.db.registerKey(actor, { wrapped_key: fresh.wrapped, key_provider: provider.id, kms_key_ref: fresh.keyRef });
  if (stored.key_provider === provider.id && stored.kms_key_ref === fresh.keyRef && equalBytes(stored.wrapped_key, fresh.wrapped)) {
    return fresh.plaintext;
  }
  wipe(fresh.plaintext); // lost a race: another request stored a key first, use that one
  return providerFor(deps.providers, stored.key_provider).unwrapDataKey(stored.wrapped_key, stored.kms_key_ref, { userId: actor });
}

function equalBytes(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let d = 0;
  for (let i = 0; i < a.length; i++) d |= a[i] ^ b[i];
  return d === 0;
}

export async function handleHealthWrite(deps: HealthDeps, actor: string, input: unknown): Promise<HandlerResult> {
  const body = strictObject(input, ['injury_notes', 'health_screen', 'injury_category']);
  if (!body) return fail(400, 'invalid_request');
  const notes = body.injury_notes ?? null;
  const screen = body.health_screen ?? null;
  const category = body.injury_category ?? null;
  if (notes !== null && (typeof notes !== 'string' || notes.length > MAX_NOTES)) return fail(400, 'invalid_request');
  if (screen !== null && (typeof screen !== 'string' || screen.length > MAX_SCREEN)) return fail(400, 'invalid_request');
  if (category !== null && !isOneOf(INJURY_CATEGORIES, category)) return fail(400, 'invalid_request');

  let dek: Uint8Array | null = null;
  try {
    dek = await getOrCreateDek(deps, actor);
    const enc = async (v: string | null, f: HealthField) => (v === null ? null : encryptField(dek!, v, fieldAad(actor, f)));
    await deps.db.write(
      actor,
      await enc(notes as string | null, 'injury_notes'),
      await enc(screen as string | null, 'health_screen'),
      await enc(category as string | null, 'injury_category'),
    );
    return ok({ saved: true });
  } catch (e) {
    return mapDbError(e);
  } finally {
    wipe(dek);
  }
}

export async function handleHealthRead(deps: HealthDeps, actor: string, target: unknown): Promise<HandlerResult> {
  const t = target ?? actor;
  if (typeof t !== 'string' || !UUID_RE.test(t)) return fail(400, 'invalid_request');
  let dek: Uint8Array | null = null;
  try {
    const row = await deps.db.read(actor, t);
    if (!row) return ok({ record: null });
    dek = await providerFor(deps.providers, row.key_provider).unwrapDataKey(row.wrapped_key, row.kms_key_ref, { userId: t });
    const dec = async (v: Uint8Array | null, f: HealthField) => (v === null ? null : decryptField(dek!, v, fieldAad(t, f)));
    return ok({
      record: {
        injury_notes: await dec(row.injury_notes_ct, 'injury_notes'),
        health_screen: await dec(row.health_screen_ct, 'health_screen'),
        injury_category: await dec(row.injury_category_ct, 'injury_category'),
      },
    });
  } catch (e) {
    return mapDbError(e);
  } finally {
    wipe(dek);
  }
}
