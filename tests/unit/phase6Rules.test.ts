import assert from 'node:assert/strict';
import { test } from 'node:test';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import {
  DMCA_FORM_ENABLED,
  HASH_MATCHING_LIVE,
  dmcaFormEnabled,
  hashMatchingLive,
} from '../../src/studio/phase6Flags.ts';
import {
  SAMPLE_SCHEDULE,
  SAMPLE_TRIGGER,
  deletionSchedule,
  dueShort,
} from '../../src/studio/deletionDates.ts';
import {
  forbidsSelfie,
  isDocumentOnlyIdentity,
  stripeRestrictedKey,
  STRIPE_IDENTITY_VERIFICATION_TYPE,
} from '../../src/studio/stripeIdentity.ts';
import { shouldCloseAccount, upheldInWindow } from '../../src/studio/copyrightStrikes.ts';

test('DMCA form flag is off by default', () => {
  assert.equal(DMCA_FORM_ENABLED, false);
  assert.equal(dmcaFormEnabled(), false);
  assert.equal(dmcaFormEnabled(true), true);
});

test('hash-matching flag is off by default and also covers demo videos', () => {
  assert.equal(HASH_MATCHING_LIVE, false);
  assert.equal(hashMatchingLive(), false);
  assert.equal(hashMatchingLive(true), true);
});

test('sample deletion calendar uses calendar days (Nov 17, 2026)', () => {
  const s = SAMPLE_SCHEDULE;
  assert.equal(SAMPLE_TRIGGER, '2026-11-17');
  assert.equal(s.reminder, '2026-12-10');
  assert.equal(s.due, '2026-12-17');
  assert.equal(s.pause, '2026-12-18');
  assert.equal(s.suspend, '2027-01-01');
  assert.equal(dueShort(s.due), 'Dec 17');
});

test('deletion math does not shift around a DST boundary', () => {
  // America/Denver falls back on Nov 1, 2026. Trigger that week + 30 calendar days stays on the calendar date.
  const s = deletionSchedule('2026-10-25');
  assert.equal(s.due, '2026-11-24');
  assert.equal(s.reminder, '2026-11-17');
  assert.equal(s.pause, '2026-11-25');
  assert.equal(s.suspend, '2026-12-09');
});

test('Stripe Identity is document-only and forbids a selfie', () => {
  assert.equal(STRIPE_IDENTITY_VERIFICATION_TYPE, 'document');
  assert.equal(isDocumentOnlyIdentity(), true);
  assert.equal(forbidsSelfie(), true);
  assert.equal(isDocumentOnlyIdentity('document_and_selfie'), false);
  assert.equal(forbidsSelfie('selfie'), false);
});

test('Stripe restricted keys are server-only', () => {
  assert.equal(stripeRestrictedKey({ STRIPE_RESTRICTED_KEY: 'rk_test_abc' }), 'rk_test_abc');
  assert.equal(stripeRestrictedKey({}), undefined);
  assert.throws(
    () => stripeRestrictedKey({ EXPO_PUBLIC_STRIPE_RESTRICTED_KEY: 'rk_live_no' } as NodeJS.ProcessEnv),
    /stripe_key_must_not_be_public/,
  );
});

test('3 upheld copyright notices in 12 months closes the account', () => {
  const asOf = '2026-11-17';
  const two = [
    { upheld: true, noticedOn: '2026-02-01' },
    { upheld: true, noticedOn: '2026-06-01' },
    { upheld: false, noticedOn: '2026-09-01' },
  ];
  assert.equal(upheldInWindow(two, asOf), 2);
  assert.equal(shouldCloseAccount(two, asOf), false);
  const three = [...two, { upheld: true, noticedOn: '2026-10-01' }];
  assert.equal(shouldCloseAccount(three, asOf), true);
  const stale = [
    { upheld: true, noticedOn: '2025-11-16' },
    { upheld: true, noticedOn: '2026-01-01' },
    { upheld: true, noticedOn: '2026-02-01' },
  ];
  assert.equal(shouldCloseAccount(stale, asOf), false);
  const inWindow = [
    { upheld: true, noticedOn: '2025-11-18' },
    { upheld: true, noticedOn: '2026-01-01' },
    { upheld: true, noticedOn: '2026-02-01' },
  ];
  assert.equal(shouldCloseAccount(inWindow, asOf), true);
});

test('shippable-bundle check is clean on app source', () => {
  const script = resolve(import.meta.dirname, '../../scripts/check-shippable-bundle.mjs');
  const out = execFileSync('node', [script], { encoding: 'utf8' });
  assert.match(out, /clean/);
});
