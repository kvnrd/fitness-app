import test from 'node:test';
import assert from 'node:assert/strict';
import { isEmailShape } from '../../src/onboarding/email.ts';

test('email shape needs a dotted domain', () => {
  assert.equal(isEmailShape('kevin@example'), false);
  assert.equal(isEmailShape('kevin@example.com'), true);
  assert.equal(isEmailShape(' parent@example.com '), true);
  assert.equal(isEmailShape('a b@example.com'), false);
});
