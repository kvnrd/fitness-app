import test from 'node:test';
import assert from 'node:assert/strict';
import { homeRoute, shouldGoHome, type GateFlags } from '../../src/onboarding/homeRoute.ts';

const off: GateFlags = { notEligible: false, signedOut: false, needsProfile: false, pendingMinor: false, needsSetup: false, needsPrivacy: false, needsTerms: false, termsWaiting: false, inAppOk: false };
const g = (o: Partial<GateFlags>): GateFlags => ({ ...off, ...o });
const root = (path: string) => ({ path, canGoBack: false, launchPath: '/' });
const pushed = (path: string) => ({ path, canGoBack: true, launchPath: '/' });

test('each state has its own home', () => {
  assert.equal(homeRoute(g({ notEligible: true, signedOut: true })), '/not-eligible');
  assert.equal(homeRoute(g({ signedOut: true })), '/welcome');
  assert.equal(homeRoute(g({ needsProfile: true })), '/onboarding');
  assert.equal(homeRoute(g({ pendingMinor: true })), '/waiting-parent');
  assert.equal(homeRoute(g({ needsSetup: true })), '/setup/start');
  assert.equal(homeRoute(g({ needsPrivacy: true })), '/privacy-safety');
  assert.equal(homeRoute(g({ needsTerms: true })), '/legal/reaccept');
  assert.equal(homeRoute(g({ inAppOk: true })), null);
  // A teen waiting on a parent's re-accept keeps using the app.
  assert.equal(homeRoute(g({ termsWaiting: true, inAppOk: true })), null);
});

test('the router fallback is replaced with the state home', () => {
  assert.equal(shouldGoHome(g({ signedOut: true }), root('/age')), '/welcome');
  assert.equal(shouldGoHome(g({ needsSetup: true }), root('/legal/terms')), '/setup/start');
  assert.equal(shouldGoHome(g({ needsSetup: true }), root('/')), '/setup/start');
  assert.equal(shouldGoHome(g({ needsPrivacy: true }), root('/legal/terms')), '/privacy-safety');
  assert.equal(shouldGoHome(g({ pendingMinor: true }), root('/legal/terms')), '/waiting-parent');
});

test('no redirect once home', () => {
  assert.equal(shouldGoHome(g({ signedOut: true }), root('/welcome')), null);
  assert.equal(shouldGoHome(g({ needsSetup: true }), root('/setup/start')), null);
  assert.equal(shouldGoHome(g({ needsSetup: true }), pushed('/setup/equipment')), null);
  assert.equal(shouldGoHome(g({ inAppOk: true }), root('/legal/terms')), null);
});

test('screens reached on purpose stay put', () => {
  assert.equal(shouldGoHome(g({ signedOut: true }), pushed('/age')), null);
  assert.equal(shouldGoHome(g({ signedOut: true }), pushed('/sign-in')), null);
  assert.equal(shouldGoHome(g({ needsSetup: true }), pushed('/parent-link')), null);
  assert.equal(shouldGoHome(g({ needsTerms: true }), pushed('/settings/privacy')), null);
});

test('public legal pages stay reachable from every state', () => {
  for (const s of [g({ signedOut: true }), g({ needsSetup: true }), g({ needsPrivacy: true }), g({ notEligible: true })]) {
    assert.equal(shouldGoHome(s, pushed('/legal/privacy')), null);
    // Opened by a deep link at launch.
    assert.equal(shouldGoHome(s, { path: '/legal/health-privacy', canGoBack: false, launchPath: '/legal/health-privacy' }), null);
  }
});

test('a screen from another state is left for home', () => {
  assert.equal(shouldGoHome(g({ needsProfile: true }), pushed('/sign-in')), '/onboarding');
  assert.equal(shouldGoHome(g({ needsSetup: true }), pushed('/onboarding')), '/setup/start');
});

test('the dev screenshot harness is left alone', () => {
  assert.equal(shouldGoHome(g({ signedOut: true }), root('/dev-preview')), null);
});
