import { LocalDevKeyProvider } from '../_shared/crypto/localDev.ts';
import type { HealthCipherRow, HealthCipherWrite, HealthDb, WrappedKeyRow } from '../_shared/health/handler.ts';

export const ALICE = '11111111-1111-4111-8111-111111111111';
export const BOB = '22222222-2222-4222-8222-222222222222';

export function devProvider(): LocalDevKeyProvider {
  return new LocalDevKeyProvider(crypto.getRandomValues(new Uint8Array(32)), 'test');
}

type Row = { n: Uint8Array | null; s: Uint8Array | null; c: Uint8Array | null; w: Uint8Array | null; bw: Uint8Array | null };

/** In-memory stand-in for the service-only SQL API. Stores exactly what Postgres would: bytes. */
export class FakeHealthDb implements HealthDb {
  keys = new Map<string, WrappedKeyRow>();
  rows = new Map<string, Row>();
  minors = new Set<string>();
  /** Mirrors app.teen_no_goal_weight_or_loss_advice(); Kevin: off. */
  teenNoGoalWeight = false;
  allowed = new Set<string>();
  coachOf = new Map<string, string>(); // coach -> client
  parentOf = new Map<string, string>(); // parent -> minor
  subjectOf(actor: string, target?: string | null): string {
    return target ?? actor;
  }
  canWrite(actor: string, subject: string): boolean {
    if (!this.allowed.has(subject)) return false;
    return actor === subject || this.parentOf.get(actor) === subject;
  }
  async prepareWrite(actor: string, target?: string | null) {
    const subject = this.subjectOf(actor, target);
    if (!this.canWrite(actor, subject)) throw new Error('consent_required (SQLSTATE 42501) detail that must not leak');
    return this.keys.get(subject) ?? null;
  }
  async registerKey(actor: string, row: WrappedKeyRow, target?: string | null) {
    const subject = this.subjectOf(actor, target);
    if (!this.keys.has(subject)) this.keys.set(subject, row);
    return this.keys.get(subject)!;
  }
  async write(actor: string, f: HealthCipherWrite, target?: string | null) {
    const subject = this.subjectOf(actor, target);
    if (!this.keys.has(subject)) throw new Error('no_data_key');
    if (this.minors.has(subject) && f.weight_goal && this.teenNoGoalWeight) throw new Error('forbidden (SQLSTATE 42501) detail that must not leak');
    const cur = this.rows.get(subject) ?? { n: null, s: null, c: null, w: null, bw: null };
    // Same semantics as public.health_write: absent key keeps, null clears.
    this.rows.set(subject, {
      n: 'injury_notes' in f ? f.injury_notes ?? null : cur.n,
      s: 'health_screen' in f ? f.health_screen ?? null : cur.s,
      c: 'injury_category' in f ? f.injury_category ?? null : cur.c,
      w: 'weight_goal' in f ? f.weight_goal ?? null : cur.w,
      bw: 'body_weight' in f ? f.body_weight ?? null : cur.bw,
    });
  }
  async read(actor: string, target: string): Promise<HealthCipherRow | null> {
    const isSelf = actor === target;
    const isCoach = this.coachOf.get(actor) === target;
    const isParent = this.parentOf.get(actor) === target;
    if (!isSelf && !isCoach && !isParent) throw new Error('forbidden');
    const r = this.rows.get(target), k = this.keys.get(target);
    if (!r || !k) return null;
    // Counsel #6 / #5: coaches never receive health-screen answers or body-weight fields.
    return {
      ...k,
      injury_notes_ct: r.n,
      health_screen_ct: isCoach ? null : r.s,
      injury_category_ct: r.c,
      weight_goal_ct: isCoach ? null : r.w,
      body_weight_ct: isCoach ? null : r.bw,
    };
  }
}

export function containsBytes(hay: Uint8Array, needle: Uint8Array): boolean {
  outer: for (let i = 0; i + needle.length <= hay.length; i++) {
    for (let j = 0; j < needle.length; j++) if (hay[i + j] !== needle[j]) continue outer;
    return true;
  }
  return false;
}
