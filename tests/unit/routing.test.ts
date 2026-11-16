import test from 'node:test';
import assert from 'node:assert/strict';
import type { OnboardingState } from '../../src/onboarding/api.ts';
import { inviteNeedsResend, inviteStatusText, nextOnboardingRoute, parentRiskMissing, shouldUploadDraft, workoutsLocked } from '../../src/onboarding/routing.ts';

const base: OnboardingState = { is_minor: false, linked: false, invite_status: null, setup_done: false, privacy_done: false, can_train: false, parent_risk_done: null, health_reask_due: false };
const s = (o: Partial<OnboardingState>): OnboardingState => ({ ...base, ...o });
const none = { hasDeviceDraft: false, goalDone: false };

test('unreadable state fails closed', () => assert.equal(nextOnboardingRoute(null, none), 'retry'));

test('pending teen always waits, whatever else is true', () => {
  assert.equal(nextOnboardingRoute(s({ is_minor: true, invite_status: 'sent' }), none), 'waiting');
  assert.equal(nextOnboardingRoute(s({ is_minor: true, setup_done: true, privacy_done: true }), { hasDeviceDraft: true, goalDone: true }), 'waiting');
});

test('linked teen with a device draft uploads it first', () => {
  const st = s({ is_minor: true, linked: true });
  assert.equal(nextOnboardingRoute(st, { hasDeviceDraft: true, goalDone: false }), 'upload-draft');
  assert.equal(shouldUploadDraft(st, true), true);
  assert.equal(shouldUploadDraft(s({ is_minor: true }), true), false); // pending: never
  assert.equal(shouldUploadDraft(st, false), false);
  assert.equal(shouldUploadDraft(s({ linked: true }), true), false); // adults have no pending draft
});

test('after the upload setup is done on the server, but Goal (5 of 8) still comes before Privacy & safety', () => {
  const st = s({ is_minor: true, linked: true, setup_done: true });
  assert.equal(nextOnboardingRoute(st, { hasDeviceDraft: false, goalDone: false }), 'goal');
  assert.equal(nextOnboardingRoute(st, { hasDeviceDraft: false, goalDone: true }), 'privacy');
});

test('linked teen without a draft: goal, then steps 6-8, then privacy', () => {
  const st = s({ is_minor: true, linked: true });
  assert.equal(nextOnboardingRoute(st, none), 'goal');
  assert.equal(nextOnboardingRoute(st, { hasDeviceDraft: false, goalDone: true }), 'setup');
  assert.equal(nextOnboardingRoute({ ...st, setup_done: true }, { hasDeviceDraft: false, goalDone: true }), 'privacy');
  assert.equal(nextOnboardingRoute({ ...st, setup_done: true, privacy_done: true, can_train: true }, { hasDeviceDraft: false, goalDone: true }), 'app');
});

test('adults: setup, privacy, app (a stray goal marker does nothing)', () => {
  assert.equal(nextOnboardingRoute(s({}), none), 'setup');
  assert.equal(nextOnboardingRoute(s({ setup_done: true }), none), 'privacy');
  assert.equal(nextOnboardingRoute(s({ setup_done: true, privacy_done: true }), none), 'app');
});

test('invite status helpers', () => {
  assert.equal(inviteNeedsResend(null), true);
  assert.equal(inviteNeedsResend('expired'), true);
  assert.equal(inviteNeedsResend('cancelled'), true);
  assert.equal(inviteNeedsResend('sent'), false);
  assert.match(inviteStatusText('sent'), /Invite sent/);
  assert.match(inviteStatusText(null), /No invite yet/);
});

test('workouts stay locked until can_train; the parent-risk notice only when that is the missing piece', () => {
  assert.equal(workoutsLocked(s({ can_train: false })), true);
  assert.equal(workoutsLocked(s({ can_train: true })), false);
  assert.equal(workoutsLocked(null), false);
  assert.equal(parentRiskMissing(s({ is_minor: true, linked: true, can_train: false, parent_risk_done: false })), true);
  assert.equal(parentRiskMissing(s({ is_minor: true, linked: true, can_train: false, parent_risk_done: true })), false);
  assert.equal(parentRiskMissing(s({ can_train: false })), false);
});
