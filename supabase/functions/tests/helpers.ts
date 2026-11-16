import { LocalDevKeyProvider } from '../_shared/crypto/localDev.ts';
import type { HealthCipherRow, HealthCipherWrite, HealthDb, WrappedKeyRow } from '../_shared/health/handler.ts';

export const ALICE = '11111111-1111-4111-8111-111111111111';
export const BOB = '22222222-2222-4222-8222-222222222222';

export function devProvider(): LocalDevKeyProvider {
  return new LocalDevKeyProvider(crypto.getRandomValues(new Uint8Array(32)), 'test');
}

/** In-memory stand-in for the service-only SQL API. Stores exactly what Postgres would: bytes. */
export class FakeHealthDb implements HealthDb {
  keys = new Map<string, WrappedKeyRow>();
  rows = new Map<string, { n: Uint8Array | null; s: Uint8Array | null; c: Uint8Array | null; w: Uint8Array | null }>();
  minors = new Set<string>();
  allowed = new Set<string>();
  coachOf = new Map<string, string>(); // coach -> client
  async prepareWrite(actor: string) {
    if (!this.allowed.has(actor)) throw new Error('consent_required (SQLSTATE 42501) detail that must not leak');
    return this.keys.get(actor) ?? null;
  }
  async registerKey(actor: string, row: WrappedKeyRow) {
    if (!this.keys.has(actor)) this.keys.set(actor, row);
    return this.keys.get(actor)!;
  }
  async write(actor: string, f: HealthCipherWrite) {
    if (!this.keys.has(actor)) throw new Error('no_data_key');
    if (this.minors.has(actor) && f.weight_goal) throw new Error('forbidden (SQLSTATE 42501) detail that must not leak');
    const cur = this.rows.get(actor) ?? { n: null, s: null, c: null, w: null };
    // Same semantics as public.health_write: absent key keeps, null clears.
    this.rows.set(actor, {
      n: 'injury_notes' in f ? f.injury_notes ?? null : cur.n,
      s: 'health_screen' in f ? f.health_screen ?? null : cur.s,
      c: 'injury_category' in f ? f.injury_category ?? null : cur.c,
      w: 'weight_goal' in f ? f.weight_goal ?? null : cur.w,
    });
  }
  async read(actor: string, target: string): Promise<HealthCipherRow | null> {
    if (actor !== target && this.coachOf.get(actor) !== target) throw new Error('forbidden');
    const r = this.rows.get(target), k = this.keys.get(target);
    if (!r || !k) return null;
    return { ...k, injury_notes_ct: r.n, health_screen_ct: r.s, injury_category_ct: r.c, weight_goal_ct: r.w };
  }
}

export function containsBytes(hay: Uint8Array, needle: Uint8Array): boolean {
  outer: for (let i = 0; i + needle.length <= hay.length; i++) {
    for (let j = 0; j < needle.length; j++) if (hay[i + j] !== needle[j]) continue outer;
    return true;
  }
  return false;
}
