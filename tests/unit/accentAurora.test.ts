import test from 'node:test';
import assert from 'node:assert/strict';
import { auroraTintForAccent, hexHue } from '../../src/theme/accentAurora.ts';
import { ACCENT_KEYS } from '../../src/theme/tokens.ts';

test('hexHue reads the HSL hue and ignores greys', () => {
  assert.equal(hexHue('#FF0000'), 0);
  assert.equal(hexHue('#00FF00'), 120);
  assert.equal(hexHue('#0000FF'), 240);
  assert.equal(hexHue('#808080'), null);
  assert.equal(hexHue('nope'), null);
});

test('each accent maps to an Aurora tint', () => {
  assert.deepEqual(auroraTintForAccent('champagne'), { preset: 'midnight' });
  assert.deepEqual(auroraTintForAccent('mono'), { preset: 'chrome' });
  const hues = new Set<number>();
  for (const k of ACCENT_KEYS) {
    if (k === 'champagne' || k === 'mono') continue;
    const t = auroraTintForAccent(k);
    assert.ok('hue' in t, k);
    assert.ok(t.hue >= 0 && t.hue < 360);
    hues.add(t.hue);
  }
  assert.equal(hues.size, 5, 'volt, orange, blue, red and cyan get distinct hues');
});
