import test from 'node:test';
import assert from 'node:assert/strict';
import type { KeyValueAdapter } from '../../src/onboarding/deviceSetupStore.ts';
import { PARENT_CAN_EXPORT_TEEN_DATA, TEEN_WEIGHT_EXISTS, TEEN_WEIGHT_PROFILE_ONLY } from '../../src/progress/phase5Flags.ts';
import {
  canServeWeightCard,
  canServeWeightTrend,
  canStoreTeenCurrentWeight,
  createTeenWeightStore,
  overwriteTeenCurrentWeight,
  parentCanExportTeenData,
  parentCausedWeightDeletionNotice,
  parentExportedDataNotice,
  teenMayHaveWeightGoal,
  teenWeightCaption,
  teenWeightExists,
  turningHealthOffDeletesWeightCopy,
} from '../../src/progress/teenWeight.ts';

function mem(): KeyValueAdapter & { m: Map<string, string> } {
  const m = new Map<string, string>();
  return {
    m,
    getItem: async (k) => m.get(k) ?? null,
    setItem: async (k, v) => void m.set(k, v),
    removeItem: async (k) => void m.delete(k),
  };
}

const bothOn = { isMinor: true as const, healthOn: true, parentHealthOn: true };

test('Option 3: teens see weight, history and trends like adults when both health opt-ins are on', () => {
  assert.equal(canServeWeightTrend(true), true);
  assert.equal(canServeWeightCard('progress', true), true);
  assert.equal(canServeWeightCard('home', true), true);
  assert.equal(canServeWeightCard('profile', true), true);
  assert.equal(canServeWeightTrend(false), true);
  assert.equal(canServeWeightCard('progress', false), true);
  assert.equal(canServeWeightCard('home', false), true);
});

test('teen current weight still needs both health opt-ins', () => {
  assert.equal(canStoreTeenCurrentWeight({ isMinor: true, healthOn: true, parentHealthOn: true }), true);
  assert.equal(canStoreTeenCurrentWeight({ isMinor: true, healthOn: true, parentHealthOn: false }), false);
  assert.equal(canStoreTeenCurrentWeight({ isMinor: true, healthOn: false, parentHealthOn: true }), false);
  assert.equal(canStoreTeenCurrentWeight({ isMinor: false, healthOn: true, parentHealthOn: false }), true);
  assert.equal(canStoreTeenCurrentWeight({ isMinor: false, healthOn: false, parentHealthOn: false }), false);
});

test('Kevin flags: teen weight is not Profile-only; parent export stays off', () => {
  assert.equal(TEEN_WEIGHT_EXISTS, true);
  assert.equal(TEEN_WEIGHT_PROFILE_ONLY, false);
  assert.equal(teenWeightExists(), true);
  assert.equal(PARENT_CAN_EXPORT_TEEN_DATA, false);
  assert.equal(parentCanExportTeenData(), false);
});

test('the device current-weight store overwrites the previous value', async () => {
  const first = { value: 130, unit: 'lb' as const, updatedOn: '2026-11-01' };
  const second = { value: 128, unit: 'lb' as const, updatedOn: '2026-11-16' };
  assert.deepEqual(overwriteTeenCurrentWeight(first, second), second);
  const storage = mem();
  const store = createTeenWeightStore({ storage });
  assert.equal(await store.save('t1', first, bothOn), 'saved');
  assert.equal(await store.save('t1', second, bothOn), 'saved');
  assert.deepEqual(await store.load('t1', bothOn), second);
  assert.equal(storage.m.size, 1);
  assert.match(teenWeightCaption('2026-11-16'), /Updated 2026-11-16/);
});

test('if either opt-in turns off, the device copy is deleted immediately and later loads start empty', async () => {
  const store = createTeenWeightStore({ storage: mem() });
  const w = { value: 130, unit: 'lb' as const, updatedOn: '2026-11-16' };
  await store.save('t1', w, bothOn);
  assert.equal(await store.save('t1', w, { ...bothOn, parentHealthOn: false }), 'ignored');
  await store.deleteNow('t1');
  assert.equal(await store.load('t1', bothOn), null);
  assert.equal(await store.load('t1', { ...bothOn, healthOn: false }), null);
  assert.match(turningHealthOffDeletesWeightCopy('teen'), /your saved weight/);
  assert.match(turningHealthOffDeletesWeightCopy('parent', 'Alex'), /Alex's saved weight/);
  assert.match(parentCausedWeightDeletionNotice(), /parent/);
  assert.equal(parentExportedDataNotice(), 'Your parent downloaded a copy of your data.');
});
