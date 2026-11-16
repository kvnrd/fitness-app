import assert from 'node:assert/strict';
import { test } from 'node:test';
import { utf8 } from '../_shared/bytes.ts';
import { handleHealthRead, handleHealthWrite } from '../_shared/health/handler.ts';
import { ALICE, BOB, containsBytes, devProvider, FakeHealthDb } from './helpers.ts';

function setup() {
  const db = new FakeHealthDb();
  db.allowed.add(ALICE);
  const deps = { db, providers: { 'local-dev': devProvider() }, activeProviderId: 'local-dev' };
  return { db, deps };
}

test('health: write then read round trip; the database only ever holds ciphertext + a wrapped key', async () => {
  const { db, deps } = setup();
  const w = await handleHealthWrite(deps, ALICE, { injury_notes: 'left knee hurts on stairs', health_screen: 'PAR-Q: no', injury_category: 'knee' });
  assert.deepEqual(w, { status: 200, body: { saved: true } });
  const stored = db.rows.get(ALICE)!;
  for (const ct of [stored.n!, stored.s!, stored.c!]) {
    assert.ok(!containsBytes(ct, utf8('knee')) && !containsBytes(ct, utf8('PAR-Q')));
  }
  assert.equal(db.keys.get(ALICE)!.key_provider, 'local-dev');
  const r = await handleHealthRead(deps, ALICE, undefined);
  assert.deepEqual(r.body, { record: { injury_notes: 'left knee hurts on stairs', health_screen: 'PAR-Q: no', injury_category: 'knee', weight_goal: null } });
});

test('health: second write reuses the same data key (one key per user)', async () => {
  const { db, deps } = setup();
  await handleHealthWrite(deps, ALICE, { injury_notes: 'a' });
  const first = db.keys.get(ALICE)!.wrapped_key;
  await handleHealthWrite(deps, ALICE, { injury_notes: 'b' });
  assert.deepEqual(db.keys.get(ALICE)!.wrapped_key, first);
  assert.equal((await handleHealthRead(deps, ALICE, ALICE)).body.record && ((await handleHealthRead(deps, ALICE, ALICE)).body.record as { injury_notes: string }).injury_notes, 'b');
});

test('health: a lost key-registration race uses the stored key', async () => {
  const { db, deps } = setup();
  const winner = await deps.providers['local-dev'].generateDataKey({ userId: ALICE });
  db.registerKey = async () => ({ wrapped_key: winner.wrapped, key_provider: 'local-dev', kms_key_ref: winner.keyRef });
  db.keys.set(ALICE, { wrapped_key: winner.wrapped, key_provider: 'local-dev', kms_key_ref: winner.keyRef });
  db.prepareWrite = async () => null; // simulate: no key seen at step 1
  await handleHealthWrite(deps, ALICE, { injury_notes: 'race' });
  db.prepareWrite = FakeHealthDb.prototype.prepareWrite.bind(db);
  assert.equal(((await handleHealthRead(deps, ALICE, ALICE)).body.record as { injury_notes: string }).injury_notes, 'race');
});

test('health: input is validated strictly', async () => {
  const { deps } = setup();
  assert.equal((await handleHealthWrite(deps, ALICE, { injury_category: 'torn ACL from skiing' })).status, 400);
  assert.equal((await handleHealthWrite(deps, ALICE, { injury_notes: 'x', email: 'a@b.c' })).status, 400);
  assert.equal((await handleHealthWrite(deps, ALICE, { injury_notes: 'x'.repeat(2001) })).status, 400);
  assert.equal((await handleHealthWrite(deps, ALICE, null)).status, 400);
  assert.equal((await handleHealthRead(deps, ALICE, "1' or '1'='1")).status, 400);
});

test('health: database refusals become generic errors (no SQL detail leaks)', async () => {
  const { deps } = setup();
  const r = await handleHealthWrite(deps, BOB, { injury_notes: 'x' });
  assert.deepEqual(r, { status: 403, body: { error: 'consent_required' } });
  const r2 = await handleHealthRead(deps, BOB, ALICE);
  assert.deepEqual(r2, { status: 403, body: { error: 'forbidden' } });
});

