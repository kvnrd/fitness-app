import test from 'node:test';
import assert from 'node:assert/strict';
import { canUploadWeight, createDeviceSetupStore, PENDING_DRAFT_TTL_MS, type KeyValueAdapter } from '../../src/onboarding/deviceSetupStore.ts';
import { defaultDraft } from '../../src/onboarding/setupPayload.ts';

const DAY = 24 * 60 * 60 * 1000;
function mem(): KeyValueAdapter & { m: Map<string, string> } {
  const m = new Map<string, string>();
  return { m, getItem: async (k) => m.get(k) ?? null, setItem: async (k, v) => void m.set(k, v), removeItem: async (k) => void m.delete(k) };
}
function make(t = { now: 1_000_000 }) {
  const draftStorage = mem();
  const weightStorage = mem();
  return { draftStorage, weightStorage, t, store: createDeviceSetupStore({ draftStorage, weightStorage, now: () => t.now }) };
}

test('draft round trip, keyed per user', async () => {
  const { store } = make();
  const d = defaultDraft();
  d.prefs.units = 'kg';
  await store.saveDraft('u1', d, { pendingMinor: true, accountCreatedAt: 1_000_000 });
  assert.equal((await store.loadDraft('u1'))?.draft.prefs.units, 'kg');
  assert.equal(await store.loadDraft('u2'), null);
});

test('createdAt is kept from the first save', async () => {
  const { store, t } = make();
  await store.saveDraft('u1', defaultDraft(), { pendingMinor: true, accountCreatedAt: 1_000_000 });
  t.now += 5 * DAY;
  await store.saveDraft('u1', defaultDraft(), { pendingMinor: true, accountCreatedAt: null });
  assert.equal((await store.loadDraft('u1'))?.createdAt, 1_000_000);
});

test('day-14 purge boundary (from account creation time)', async () => {
  const { store } = make();
  const created = 5_000_000;
  await store.saveDraft('u1', defaultDraft(), { pendingMinor: true, accountCreatedAt: created });
  assert.equal(await store.purgeExpired('u1', created + PENDING_DRAFT_TTL_MS - 1), false);
  assert.ok(await store.loadDraft('u1'));
  assert.equal(await store.purgeExpired('u1', created + PENDING_DRAFT_TTL_MS), true);
  assert.equal(await store.loadDraft('u1'), null);
});

test('purge uses the account creation time passed in, not the draft age', async () => {
  const { store } = make();
  await store.saveDraft('u1', defaultDraft(), { pendingMinor: true, accountCreatedAt: null });
  // draft saved at t=1_000_000, but the account is 20 days old
  assert.equal(await store.purgeExpired('u1', 1_000_000 + 20 * DAY, 1_000_000 + 20 * DAY - 14 * DAY - 1000), true);
});

test('purge never touches a non-pending (linked or adult) draft', async () => {
  const { store } = make();
  await store.saveDraft('u1', defaultDraft(), { pendingMinor: false, accountCreatedAt: 0 });
  assert.equal(await store.purgeExpired('u1', 100 * DAY), false);
  assert.ok(await store.loadDraft('u1'));
});

test('sign-out / deletion clears the draft and the weight goal for that user only', async () => {
  const { store, draftStorage, weightStorage } = make();
  await store.saveDraft('u1', defaultDraft(), { pendingMinor: true, accountCreatedAt: 0 });
  await store.saveWeightGoal('u1', { current: 200, target: 185, unit: 'lb', pace: 'moderate' });
  await store.saveDraft('u2', defaultDraft(), { pendingMinor: false, accountCreatedAt: 0 });
  await store.clearForUser('u1');
  assert.equal(await store.loadDraft('u1'), null);
  assert.equal(await store.loadWeightGoal('u1'), null);
  assert.ok(await store.loadDraft('u2'));
  assert.deepEqual([...weightStorage.m.keys()], []);
  assert.equal(draftStorage.m.size, 1);
});

test('upload deletes the device copy only when it resolves ok', async () => {
  const { store } = make();
  await store.saveDraft('u1', defaultDraft(), { pendingMinor: true, accountCreatedAt: 0 });
  assert.equal(await store.takeForUpload('u1', async () => false), false);
  assert.ok(await store.loadDraft('u1'));
  assert.equal(await store.takeForUpload('u1', async () => ({ ok: false })), false);
  assert.equal(await store.takeForUpload('u1', async () => { throw new Error('network'); }), false);
  assert.ok(await store.loadDraft('u1'));
  let seen = '';
  assert.equal(await store.takeForUpload('u1', async (d) => { seen = d.prefs.units; return true; }), true);
  assert.equal(seen, 'lb');
  assert.equal(await store.loadDraft('u1'), null);
  assert.equal(await store.takeForUpload('u1', async () => true), false); // nothing left
});

test('weight gate: upload only when health is on', async () => {
  assert.equal(canUploadWeight({ healthOn: false }), false);
  assert.equal(canUploadWeight({ healthOn: true }), true);
  const { store } = make();
  await store.saveWeightGoal('u1', { current: 200, target: 185, unit: 'lb', pace: 'steady' });
  let calls = 0;
  assert.equal(await store.takeWeightForUpload('u1', { healthOn: false }, async () => { calls++; return true; }), false);
  assert.equal(calls, 0);
  assert.deepEqual(await store.loadWeightGoal('u1'), { current: 200, target: 185, unit: 'lb', pace: 'steady' });
  assert.equal(await store.takeWeightForUpload('u1', { healthOn: true }, async () => ({ ok: false })), false);
  assert.ok(await store.loadWeightGoal('u1'));
  assert.equal(await store.takeWeightForUpload('u1', { healthOn: true }, async () => ({ ok: true })), true);
  assert.equal(await store.loadWeightGoal('u1'), null);
});

test('weight goal lives in the weight storage, never the draft storage; no token-like data', async () => {
  const { store, draftStorage, weightStorage } = make();
  await store.saveWeightGoal('u1', { current: 200, target: 185, unit: 'lb', pace: null });
  await store.saveDraft('u1', defaultDraft(), { pendingMinor: false, accountCreatedAt: null });
  assert.ok(![...draftStorage.m.values()].some((v) => v.includes('185')));
  assert.equal(weightStorage.m.size, 1);
  assert.ok(![...draftStorage.m.values(), ...weightStorage.m.values()].some((v) => /jwt|token|eyJ/i.test(v)));
});

test('corrupt stored values read as empty', async () => {
  const { store, draftStorage } = make();
  draftStorage.m.set('setup.draft.v1.u1', '{not json');
  assert.equal(await store.loadDraft('u1'), null);
  assert.equal(await store.purgeExpired('u1', 1e12), false);
});
