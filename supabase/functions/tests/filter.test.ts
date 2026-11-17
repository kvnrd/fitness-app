import assert from 'node:assert/strict';
import { test } from 'node:test';
import { filterText } from '../_shared/ai/filter.ts';

const adult = { minor: false };
const minor = { minor: true };

test('filter: eating-disorder and compensatory-exercise content is blocked', () => {
  for (const s of [
    'Add 30 minutes of cardio to burn off what you ate',
    'Skip breakfast on training days',
    'Try fasted cardio every morning',
    'Earn your dinner with burpees',
    'Stay at 1200 calories a day',
    'Use a laxative before weigh-in',
    'Purge if you overeat',
    'Compensate for the cheat meal tomorrow',
    'Thinspo motivation',
    'Very low-calorie diet works best',
  ]) {
    assert.deepEqual(filterText(s, adult), { ok: false, category: 'eating_disorder' }, s);
  }
});

test('filter: body-shaming and body-ideal content is blocked', () => {
  for (const s of ['Get rid of that belly', 'Lose the muffin top', 'Work toward a bikini body', 'Your ideal body weight', 'You are too fat', 'Target your love handles']) {
    const r = filterText(s, adult);
    assert.ok(!r.ok && (r.category === 'body_shaming' || r.category === 'eating_disorder'), s);
  }
});

test('filter: medical treatment / rehab content is blocked (injury category may only avoid or swap)', () => {
  for (const s of ['This rehab protocol will fix your knee', 'Take ibuprofen before training', 'This will heal your shoulder', 'A treatment plan for your back', 'We diagnose this as tendinitis']) {
    assert.deepEqual(filterText(s, adult), { ok: false, category: 'medical_treatment' }, s);
  }
});

test('filter: 16-17 get no weight-loss or calorie content at all', () => {
  for (const s of ['Great for fat loss', 'Burns about 300 calories', 'Keep a small deficit', 'Lose weight safely', 'Weigh yourself weekly', 'Lean out for summer']) {
    assert.equal(filterText(s, minor).ok, false, s);
  }
  assert.equal(filterText('Burns about 300 calories', adult).ok, true);
});

test('filter: normal training language passes', () => {
  for (const s of ['Goblet squat 3x10 at RPE 7', 'Swap jump squats for box squats to go easy on the knee', 'Rest 90 seconds between sets', 'Brisk walk, conversational pace', 'Focus on form and control']) {
    assert.deepEqual(filterText(s, minor), { ok: true }, s);
  }
});

test('filter: 16-17 get no bulking, size or weight targets, surplus, or supplements', () => {
  for (const s of [
    'A 12-week bulking block',
    'Eat in a surplus to grow',
    'Take creatine and a pre-workout',
    'Add a whey protein shake',
    'Put on size in your upper body',
    'A weight target of 180 lb',
  ]) {
    assert.deepEqual(filterText(s, minor), { ok: false, category: 'minor_restricted' }, s);
  }
  // Adults may see surplus / supplements; "Build muscle" as strength still passes for teens.
  assert.equal(filterText('Take creatine daily', adult).ok, true);
  assert.equal(filterText('Build muscle with goblet squats and rows', minor).ok, true);
});
