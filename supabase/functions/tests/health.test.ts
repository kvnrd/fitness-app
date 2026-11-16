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
  assert.deepEqual(r.body, { record: { injury_notes: 'left knee hurts on stairs', health_screen: 'PAR-Q: no', injury_category: 'knee' } });
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
