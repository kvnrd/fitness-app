import test from 'node:test';
import assert from 'node:assert/strict';
import { defaultDraft } from '../../src/onboarding/setupPayload.ts';
import { toggleStyle, EMPTY_SELECTION } from '../../src/onboarding/styles.ts';
import { applySkip, draftUploadPayload, firstStep, nextStep, prevStep, stepAllowed, stepPayload, stepsFor, STEP_NUMBER } from '../../src/onboarding/setupSteps.ts';
import { clampWeight, maxDisplay, parseWeight, projection, stepMaxLb, stepWeight } from '../../src/onboarding/weightGoal.ts';

test('step lists per mode; pending teens never see role or goal', () => {
  assert.deepEqual(stepsFor('adult'), ['role', 'goal', 'style', 'followups', 'equipment', 'prefs']);
  assert.deepEqual(stepsFor('minor-pending'), ['style', 'followups', 'equipment', 'prefs']);
  assert.equal(stepAllowed('minor-pending', 'goal'), false);
  assert.equal(stepAllowed('minor-pending', 'role'), false);
  assert.equal(firstStep('minor-linked'), 'goal');
  assert.deepEqual(stepsFor('minor-linked', { draftUploaded: true }), ['goal']);
  assert.equal(nextStep('minor-linked', 'goal', { draftUploaded: true }), null);
  assert.equal(nextStep('adult', 'followups'), 'equipment');
  assert.equal(prevStep('minor-pending', 'style'), null);
});

test('progress numbers: pending teens jump to 6; follow-ups share 6', () => {
  assert.equal(STEP_NUMBER[firstStep('minor-pending')], 6);
  assert.equal(STEP_NUMBER.followups, 6);
  assert.equal(STEP_NUMBER.goal, 5);
});

test('step payloads are partial and carry no body weights', () => {
  const d = defaultDraft();
  d.selection = toggleStyle(EMPTY_SELECTION, 'hybrid');
  const goal = stepPayload({ ...d, goal: 'lose', pace: 'fast' }, 'goal', false)!;
  assert.deepEqual(Object.keys(goal).sort(), ['goal', 'goal_pace']);
  assert.equal(goal.goal_pace, 'fast');
  assert.deepEqual(Object.keys(stepPayload(d, 'followups', false)!).sort(), ['days_per_week', 'followups', 'main_style', 'styles']);
  assert.deepEqual(Object.keys(stepPayload(d, 'equipment', false)!), ['gym']);
  assert.deepEqual(Object.keys(stepPayload(d, 'prefs', false)!).sort(), ['accent', 'distance', 'units']);
  assert.equal(stepPayload(d, 'role', false), null);
  for (const k of ['goal', 'style', 'equipment', 'prefs'] as const) assert.doesNotMatch(JSON.stringify(stepPayload(d, k === 'style' ? 'style' : k, false)), /current|target|weight/i);
});

test('minor goal payload: minor-safe id, never a pace; unpicked becomes general_fitness', () => {
  const p = stepPayload({ ...defaultDraft(), goal: 'lose', pace: 'fast' }, 'goal', true)!;
  assert.equal(p.goal, 'general_fitness');
  assert.equal(p.goal_pace, null);
  assert.equal(stepPayload({ ...defaultDraft(), goal: 'build_strength' }, 'goal', true)!.goal, 'build_strength');
});

test('draft upload for a linked teen is steps 6-8 only (no goal key)', () => {
  const p = draftUploadPayload(defaultDraft());
  assert.deepEqual(Object.keys(p).sort(), ['accent', 'days_per_week', 'distance', 'followups', 'gym', 'main_style', 'styles', 'units']);
});

test('kg wire conversion for gym maxes', () => {
  const d = defaultDraft();
  d.prefs.units = 'kg';
  const gym = stepPayload(d, 'equipment', false)!.gym!;
  assert.equal(gym.maxes?.barbell, 184); // 405 lb
  d.prefs.units = 'lb';
  assert.equal(stepPayload(d, 'equipment', false)!.gym!.maxes?.barbell, 405);
});

test('skip defaults', () => {
  const d = { ...defaultDraft(), goal: 'gain', pace: 'fast' as const };
  assert.equal(applySkip(d, 'goal', false).goal, null);
  assert.equal(applySkip(d, 'goal', true).goal, 'general_fitness');
  const s = applySkip(d, 'style', false);
  assert.deepEqual(s.selection, { styles: ['general'], main: 'general' });
  assert.equal(s.followups.daysPerWeek, 4);
  assert.equal(applySkip(d, 'equipment', false).gym.items.length, 31);
  assert.equal(applySkip({ ...d, prefs: { units: 'kg', distance: 'km', accent: 'volt' } }, 'prefs', false).prefs.accent, 'champagne');
});

test('weight helpers: parse, clamp, projection matches the Paper example', () => {
  assert.equal(parseWeight('186.4', 'lb'), 186.4);
  assert.equal(parseWeight('', 'lb'), null);
  assert.equal(parseWeight('5', 'lb'), null);
  assert.equal(clampWeight(2000, 'lb'), 800);
  assert.equal(stepWeight(178, -1, 'lb', 180), 177);
  const p = projection(186.4, 178, 'lb', 'steady', new Date('2026-11-15T00:00:00Z'))!;
  assert.equal(p.diff, -8.4);
  assert.equal(p.weeks, 34);
  assert.equal(projection(180, 180, 'lb', 'steady'), null);
  assert.equal(maxDisplay(405, 'kg'), 183.5);
  assert.equal(stepMaxLb(405, 1, 'lb'), 410);
});
