import test from 'node:test';
import assert from 'node:assert/strict';
import { weightSurfaceState } from '../../src/progress/weightGate.ts';
import {
  WEIGHT_GATE_PARENT_OFF,
  WEIGHT_GATE_TEEN_OFF,
  WEIGHT_GATE_TITLE,
  GOAL_DIRECTIONS,
  LOSE_FAT_TRAINING_GOAL,
  gatedWeightBody,
  healthPills,
} from '../../src/progress/teenWeightCopy.ts';
import { isSyncedWeightSource, INGEST_SYNCED_WEIGHT_RPC } from '../../src/wearables/ingestWeight.ts';

test('teens see weight and a goal only when both health opt-ins are on', () => {
  const open = weightSurfaceState({ isMinor: true, healthSelf: true, healthParent: true });
  assert.equal(open.kind, 'open');
  assert.equal(open.showValues, true);
  assert.equal(open.showGoal, true);
  assert.equal(open.showProfileBody, true);
});

test('gated states 02b, 02c, 20b, 25b and 26 show no goal and no weight value', () => {
  const teenOff = weightSurfaceState({ isMinor: true, healthSelf: false, healthParent: true });
  assert.equal(teenOff.kind, 'gated_teen_off');
  assert.equal(teenOff.showValues, false);
  assert.equal(teenOff.showGoal, false);
  assert.equal(teenOff.showProfileBody, false);
  assert.equal(gatedWeightBody('gated_teen_off'), WEIGHT_GATE_TEEN_OFF);

  const parentOff = weightSurfaceState({ isMinor: true, healthSelf: true, healthParent: false });
  assert.equal(parentOff.kind, 'gated_parent_off');
  assert.equal(parentOff.showValues, false);
  assert.equal(parentOff.showGoal, false);
  assert.equal(parentOff.showProfileBody, false);
  assert.equal(gatedWeightBody('gated_parent_off'), WEIGHT_GATE_PARENT_OFF);
  assert.equal(WEIGHT_GATE_PARENT_OFF, 'Your parent has Health data off, so weigh-ins aren’t saved or charted.');
  assert.equal(WEIGHT_GATE_PARENT_OFF.charCodeAt('Your parent has Health data off, so weigh-ins aren'.length), 0x2019);
  assert.equal(WEIGHT_GATE_TITLE, 'Weight charts use Health data');

  const bothOff = weightSurfaceState({ isMinor: true, healthSelf: false, healthParent: false });
  assert.equal(bothOff.showValues, false);
  assert.equal(bothOff.showGoal, false);
  assert.equal(bothOff.showProfileBody, false);
});

test('the weight goal sheet uses Lose / Maintain / Gain, not the Lose fat training goal', () => {
  assert.deepEqual(GOAL_DIRECTIONS, ['Lose', 'Maintain', 'Gain']);
  assert.equal((GOAL_DIRECTIONS as readonly string[]).includes(LOSE_FAT_TRAINING_GOAL), false);
});

test('health pills and wearable ingest use the shared server gate', () => {
  assert.deepEqual(healthPills(false, true), { you: 'You: Off', parent: 'Parent: On' });
  assert.deepEqual(healthPills(true, false), { you: 'You: On', parent: 'Parent: Off' });
  assert.equal(INGEST_SYNCED_WEIGHT_RPC, 'ingest_synced_weight');
  assert.equal(isSyncedWeightSource('garmin'), true);
  assert.equal(isSyncedWeightSource('apple_health'), true);
  assert.equal(isSyncedWeightSource('manual'), false);
});
