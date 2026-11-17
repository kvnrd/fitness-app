import assert from 'node:assert/strict';
import test from 'node:test';
import { aiNoticeVariant, healthScreenAiPaused, nextAiStep, showHomeWeight, showTeenProfileWeight, type AiPlanState } from '../../src/ai/flow.ts';
import { AI_PLAN_NOTICE, AI_PLAN_NOTICE_SHORT } from '../../src/ai/notice.ts';

const base = (): AiPlanState => ({
  isMinor: false,
  healthConsent: true,
  aiConsent: true,
  healthScreenStatus: 'ok',
  canAiPlan: true,
  planAccepted: false,
  firstSessionDone: false,
});

test('gates: health off, missing/due screen, clearance, AI consent, then quiz or ready', () => {
  assert.equal(nextAiStep({ ...base(), healthConsent: false }), 'health-switch');
  assert.equal(nextAiStep({ ...base(), healthScreenStatus: 'missing' }), 'health-screen');
  assert.equal(nextAiStep({ ...base(), healthScreenStatus: 'due' }), 'health-screen');
  assert.equal(nextAiStep({ ...base(), healthScreenStatus: 'clearance_needed' }), 'clearance');
  assert.equal(nextAiStep({ ...base(), aiConsent: false }), 'privacy');
  assert.equal(nextAiStep(base()), 'quiz');
  assert.equal(nextAiStep({ ...base(), planAccepted: true }), 'ready');
});

test('notice shrinks after the first session and never disappears; wording is fixed', () => {
  assert.equal(aiNoticeVariant({ planAccepted: false, firstSessionDone: false }), null);
  assert.equal(aiNoticeVariant({ planAccepted: true, firstSessionDone: false }), 'banner');
  assert.equal(aiNoticeVariant({ planAccepted: true, firstSessionDone: true }), 'footer');
  assert.equal(
    AI_PLAN_NOTICE,
    "Made with AI. It can be wrong, so check that it fits you. It isn't medical advice. Stop and see a professional if anything hurts.",
  );
  assert.equal(AI_PLAN_NOTICE_SHORT, 'Made with AI. It can be wrong. Not medical advice.');
});

test('teen Home hides weight; Profile weight needs both opt-ins and no target', () => {
  assert.equal(showHomeWeight(true), false);
  assert.equal(showHomeWeight(false), true);
  assert.equal(showTeenProfileWeight({ isMinor: true, healthSelf: true, healthParent: true, hasTarget: false }), true);
  assert.equal(showTeenProfileWeight({ isMinor: true, healthSelf: true, healthParent: false, hasTarget: false }), false);
  assert.equal(showTeenProfileWeight({ isMinor: true, healthSelf: true, healthParent: true, hasTarget: true }), false);
  assert.equal(showTeenProfileWeight({ isMinor: false, healthSelf: true, healthParent: true, hasTarget: false }), false);
});

test('a due health screen pauses AI; a missing screen or a consent re-ask does not use this flag', () => {
  assert.equal(healthScreenAiPaused({ healthScreenStatus: 'due' }), true);
  assert.equal(healthScreenAiPaused({ healthScreenStatus: 'ok' }), false);
  assert.equal(healthScreenAiPaused({ healthScreenStatus: 'missing' }), false);
  assert.equal(healthScreenAiPaused({ healthScreenStatus: 'clearance_needed' }), false);
});
