import test from 'node:test';
import assert from 'node:assert/strict';
import { HINT_PRIVACY } from '../../src/legal/text.ts';
import {
  aiLocked, canContinue, confirmHealthPrompt, continueHint, dismissHealthPrompt, healthLocked, initPs, setAi, setHealth, setRisk, submission,
} from '../../src/onboarding/privacySafety.ts';

test('everything starts off; Continue is disabled with the exact hint', () => {
  const s = initPs('adult');
  assert.deepEqual([s.health, s.ai, s.risk], [false, false, false]);
  assert.equal(canContinue(s), false);
  assert.equal(continueHint(s), HINT_PRIVACY);
  assert.equal(submission(s), null);
});

test('Continue is enabled ONLY by the risk checkbox; switches never affect it', () => {
  let s = initPs('adult');
  s = setHealth(s, true);
  assert.equal(canContinue(s), false);
  s = setAi(s, true);
  assert.equal(canContinue(s), false);
  s = setRisk(initPs('adult'), true);
  assert.equal(canContinue(s), true);
  assert.equal(continueHint(s), '');
  assert.deepEqual(submission(s), { health: false, ai: false }); // health + AI can stay off
  assert.equal(canContinue(setRisk(s, false)), false);
});

test('AI requires health: AI on with health off only opens the explanation, nothing turns on', () => {
  let s = setAi(initPs('adult'), true);
  assert.equal(s.ai, false);
  assert.equal(s.health, false);
  assert.equal(s.healthPrompt, true);
  s = dismissHealthPrompt(s);
  assert.equal(s.healthPrompt, false);
  assert.equal(s.health, false);
});

test('only the explicit action turns health on, and AI stays off', () => {
  let s = setAi(initPs('adult'), true);
  s = confirmHealthPrompt(s);
  assert.equal(s.health, true);
  assert.equal(s.ai, false);
  assert.equal(confirmHealthPrompt(initPs('adult')).health, false); // no prompt, no effect
  s = setAi(s, true);
  assert.equal(s.ai, true);
});

test('turning health off turns AI off', () => {
  let s = setAi(setHealth(initPs('adult'), true), true);
  assert.equal(s.ai, true);
  s = setHealth(s, false);
  assert.deepEqual([s.health, s.ai], [false, false]);
});

test('submission forces AI off whenever health is off', () => {
  const s = setRisk({ ...initPs('adult'), ai: true }, true); // impossible via the UI, defended anyway
  assert.deepEqual(submission(s), { health: false, ai: false });
  assert.deepEqual(submission(setRisk(setAi(setHealth(initPs('adult'), true), true), true)), { health: true, ai: true });
});

test('teen: both switches locked until the parent granted that scope', () => {
  let s = initPs('teen');
  assert.equal(healthLocked(s), true);
  assert.equal(aiLocked(s), true);
  assert.equal(setHealth(s, true).health, false);
  assert.equal(setAi(s, true).healthPrompt, false); // locked: no prompt either
  assert.equal(setAi(s, true).ai, false);
  s = setRisk(s, true); // the teen risk checkbox is still required and works
  assert.deepEqual(submission(s), { health: false, ai: false });
});

test('teen with a parent health grant can turn health on; AI still locked without its own grant', () => {
  let s = initPs('teen', { health: true, ai: false });
  s = setHealth(s, true);
  assert.equal(s.health, true);
  assert.equal(setAi(s, true).ai, false);
  s = initPs('teen', { health: true, ai: true });
  assert.equal(setAi(s, true).healthPrompt, true); // AI needs the teen's health first
  s = setAi(setHealth(s, true), true);
  assert.equal(s.ai, true);
  assert.equal(setHealth(s, false).ai, false);
});
