import test from 'node:test';
import assert from 'node:assert/strict';
import { addYears, deriveAgeBand } from '../../src/onboarding/ageBand.ts';

const today = new Date(2026, 10, 15);

test('DOB only: under 16 ineligible, 16-17 band, 18+ band', () => {
  assert.deepEqual(deriveAgeBand('2011-11-16', null, today), { eligible: false }); // 15
  assert.deepEqual(deriveAgeBand('2010-11-15', null, today), { eligible: true, band: '16_17', adultOn: '2028-11-15' }); // 16 today
  assert.deepEqual(deriveAgeBand('2009-06-01', null, today), { eligible: true, band: '16_17', adultOn: '2027-06-01' });
  assert.deepEqual(deriveAgeBand('2008-11-15', null, today), { eligible: true, band: '18_plus', adultOn: null }); // 18 today
  assert.deepEqual(deriveAgeBand('2008-11-16', null, today), { eligible: true, band: '16_17', adultOn: '2026-11-16' }); // 17, turns 18 tomorrow
});

test('birthday today counts; day before does not', () => {
  assert.equal(deriveAgeBand('2010-11-15', null, today).eligible, true);
  assert.equal(deriveAgeBand('2010-11-16', null, today).eligible, false);
});

test('Feb 29 birthdays', () => {
  // 2008-02-29 on 2026-02-28 is 17, on 2026-03-01 is 18 (matches Postgres age()).
  assert.equal(deriveAgeBand('2008-02-29', null, new Date(2026, 1, 28)).eligible && (deriveAgeBand('2008-02-29', null, new Date(2026, 1, 28)) as { band: string }).band, '16_17');
  assert.equal((deriveAgeBand('2008-02-29', null, new Date(2026, 2, 1)) as { band: string }).band, '18_plus');
  // adult_on is clamped to Feb 28 in non-leap years, like `date + interval '18 years'`.
  assert.equal(addYears(2008, 2, 29, 18), '2026-02-28');
  assert.equal(addYears(2008, 2, 29, 16), '2024-02-29');
});

test('store signal lower bound wins when lower than DOB age', () => {
  const r = deriveAgeBand('2000-01-01', { lower: 16, upper: 17 }, today);
  assert.deepEqual(r, { eligible: true, band: '16_17', adultOn: '2028-11-15' }); // today + 2y
  assert.deepEqual(deriveAgeBand('2000-01-01', { lower: 13, upper: 15 }, today), { eligible: false });
});

test('DOB wins when lower than the store bound', () => {
  assert.deepEqual(deriveAgeBand('2011-01-01', { lower: 18, upper: null }, today), { eligible: false });
  assert.equal((deriveAgeBand('2009-06-01', { lower: 18, upper: null }, today) as { band: string }).band, '16_17');
});

test('store 18+ with a minor DOB stays a minor; adult_on is the DOB-based date', () => {
  assert.deepEqual(deriveAgeBand('2009-06-01', { lower: 18, upper: null }, today), { eligible: true, band: '16_17', adultOn: '2027-06-01' });
});

test('adult_on is the LATEST implied 18th birthday', () => {
  // DOB age 17 (adult 2027-06-01); store lower 16 -> today + 2y = 2028-11-15 (later)
  assert.equal((deriveAgeBand('2009-06-01', { lower: 16, upper: 17 }, today) as { adultOn: string }).adultOn, '2028-11-15');
  // store lower 17 -> 2027-11-15 (later than 2027-06-01)
  assert.equal((deriveAgeBand('2009-06-01', { lower: 17, upper: 17 }, today) as { adultOn: string }).adultOn, '2027-11-15');
});

test('upper-only store range counts as 0 (ineligible)', () => {
  assert.deepEqual(deriveAgeBand('1990-01-01', { lower: null, upper: 12 }, today), { eligible: false });
  assert.deepEqual(deriveAgeBand('1990-01-01', { lower: null, upper: 17 }, today), { eligible: false });
});

test('no bounds at all means no store signal', () => {
  assert.equal((deriveAgeBand('1990-01-01', { lower: null, upper: null }, today) as { band: string }).band, '18_plus');
});

test('invalid DOB throws', () => {
  assert.throws(() => deriveAgeBand('2030-01-01', null, today), /invalid_birth_date/);
  assert.throws(() => deriveAgeBand('1900-01-01', null, today), /invalid_birth_date/);
  assert.throws(() => deriveAgeBand('nope', null, today), /invalid_birth_date/);
});
