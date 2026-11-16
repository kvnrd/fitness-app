import test from 'node:test';
import assert from 'node:assert/strict';
import { buildSetupPayload, defaultDraft } from '../../src/onboarding/setupPayload.ts';
import { EQUIPMENT_ITEM_IDS, presetGym } from '../../src/onboarding/equipment.ts';
import { MINOR_GOAL_IDS, MINOR_GOALS } from '../../src/onboarding/goals.ts';
import { toggleStyle, EMPTY_SELECTION } from '../../src/onboarding/styles.ts';

const WEIGHT_KEYS = /weight_?(goal|current|target)|current_?weight|target_?weight|body_?weight|^current$|^target$/i;
function keysDeep(o: unknown, out: string[] = []): string[] {
  if (o && typeof o === 'object') for (const [k, v] of Object.entries(o)) { out.push(k); keysDeep(v, out); }
  return out;
}

test('equipment ids are exactly the 31 specified', () => {
  assert.equal(EQUIPMENT_ITEM_IDS.length, 31);
  assert.equal(new Set(EQUIPMENT_ITEM_IDS).size, 31);
  assert.equal(presetGym('full').items.length, 31);
  assert.deepEqual(presetGym('bodyweight').items, []);
});

test('default (skip) draft: general fitness, 4 days, full gym, lb, champagne', () => {
  const p = buildSetupPayload(defaultDraft(), { minor: false });
  assert.equal(p.goal, null);
  assert.equal(p.goal_pace, null);
  assert.deepEqual(p.styles, ['general']);
  assert.equal(p.main_style, 'general');
  assert.equal(p.days_per_week, 4);
  assert.deepEqual(p.followups, {});
  assert.equal(p.gym.items.length, 31);
  assert.equal(p.units, 'lb');
  assert.equal(p.distance, 'mi');
  assert.equal(p.accent, 'champagne');
});

test('never any body-weight keys, even if the draft object carries extras', () => {
  const d = { ...defaultDraft(), goal: 'lose', pace: 'fast', current: 200, target: 180, weight: { current: 200 } } as never;
  const p = buildSetupPayload(d, { minor: false });
  const keys = keysDeep(p);
  assert.ok(!keys.some((k) => WEIGHT_KEYS.test(k)), keys.join());
  assert.deepEqual(Object.keys(p).sort(), ['accent', 'days_per_week', 'distance', 'followups', 'goal', 'goal_pace', 'gym', 'main_style', 'styles', 'units'].sort());
  assert.ok(!JSON.stringify(p).includes('200'));
});

test('adult: lose/gain carry a pace, maintain does not, unknown goal is null', () => {
  const d = defaultDraft();
  assert.deepEqual([buildSetupPayload({ ...d, goal: 'lose', pace: 'fast' }, { minor: false }).goal, buildSetupPayload({ ...d, goal: 'lose', pace: 'fast' }, { minor: false }).goal_pace], ['lose', 'fast']);
  assert.equal(buildSetupPayload({ ...d, goal: 'gain', pace: null }, { minor: false }).goal_pace, 'moderate');
  assert.equal(buildSetupPayload({ ...d, goal: 'maintain', pace: 'fast' }, { minor: false }).goal_pace, null);
  assert.equal(buildSetupPayload({ ...d, goal: 'build_strength' }, { minor: false }).goal, null);
});

test('minor: only minor-safe goals, never a pace', () => {
  const d = defaultDraft();
  for (const bad of ['lose', 'gain', 'maintain', 'cut', null, '']) {
    const p = buildSetupPayload({ ...d, goal: bad, pace: 'fast' }, { minor: true });
    assert.equal(p.goal, 'general_fitness');
    assert.equal(p.goal_pace, null);
  }
  for (const id of MINOR_GOAL_IDS) assert.equal(buildSetupPayload({ ...d, goal: id, pace: 'fast' }, { minor: true }).goal, id);
  assert.equal(MINOR_GOALS.length, 6);
  const text = JSON.stringify(MINOR_GOALS).toLowerCase();
  assert.ok(!/calorie|lose|weight loss|body-fat/.test(text.replace("without a weight target", '').replace("not a weight class cut", '')));
});

test('followups only for picked styles; focus defaults to balanced; maxes trimmed', () => {
  let sel = toggleStyle(EMPTY_SELECTION, 'powerlifting');
  sel = toggleStyle(sel, 'bodybuilding');
  const d = defaultDraft();
  d.selection = sel;
  d.followups = { ...d.followups, powerMaxes: { squat: 315, bench: null, deadlift: 405.4 } };
  const p = buildSetupPayload(d, { minor: false });
  assert.deepEqual(Object.keys(p.followups).sort(), ['bodybuilding', 'powerlifting']);
  assert.deepEqual(p.followups.bodybuilding, { focus: ['balanced'] });
  assert.deepEqual(p.followups.powerlifting, { compete: false, maxes: { squat: 315, deadlift: 405 } });
  assert.equal(p.main_style, 'powerlifting');
});

test('gym: name cleaned and capped; caps only for owned equipment', () => {
  const d = defaultDraft();
  d.gym = { ...presetGym('home', '  ' + 'x'.repeat(60) + '  '), maxes: { barbell: 225, dumbbells: 50, kettlebells: 35 } };
  d.gym.items = d.gym.items.filter((i) => i !== 'kettlebells');
  const p = buildSetupPayload(d, { minor: true });
  assert.equal(p.gym.name.length, 40);
  assert.deepEqual(p.gym.maxes, { barbell: 225, dumbbells: 50 });
  assert.equal(buildSetupPayload({ ...d, gym: presetGym('bodyweight', '') }, { minor: false }).gym.name, 'Main gym');
});

test('custom accent hex is normalised, junk falls back to champagne', () => {
  const d = defaultDraft();
  assert.equal(buildSetupPayload({ ...d, prefs: { ...d.prefs, accent: '#abcdef' } }, { minor: false }).accent, '#ABCDEF');
  assert.equal(buildSetupPayload({ ...d, prefs: { ...d.prefs, accent: 'javascript:1' } }, { minor: false }).accent, 'champagne');
  assert.equal(buildSetupPayload({ ...d, prefs: { ...d.prefs, accent: 'hot_red' } }, { minor: false }).accent, 'hot_red');
});
