import test from 'node:test';
import assert from 'node:assert/strict';
import { isRevokedResult, mapStoreSignal, validBound, AGE_GATES } from '../../src/age/mapStoreSignal.ts';

const A = 'apple_declared_age_range';
const G = 'google_play_age_signals';

test('gates are 16 and 18', () => {
  assert.deepEqual(AGE_GATES, [16, 18]);
});

test('sharing maps to bounds with the source', () => {
  assert.deepEqual(mapStoreSignal({ status: 'sharing', lower: 16, upper: 17 }, A), { source: A, lower: 16, upper: 17 });
  assert.deepEqual(mapStoreSignal({ status: 'sharing', lower: 18, upper: null }, G), { source: G, lower: 18, upper: null });
  assert.deepEqual(mapStoreSignal({ status: 'sharing', lower: null, upper: 15 }, A), { source: A, lower: null, upper: 15 });
});

test('non-sharing statuses give no signal', () => {
  for (const status of ['declined', 'unavailable', 'verification_required', 'revoked', 'unknown']) {
    assert.equal(mapStoreSignal({ status, lower: 18, upper: null }, A), null);
  }
});

test('sharing with no bounds gives no signal', () => {
  assert.equal(mapStoreSignal({ status: 'sharing', lower: null, upper: null }, A), null);
  assert.equal(mapStoreSignal({ status: 'sharing' }, A), null);
});

test('invalid bounds are rejected', () => {
  assert.equal(mapStoreSignal({ status: 'sharing', lower: -1, upper: null }, A), null);
  assert.equal(mapStoreSignal({ status: 'sharing', lower: 121, upper: null }, A), null);
  assert.equal(mapStoreSignal({ status: 'sharing', lower: 16.5, upper: null }, A), null);
  assert.equal(mapStoreSignal({ status: 'sharing', lower: '18', upper: null }, A), null);
  assert.equal(mapStoreSignal({ status: 'sharing', lower: 18, upper: 'x' }, A), null);
  assert.equal(mapStoreSignal({ status: 'sharing', lower: NaN, upper: 20 }, A), null);
  assert.equal(mapStoreSignal({ status: 'sharing', lower: 18, upper: 16 }, A), null);
});

test('edge bounds 0 and 120 are accepted; upper equal to lower is accepted', () => {
  assert.deepEqual(mapStoreSignal({ status: 'sharing', lower: 0, upper: 120 }, A), { source: A, lower: 0, upper: 120 });
  assert.deepEqual(mapStoreSignal({ status: 'sharing', lower: 17, upper: 17 }, A), { source: A, lower: 17, upper: 17 });
  assert.equal(validBound(0), 0);
  assert.equal(validBound(120), 120);
});

test('malformed input never throws and gives null', () => {
  for (const raw of [null, undefined, 5, 'sharing', [], {}]) {
    assert.equal(mapStoreSignal(raw, A), null);
  }
});

test('output carries only source, lower, upper (extra native fields are dropped)', () => {
  const out = mapStoreSignal({ status: 'sharing', lower: 18, upper: null, installId: 'abc', declaration: 'x' }, G);
  assert.deepEqual(Object.keys(out ?? {}).sort(), ['lower', 'source', 'upper']);
});

test('isRevokedResult is true only for status revoked', () => {
  assert.equal(isRevokedResult({ status: 'revoked', lower: null, upper: null }), true);
  assert.equal(isRevokedResult({ status: 'sharing', lower: 18, upper: null }), false);
  assert.equal(isRevokedResult(null), false);
  assert.equal(isRevokedResult('revoked'), false);
});
