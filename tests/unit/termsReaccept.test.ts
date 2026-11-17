import test from 'node:test';
import assert from 'node:assert/strict';
import { TERMS, TERMS_CHECKBOX_TEXT } from '../../src/legal/text.ts';
import { termsReacceptGate } from '../../src/legal/termsGate.ts';

test('signup checkbox wording is exact and uses a curly apostrophe', () => {
  assert.equal(TERMS_CHECKBOX_TEXT, 'I agree to the Terms of Service, and I’ve read the Privacy Policy.');
  assert.equal(TERMS_CHECKBOX_TEXT.includes("'"), false);
  assert.equal(TERMS_CHECKBOX_TEXT.includes('\u2019'), true);
  assert.equal(TERMS.version, 'v0.2-draft');
});

test('ToS §20: a pending terms re-acceptance never blocks privacy settings, export, or deletion', () => {
  const adultPending = termsReacceptGate({ inApp: true, termsCurrent: false, isMinor: false });
  assert.equal(adultPending.showReaccept, true);
  assert.equal(adultPending.allowPrivacySettings, true);
  assert.equal(adultPending.allowDataExport, true);
  assert.equal(adultPending.allowAccountDeletion, true);
  assert.equal(adultPending.allowGeneralApp, false);

  const teenPending = termsReacceptGate({ inApp: true, termsCurrent: false, isMinor: true });
  assert.equal(teenPending.showReaccept, true);
  assert.equal(teenPending.allowPrivacySettings, true);
  assert.equal(teenPending.allowDataExport, true);
  assert.equal(teenPending.allowAccountDeletion, true);
  assert.equal(teenPending.allowGeneralApp, true);

  const current = termsReacceptGate({ inApp: true, termsCurrent: true, isMinor: false });
  assert.equal(current.showReaccept, false);
  assert.equal(current.allowGeneralApp, true);
  assert.equal(current.allowPrivacySettings, true);

  const adultLoading = termsReacceptGate({ inApp: true, termsCurrent: null, isMinor: false });
  assert.equal(adultLoading.showReaccept, false);
  assert.equal(adultLoading.allowGeneralApp, false);
  assert.equal(adultLoading.allowPrivacySettings, true);
  assert.equal(adultLoading.allowDataExport, true);
  assert.equal(adultLoading.allowAccountDeletion, true);
});
