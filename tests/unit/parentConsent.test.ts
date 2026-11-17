import test from 'node:test';
import assert from 'node:assert/strict';
import { HINT_PARENT_PRIVACY } from '../../src/legal/text.ts';
import {
  aiDisabled, canConfirm, confirmAiPrompt, confirmHint, consentsToRecord, initPc, setAi, setAttest, setCoach, setHealth, setRisk, setTerms,
} from '../../src/onboarding/parentConsent.ts';

test('starts with everything off and the hint showing', () => {
  const s = initPc();
  assert.equal(canConfirm(s), false);
  assert.equal(confirmHint(s), HINT_PARENT_PRIVACY);
  assert.deepEqual(consentsToRecord(s), []);
});

test('Confirm needs the attestation, the Terms checkbox, AND the parent risk checkbox', () => {
  assert.equal(canConfirm(setAttest(initPc(), true)), false);
  assert.equal(canConfirm(setRisk(initPc(), true)), false);
  assert.equal(canConfirm(setRisk(setAttest(initPc(), true), true)), false);
  const s = setRisk(setTerms(setAttest(initPc(), true), true), true);
  assert.equal(canConfirm(s), true);
  assert.equal(confirmHint(s), '');
  assert.equal(canConfirm(setAttest(s, false)), false);
  assert.equal(canConfirm(setTerms(s, false)), false);
});

test('the optional boxes never gate Confirm, in either direction', () => {
  let s = setCoach(setHealth(initPc(), true), true);
  assert.equal(canConfirm(s), false);
  s = setRisk(setTerms(setAttest(s, true), true), true);
  assert.equal(canConfirm(s), true);
  assert.equal(canConfirm(setRisk(setTerms(setAttest(initPc(), true), true), true)), true); // all optional off
});

test('AI box is disabled without health; tapping it explains, and only the explicit action turns health on', () => {
  let s = initPc();
  assert.equal(aiDisabled(s), true);
  s = setAi(s, true);
  assert.deepEqual([s.ai, s.health, s.aiPrompt], [false, false, true]);
  s = confirmAiPrompt(s);
  assert.deepEqual([s.ai, s.health, s.aiPrompt], [false, true, false]);
  assert.equal(aiDisabled(s), false);
  s = setAi(s, true);
  assert.equal(s.ai, true);
  assert.equal(setHealth(s, false).ai, false);
});

test('consents are recorded health first, then AI, then coach; only boxes that are on', () => {
  let s = setCoach(initPc(), true);
  assert.deepEqual(consentsToRecord(s), ['coach_sharing']);
  s = setAi(setHealth(s, true), true);
  assert.deepEqual(consentsToRecord(s), ['health_data', 'ai_vendor', 'coach_sharing']);
  assert.deepEqual(consentsToRecord({ ...initPc(), ai: true }), []); // AI without health is never recorded
});
