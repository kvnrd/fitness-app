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
  weight_goal_ct: Uint8Array | null;
  body_weight_ct: Uint8Array | null;
}

/** Ciphertext per field. A key that is ABSENT keeps the stored value; null clears it (partial update). */
export type HealthCipherWrite = Partial<Record<'injury_notes' | 'health_screen' | 'injury_category' | 'weight_goal' | 'body_weight', Uint8Array | null>>;

/** Thin wrapper over the service-only RPCs (public.health_*). */
export interface HealthDb {
  prepareWrite(actor: string, target?: string | null): Promise<WrappedKeyRow | null>;
  registerKey(actor: string, row: WrappedKeyRow, target?: string | null): Promise<WrappedKeyRow>;
  write(actor: string, fields: HealthCipherWrite, target?: string | null): Promise<void>;
  read(actor: string, target: string): Promise<HealthCipherRow | null>;
}

export interface HealthDeps {
  db: HealthDb;
  providers: Providers;
  activeProviderId: string | undefined;
}

const MAX_NOTES = 2000;
const MAX_SCREEN = 4000;
const MAX_WEIGHT_GOAL = 200;
const WEIGHT_MIN = 40;
const WEIGHT_MAX = 1500;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const isWeight = (v: unknown): v is number | null => v === null || (typeof v === 'number' && Number.isFinite(v) && v >= WEIGHT_MIN && v <= WEIGHT_MAX);

/**
 * Validates the weight_goal JSON string: {current:number|null, target:number|null, unit:'lb'|'kg',
 * pace:'steady'|'moderate'|'fast'|null}, strict keys, numbers 40..1500, at most 200 characters.
 * Returns the canonical JSON to encrypt, or null when invalid. (Age is NOT known here: the SQL function
 * refuses to store a weight goal for 16-17 accounts.)
 */
export function canonicalWeightGoal(raw: string): string | null {
  if (raw.length > MAX_WEIGHT_GOAL) return null;
  let v: unknown;
  try { v = JSON.parse(raw); } catch { return null; }
  const o = strictObject(v, ['current', 'target', 'unit', 'pace']);
  if (!o) return null;
  const current = o.current ?? null, target = o.target ?? null, pace = o.pace ?? null;
  if (!isWeight(current) || !isWeight(target)) return null;
  if (o.unit !== 'lb' && o.unit !== 'kg') return null;
  if (pace !== null && pace !== 'steady' && pace !== 'moderate' && pace !== 'fast') return null;
  return JSON.stringify({ current, target, unit: o.unit, pace });
}

/**
 * Current body weight only (Counsel #5: teens may store a current weight with both health opt-ins,
 * never a goal or target). {current:number, unit:'lb'|'kg'}, 40..1500, at most 200 characters.
 */
export function canonicalBodyWeight(raw: string): string | null {
  if (raw.length > MAX_WEIGHT_GOAL) return null;
  let v: unknown;
  try { v = JSON.parse(raw); } catch { return null; }
  const o = strictObject(v, ['current', 'unit']);
  if (!o) return null;
  const current = o.current;
  if (typeof current !== 'number' || !Number.isFinite(current) || current < WEIGHT_MIN || current > WEIGHT_MAX) return null;
  if (o.unit !== 'lb' && o.unit !== 'kg') return null;
  return JSON.stringify({ current, unit: o.unit });
}

async function getOrCreateDek(deps: HealthDeps, actor: string, subject: string): Promise<Uint8Array> {
  const existing = await deps.db.prepareWrite(actor, subject === actor ? null : subject);
  if (existing) return providerFor(deps.providers, existing.key_provider).unwrapDataKey(existing.wrapped_key, existing.kms_key_ref, { userId: subject });
  const provider = activeProvider(deps.providers, deps.activeProviderId);
  const fresh = await provider.generateDataKey({ userId: subject });
  const stored = await deps.db.registerKey(actor, { wrapped_key: fresh.wrapped, key_provider: provider.id, kms_key_ref: fresh.keyRef }, subject === actor ? null : subject);
  if (stored.key_provider === provider.id && stored.kms_key_ref === fresh.keyRef && equalBytes(stored.wrapped_key, fresh.wrapped)) {
    return fresh.plaintext;
  }
  wipe(fresh.plaintext); // lost a race: another request stored a key first, use that one
  return providerFor(deps.providers, stored.key_provider).unwrapDataKey(stored.wrapped_key, stored.kms_key_ref, { userId: subject });
}

function equalBytes(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let d = 0;
  for (let i = 0; i < a.length; i++) d |= a[i] ^ b[i];
  return d === 0;
}

export async function handleHealthWrite(deps: HealthDeps, actor: string, input: unknown): Promise<HandlerResult> {
  const body = strictObject(input, ['injury_notes', 'health_screen', 'injury_category', 'weight_goal', 'body_weight', 'user_id']);
  if (!body) return fail(400, 'invalid_request');
  const target = body.user_id;
  if (target !== undefined && (typeof target !== 'string' || !UUID_RE.test(target))) return fail(400, 'invalid_request');
  const subject = typeof target === 'string' ? target : actor;
  // Partial update: a field that is absent keeps its stored value; an explicit null clears it.
  const plain: Partial<Record<keyof HealthCipherWrite, string | null>> = {};
  if ('injury_notes' in body) {
    const v = body.injury_notes;
    if (v !== null && (typeof v !== 'string' || v.length > MAX_NOTES)) return fail(400, 'invalid_request');
    plain.injury_notes = v;
  }
  if ('health_screen' in body) {
    const v = body.health_screen;
    if (v !== null && (typeof v !== 'string' || v.length > MAX_SCREEN)) return fail(400, 'invalid_request');
    plain.health_screen = v;
  }
  if ('injury_category' in body) {
    const v = body.injury_category;
    if (v !== null && !isOneOf(INJURY_CATEGORIES, v)) return fail(400, 'invalid_request');
    plain.injury_category = v as string | null;
  }
  if ('weight_goal' in body) {
    const v = body.weight_goal;
    if (v === null) plain.weight_goal = null;
    else {
      const canon = typeof v === 'string' ? canonicalWeightGoal(v) : null;
      if (canon === null) return fail(400, 'invalid_request');
      plain.weight_goal = canon;
    }
  }
  if ('body_weight' in body) {
    const v = body.body_weight;
    if (v === null) plain.body_weight = null;
    else {
      const canon = typeof v === 'string' ? canonicalBodyWeight(v) : null;
      if (canon === null) return fail(400, 'invalid_request');
      plain.body_weight = canon;
    }
  }

  let dek: Uint8Array | null = null;
  try {
    dek = await getOrCreateDek(deps, actor, subject);   // consent + onboarding are decided in SQL here
    const out: HealthCipherWrite = {};
    for (const f of Object.keys(plain) as (keyof HealthCipherWrite)[]) {
      const v = plain[f] as string | null;
      out[f] = v === null ? null : await encryptField(dek, v, fieldAad(subject, f));
    }
    await deps.db.write(actor, out, subject === actor ? null : subject);   // SQL refuses weight_goal for 16-17 ('forbidden')
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
        // Own record only: a coach never receives body-weight fields. SQL also nulls them for coaches.
        ...(t === actor ? {
          weight_goal: await dec(row.weight_goal_ct, 'weight_goal'),
          body_weight: await dec(row.body_weight_ct, 'body_weight'),
        } : {}),
      },
    });
  } catch (e) {
    return mapDbError(e);
  } finally {
    wipe(dek);
  }
}
