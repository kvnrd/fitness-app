import test from 'node:test';
import assert from 'node:assert/strict';
import {
  canContinueStyles, defaultFollowups, EMPTY_SELECTION, followupSections, setMain, skipSelection, toggleFocus, toggleStyle, clampDays,
} from '../../src/onboarding/styles.ts';

test('first pick is Main', () => {
  const s = toggleStyle(EMPTY_SELECTION, 'hyrox');
  assert.deepEqual(s, { styles: ['hyrox'], main: 'hyrox' });
});

test('later picks do not steal Main; list stays in list order', () => {
  let s = toggleStyle(EMPTY_SELECTION, 'bodybuilding');
  s = toggleStyle(s, 'hybrid');
  assert.deepEqual(s.styles, ['hybrid', 'bodybuilding']);
  assert.equal(s.main, 'bodybuilding');
});

test('set as main', () => {
  let s = toggleStyle(toggleStyle(EMPTY_SELECTION, 'hybrid'), 'hyrox');
  s = setMain(s, 'hyrox');
  assert.equal(s.main, 'hyrox');
  assert.equal(setMain(s, 'crossfit'), s); // not selected: ignored
});

test('unselecting Main moves Main to the first remaining in list order', () => {
  let s = toggleStyle(EMPTY_SELECTION, 'crossfit'); // Main
  s = toggleStyle(s, 'hyrox');
  s = toggleStyle(s, 'hybrid');
  s = toggleStyle(s, 'crossfit');
  assert.deepEqual(s, { styles: ['hybrid', 'hyrox'], main: 'hybrid' });
});

test('unselecting a non-Main keeps Main; unselecting the last clears it', () => {
  let s = toggleStyle(toggleStyle(EMPTY_SELECTION, 'hybrid'), 'hyrox');
  s = toggleStyle(s, 'hyrox');
  assert.deepEqual(s, { styles: ['hybrid'], main: 'hybrid' });
  s = toggleStyle(s, 'hybrid');
  assert.deepEqual(s, EMPTY_SELECTION);
  assert.equal(canContinueStyles(s), false);
});

test('skip = general fitness as Main; follow-up defaults', () => {
  assert.deepEqual(skipSelection(), { styles: ['general'], main: 'general' });
  const f = defaultFollowups();
  assert.equal(f.daysPerWeek, 4);
  assert.equal(f.hybridRunPct, 50);
  assert.equal(f.hyroxDivision, 'open');
  assert.equal(f.hyroxRaceDate, null);
  assert.deepEqual(f.bodyFocus, []);
  assert.equal(f.powerCompete, false);
  assert.equal(f.crossfitLevel, 'intermediate');
});

test('follow-up sections exclude general; focus toggles; days clamp', () => {
  assert.deepEqual(followupSections({ styles: ['hybrid', 'general'], main: 'hybrid' }), ['hybrid']);
  assert.deepEqual(toggleFocus(toggleFocus([], 'legs'), 'chest'), ['chest', 'legs']);
  assert.deepEqual(toggleFocus(['legs'], 'legs'), []);
  assert.equal(clampDays(1), 2);
  assert.equal(clampDays(9), 7);
  assert.equal(clampDays(NaN), 4);
});
