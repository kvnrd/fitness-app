import test from 'node:test';
import assert from 'node:assert/strict';
import { canUploadWeight, type KeyValueAdapter } from '../../src/onboarding/deviceSetupStore.ts';
import { canLeaveDevice, canSaveWeighInHistory, createWeightLocalStore, type WeighIn } from '../../src/progress/weightLocal.ts';

function mem(): KeyValueAdapter & { m: Map<string, string> } {
  const m = new Map<string, string>();
  return {
    m,
    getItem: async (k) => m.get(k) ?? null,
    setItem: async (k, v) => void m.set(k, v),
    removeItem: async (k) => void m.delete(k),
  };
}

const a: WeighIn = { recordedOn: '2026-11-10', value: 182.9, unit: 'lb' };
const b: WeighIn = { recordedOn: '2026-11-16', value: 83, unit: 'kg' };

test('no weigh-in is kept on the device as history while Health data is off', async () => {
  const weightStorage = mem();
  const store = createWeightLocalStore({ weightStorage });
  assert.equal(await store.saveWeighIn('u1', a, { healthOn: false }), 'ignored');
  assert.equal(weightStorage.m.size, 0);
  assert.deepEqual(await store.loadWeighIns('u1', { healthOn: false }), []);
  let calls = 0;
  assert.equal(await store.takeWeighInsForUpload('u1', { healthOn: false }, async () => (calls++, true)), 'none');
  assert.equal(calls, 0);
  assert.equal(canSaveWeighInHistory({ healthOn: false }), false);
  assert.equal(canLeaveDevice({ healthOn: false }), false);
  assert.equal(canUploadWeight({ healthOn: false }), false);
});

test('health on: weigh-ins are saved, then upload deletes the device copy', async () => {
  const store = createWeightLocalStore({ weightStorage: mem() });
  assert.equal(await store.saveWeighIn('u1', a, { healthOn: true }), 'saved');
  assert.equal(await store.saveWeighIn('u1', b, { healthOn: true }), 'saved');
  assert.deepEqual(await store.loadWeighIns('u1', { healthOn: true }), [a, b]);
  let sent: WeighIn[] | null = null;
  const r = await store.takeWeighInsForUpload('u1', { healthOn: true }, async (e) => ((sent = e), true));
  assert.equal(r, 'uploaded');
  assert.deepEqual(sent, [a, b]);
  assert.deepEqual(await store.loadWeighIns('u1', { healthOn: true }), []);
  assert.equal(canSaveWeighInHistory({ healthOn: true }), true);
});

test('health on but the upload fails or throws: the device copy is kept', async () => {
  const store = createWeightLocalStore({ weightStorage: mem() });
  await store.saveWeighIn('u1', a, { healthOn: true });
  assert.equal(await store.takeWeighInsForUpload('u1', { healthOn: true }, async () => false), 'failed');
  assert.deepEqual(await store.loadWeighIns('u1', { healthOn: true }), [a]);
  assert.equal(
    await store.takeWeighInsForUpload('u1', { healthOn: true }, async () => {
      throw new Error('network');
    }),
    'failed',
  );
  assert.deepEqual(await store.loadWeighIns('u1', { healthOn: true }), [a]);
});

test('saving the same day replaces the entry; nothing stored is none; clear removes it', async () => {
  const weightStorage = mem();
  const store = createWeightLocalStore({ weightStorage });
  assert.equal(await store.takeWeighInsForUpload('u1', { healthOn: true }, async () => true), 'none');
  await store.saveWeighIn('u1', a, { healthOn: true });
  await store.saveWeighIn('u1', { ...a, value: 180 }, { healthOn: true });
  const rows = await store.loadWeighIns('u1', { healthOn: true });
  assert.equal(rows.length, 1);
  assert.equal(rows[0]!.value, 180);
  await store.clearWeighIns('u1');
  assert.equal(weightStorage.m.size, 0);
});
