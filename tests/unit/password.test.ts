import test from 'node:test';
import assert from 'node:assert/strict';
import { isEmailShape, passwordStrength } from '../../src/onboarding/password.ts';

test('under 12 characters is level 0 and does not meet length', () => {
  const s = passwordStrength('abcdefghijk');
  assert.equal(s.level, 0);
  assert.equal(s.meetsLength, false);
});

test('length drives strength; no composition rules', () => {
  assert.equal(passwordStrength('correct horse').meetsLength, true);
  assert.equal(passwordStrength('abcdefghijkl').level, 1);
  assert.equal(passwordStrength('correct horse stapler').level, 3);
  assert.equal(passwordStrength('correct horse battery stapler').level, 4);
});

test('repetitive passwords are capped, 128 is the max', () => {
  assert.equal(passwordStrength('aaaaaaaaaaaaaaaaaaaaaaaaaaaa').level, 1);
  assert.equal(passwordStrength('x1'.repeat(65)).withinMax, false);
  assert.equal(passwordStrength('x1'.repeat(65)).level, 0);
  assert.equal(passwordStrength('x1'.repeat(64)).withinMax, true);
});

test('email shape needs a dotted domain', () => {
  assert.equal(isEmailShape('kevin@example'), false);
  assert.equal(isEmailShape('kevin@example.com'), true);
  assert.equal(isEmailShape(' parent@example.com '), true);
  assert.equal(isEmailShape('a b@example.com'), false);
});
