import assert from 'node:assert/strict';
import test from 'node:test';
import {
  CLEARANCE_ACK,
  HEALTH_QUESTION_COUNT,
  HEALTH_SCREEN_TITLE,
  allAnswered,
  anyYes,
  clearanceBody,
  emptyHealthAnswers,
  healthQuestions,
  parentClearanceAck,
  parentHealthScreenHint,
  parentHealthSwitchBody,
  serializeHealthScreen,
  setHealthAnswer,
} from '../../src/ai/healthScreen.ts';

test('seven plain-language questions; never labeled PAR-Q+', () => {
  const qs = healthQuestions();
  assert.equal(qs.length, HEALTH_QUESTION_COUNT);
  assert.equal(HEALTH_SCREEN_TITLE, 'Health screen');
  assert.ok(!qs.join(' ').toLowerCase().includes('par-q'));
  assert.ok(!HEALTH_SCREEN_TITLE.toLowerCase().includes('par-q'));
});

test('parent wording uses the teen first name and is about the teen', () => {
  const qs = healthQuestions('Alex');
  assert.equal(qs.length, 7);
  assert.ok(qs.every((q) => q.includes('Alex')));
  assert.ok(qs.every((q) => !/\byou\b/i.test(q) || q.includes('Alex')));
  assert.match(parentHealthScreenHint('Alex'), /before Alex starts an AI plan/);
  assert.equal(parentClearanceAck('Alex'), 'I confirm a doctor has cleared Alex to train.');
  assert.match(parentHealthSwitchBody('Alex'), /build one for Alex/);
  assert.match(clearanceBody('Alex'), /cleared Alex to train/);
  assert.equal(CLEARANCE_ACK, 'I confirm a doctor has cleared me to train.');
});

test('continue requires every question; any yes routes to clearance', () => {
  let a = emptyHealthAnswers();
  assert.equal(allAnswered(a), false);
  assert.equal(anyYes(a), false);
  for (let i = 0; i < 7; i++) a = setHealthAnswer(a, i, false);
  assert.equal(allAnswered(a), true);
  assert.equal(anyYes(a), false);
  a = setHealthAnswer(a, 5, true);
  assert.equal(anyYes(a), true);
  const payload = JSON.parse(serializeHealthScreen(a));
  assert.equal(payload.answers.length, 7);
  assert.equal(payload.answers[5], true);
  assert.equal(payload.answers[0], false);
  assert.throws(() => serializeHealthScreen(emptyHealthAnswers()));
});
