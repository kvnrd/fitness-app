import test from 'node:test';
import assert from 'node:assert/strict';
import { daysInMonth, isCompleteDob, toIsoDate, validateDob } from '../../src/onboarding/dob.ts';

const today = new Date(2026, 10, 15); // 15 Nov 2026 local
const P = (year: string, month: string, day: string) => ({ year, month, day });

test('isCompleteDob needs 4-digit year and 1-2 digit month/day', () => {
  assert.equal(isCompleteDob(P('2000', '1', '5')), true);
  assert.equal(isCompleteDob(P('00', '1', '5')), false);
  assert.equal(isCompleteDob(P('2000', '', '5')), false);
  assert.equal(isCompleteDob(P('2000', '123', '5')), false);
  assert.equal(isCompleteDob(P('20a0', '1', '5')), false);
});

test('month and day ranges', () => {
  assert.equal(validateDob(P('2000', '0', '10'), today), 'month');
  assert.equal(validateDob(P('2000', '13', '10'), today), 'month');
  assert.equal(validateDob(P('2000', '5', '0'), today), 'day');
  assert.equal(validateDob(P('2000', '4', '31'), today), 'day');
  assert.equal(validateDob(P('2000', '12', '31'), today), null);
});

test('leap years', () => {
  assert.equal(daysInMonth(2000, 2), 29);
  assert.equal(daysInMonth(1900, 2), 28);
  assert.equal(daysInMonth(2024, 2), 29);
  assert.equal(daysInMonth(2023, 2), 28);
  assert.equal(toIsoDate(P('2008', '2', '29'), today), '2008-02-29');
  assert.equal(toIsoDate(P('2009', '2', '29'), today), null);
  assert.equal(toIsoDate(P('1900', '2', '29'), today), null);
});

test('not in the future (today is fine)', () => {
  assert.equal(toIsoDate(P('2026', '11', '15'), today), '2026-11-15');
  assert.equal(validateDob(P('2026', '11', '16'), today), 'future');
  assert.equal(validateDob(P('2027', '1', '1'), today), 'future');
});

test('not more than 120 years ago', () => {
  assert.equal(toIsoDate(P('1906', '11', '15'), today), '1906-11-15');
  assert.equal(validateDob(P('1906', '11', '14'), today), 'too_old');
  assert.equal(validateDob(P('1800', '1', '1'), today), 'too_old');
});

test('toIsoDate pads and rejects incomplete', () => {
  assert.equal(toIsoDate(P('2005', '3', '7'), today), '2005-03-07');
  assert.equal(toIsoDate(P('', '3', '7'), today), null);
  assert.equal(toIsoDate(P('2005', 'x', '7'), today), null);
});