test('health: an authorized coach read decrypts with the client id as AAD', async () => {
  const { db, deps } = setup();
  await handleHealthWrite(deps, ALICE, { injury_notes: 'n' });
  db.coachOf.set(BOB, ALICE);
  assert.equal(((await handleHealthRead(deps, BOB, ALICE)).body.record as { injury_notes: string }).injury_notes, 'n');
});

test('health: a row wrapped by a provider that is not configured cannot be opened', async () => {
  const { db, deps } = setup();
  await handleHealthWrite(deps, ALICE, { injury_notes: 'n' });
  db.keys.get(ALICE)!.key_provider = 'aws-kms';
  assert.equal((await handleHealthRead(deps, ALICE, ALICE)).status, 500);
});

const WG = (o: Record<string, unknown> = {}) => JSON.stringify({ current: 180, target: 170, unit: 'lb', pace: 'steady', ...o });

test('health: weight_goal round trip is encrypted, canonical, and own-record only', async () => {
  const { db, deps } = setup();
  const w = await handleHealthWrite(deps, ALICE, { weight_goal: WG() });
  assert.deepEqual(w, { status: 200, body: { saved: true } });
  assert.ok(!containsBytes(db.rows.get(ALICE)!.w!, utf8('180')) && !containsBytes(db.rows.get(ALICE)!.w!, utf8('steady')));
  const r = await handleHealthRead(deps, ALICE, undefined);
  assert.equal((r.body.record as { weight_goal: string }).weight_goal, WG());
  db.coachOf.set(BOB, ALICE);
  const c = (await handleHealthRead(deps, BOB, ALICE)).body.record as Record<string, unknown>;
  assert.ok(!('weight_goal' in c));
});

test('health: weight_goal validation is strict', async () => {
  const { deps } = setup();
  const bad: unknown[] = [
    WG({ current: 39 }), WG({ target: 1501 }), WG({ unit: 'st' }), WG({ pace: 'turbo' }), WG({ extra: 1 }),
    WG({ current: '180' }), '{not json', '[]', 'null', JSON.stringify({ current: 1e999 }), WG({ pace: 'x'.repeat(250) }), 180, { current: 180 },
  ];
  for (const b of bad) assert.equal((await handleHealthWrite(deps, ALICE, { weight_goal: b })).status, 400, String(b));
  for (const ok of [WG({ current: null, target: null, pace: null }), WG({ current: 40, target: 1500, unit: 'kg', pace: 'fast' }), JSON.stringify({ unit: 'kg' })]) {
    assert.equal((await handleHealthWrite(deps, ALICE, { weight_goal: ok })).status, 200, ok);
  }
});

test('health: omitted fields keep their stored value; explicit null clears', async () => {
  const { deps } = setup();
  await handleHealthWrite(deps, ALICE, { injury_notes: 'n1', injury_category: 'knee', weight_goal: WG() });
  await handleHealthWrite(deps, ALICE, { health_screen: 's1' });
  let rec = (await handleHealthRead(deps, ALICE, undefined)).body.record as Record<string, unknown>;
  assert.deepEqual([rec.injury_notes, rec.injury_category, rec.health_screen, rec.weight_goal], ['n1', 'knee', 's1', WG()]);
  await handleHealthWrite(deps, ALICE, { weight_goal: null, injury_notes: null });
  rec = (await handleHealthRead(deps, ALICE, undefined)).body.record as Record<string, unknown>;
  assert.deepEqual([rec.injury_notes, rec.injury_category, rec.health_screen, rec.weight_goal], [null, 'knee', 's1', null]);
});

test('health: weight_goal refused for a 16-17 account with the generic error; clearing is fine', async () => {
  const { db, deps } = setup();
  db.minors.add(ALICE);
  assert.deepEqual(await handleHealthWrite(deps, ALICE, { weight_goal: WG() }), { status: 403, body: { error: 'forbidden' } });
  assert.equal((await handleHealthWrite(deps, ALICE, { weight_goal: null, injury_notes: 'ok' })).status, 200);
});

test('health: weight_goal ciphertext is bound to its field (AAD)', async () => {
  const { db, deps } = setup();
  await handleHealthWrite(deps, ALICE, { weight_goal: WG(), injury_notes: 'x' });
  const r = db.rows.get(ALICE)!;
  r.n = r.w; // move the weight ciphertext into the notes column
  assert.equal((await handleHealthRead(deps, ALICE, undefined)).status, 500);
});
