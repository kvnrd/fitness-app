import test from 'node:test';
import assert from 'node:assert/strict';
import { createDeviceSetupStore, type KeyValueAdapter, type WeightGoal } from '../../src/onboarding/deviceSetupStore.ts';
import { uploadWeightAfterPrivacy } from '../../src/onboarding/weightUpload.ts';

function mem(): KeyValueAdapter & { m: Map<string, string> } {
  const m = new Map<string, string>();
  return { m, getItem: async (k) => m.get(k) ?? null, setItem: async (k, v) => void m.set(k, v), removeItem: async (k) => void m.delete(k) };
}
const goal: WeightGoal = { current: 186.4, target: 178, unit: 'lb', pace: 'steady' };
function make() {
  const draftStorage = mem();
  const weightStorage = mem();
  return { weightStorage, store: createDeviceSetupStore({ draftStorage, weightStorage }) };
}

test('health off: nothing is uploaded and the device copy stays', async () => {
  const { store } = make();
  await store.saveWeightGoal('u1', goal);
  let calls = 0;
  const r = await uploadWeightAfterPrivacy(store, 'u1', { healthOn: false, isMinor: false }, async () => (calls++, true));
  assert.equal(r, 'kept');
  assert.equal(calls, 0);
  assert.deepEqual(await store.loadWeightGoal('u1'), goal);
});

test('health on: uploaded, then the device copy is deleted', async () => {
  const { store } = make();
  await store.saveWeightGoal('u1', goal);
  let sent: WeightGoal | null = null;
  const r = await uploadWeightAfterPrivacy(store, 'u1', { healthOn: true, isMinor: false }, async (g) => ((sent = g), true));
  assert.equal(r, 'uploaded');
  assert.deepEqual(sent, goal);
  assert.equal(await store.loadWeightGoal('u1'), null);
});

test('health on but the upload fails or throws: the device copy is kept', async () => {
  const { store } = make();
  await store.saveWeightGoal('u1', goal);
  assert.equal(await uploadWeightAfterPrivacy(store, 'u1', { healthOn: true, isMinor: false }, async () => false), 'failed');
  assert.deepEqual(await store.loadWeightGoal('u1'), goal);
  assert.equal(
    await uploadWeightAfterPrivacy(store, 'u1', { healthOn: true, isMinor: false }, async () => {
      throw new Error('network');
    }),
    'failed',
  );
  assert.deepEqual(await store.loadWeightGoal('u1'), goal);
});

test('no stored weight: none. A minor never uploads a weight, even with health on', async () => {
  const { store } = make();
  assert.equal(await uploadWeightAfterPrivacy(store, 'u1', { healthOn: true, isMinor: false }, async () => true), 'none');
  await store.saveWeightGoal('u1', goal);
  assert.equal(await uploadWeightAfterPrivacy(store, 'u1', { healthOn: true, isMinor: true }, async () => true), 'kept');
  assert.deepEqual(await store.loadWeightGoal('u1'), goal);
});

test('the explicit delete control removes it', async () => {
  const { store, weightStorage } = make();
  await store.saveWeightGoal('u1', goal);
  await store.clearWeightGoal('u1');
  assert.equal(weightStorage.m.size, 0);
});
