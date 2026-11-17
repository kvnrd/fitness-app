import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { generateAuroraPalette } from '../../src/theme/auroraGen.ts';
import { auroraPaletteFor, berry, berryLight, chrome, chromeLight, grove, midnight } from '../../src/theme/auroraPalettes.ts';
import { resolveColors, resolveTheme } from '../../src/theme/resolve.ts';
import {
  ACCENT_KEYS,
  DEFAULT_ACCENT,
  DEFAULT_AURORA_PRESET,
  DEFAULT_FAMILY,
  accents,
  auroraRadius,
  effects,
  minControlSize,
  neutrals,
  prTokens,
  radius,
  fontSize,
} from '../../src/theme/tokens.ts';

const fixture = JSON.parse(
  readFileSync(resolve(import.meta.dirname, 'fixtures/aurora-gen-py.json'), 'utf8'),
) as Array<Record<string, unknown>>;

test('v2 resolveColors is unchanged for every accent and both schemes', () => {
  for (const scheme of ['dark', 'light'] as const) {
    const n = neutrals[scheme];
    for (const key of ACCENT_KEYS) {
      const got = resolveColors(scheme, key);
      const roles = accents[key].modes[scheme];
      assert.equal(got.bg, n.bg);
      assert.equal(got.surface, n.surface);
      assert.equal(got.surfaceRaised, n.surfaceRaised);
      assert.equal(got.border, n.border);
      assert.equal(got.text, n.text);
      assert.equal(got.textSecondary, n.textSecondary);
      assert.equal(got.textMuted, n.textMuted);
      assert.equal(got.accent, roles.accent);
      assert.equal(got.accentText, roles.accentText);
      assert.equal(got.accentInk, roles.accentInk);
      assert.deepEqual(got.accentMetal ?? null, roles.accentMetal ?? null);
      assert.equal(got.heat, roles.heat ?? n.heat);
      assert.equal(got.danger, roles.danger ?? n.danger);
      assert.equal(got.pr, prTokens[scheme].pr);
      assert.equal(got.prInk, prTokens[scheme].prInk);
      assert.deepEqual(got.effects, effects[scheme]);
      assert.equal(got.page, n.bg);
    }
  }
});

test('default family is Aurora Midnight; Classic v2 is still resolvable', () => {
  assert.equal(DEFAULT_FAMILY, 'aurora');
  assert.equal(DEFAULT_AURORA_PRESET, 'midnight');
  assert.equal(resolveTheme('dark').bg, midnight.bg);
  assert.equal(resolveTheme('light').bg, grove.bg);
  assert.deepEqual(resolveTheme('dark', 'v2', DEFAULT_ACCENT), resolveColors('dark', DEFAULT_ACCENT));
  assert.deepEqual(resolveTheme('light', 'v2', 'volt'), resolveColors('light', 'volt'));
});

test('type scale is 12 / 14 / 16 / 20 / 32 / 48 / 64', () => {
  assert.deepEqual(Object.values(fontSize), [12, 14, 16, 20, 32, 48, 64]);
});

test('v2 radius values are unchanged; Aurora radii are larger', () => {
  assert.equal(radius.card, 16);
  assert.equal(radius.sheet, 24);
  assert.equal(radius.input, 8);
  assert.equal(auroraRadius.card, 24);
  assert.equal(auroraRadius.hero, 32);
  assert.equal(auroraRadius.tab, 32);
  assert.equal(auroraRadius.sheet, 46);
  assert.equal(auroraRadius.input, 12);
  assert.equal(minControlSize, 44);
});

test('official Midnight and Grove tokens resolve on the matching scheme', () => {
  const mid = resolveTheme('dark', 'aurora', DEFAULT_ACCENT, 'midnight');
  assert.equal(mid.bg, midnight.bg);
  assert.equal(mid.page, midnight.page);
  assert.equal(mid.text, midnight.text);
  assert.equal(mid.textSecondary, midnight.textSecondary);
  assert.equal(mid.faint, midnight.faint);
  assert.notEqual(mid.faint, mid.textMuted, 'faint is decorative; textMuted stays secondary for copy');
  assert.equal(mid.textMuted, midnight.textSecondary);
  assert.equal(mid.accent, midnight.accent);
  assert.equal(mid.accentInk, midnight.accentInk);
  assert.deepEqual(mid.accentMetal, midnight.accentMetal);
  assert.equal(mid.glass, midnight.glass);
  assert.equal(mid.tabOn, midnight.tabOn);
  assert.equal(mid.heat, midnight.heat);
  assert.equal(mid.unreviewed, undefined);

  const gr = resolveTheme('light', 'aurora', DEFAULT_ACCENT, 'grove');
  assert.equal(gr.bg, grove.bg);
  assert.equal(gr.accent, grove.accent);
  assert.equal(gr.faint, grove.faint);
  assert.equal(gr.pr, grove.pr);
  assert.equal(gr.prInk, grove.prInk);
});

test('Midnight and Grove are a pair: the opposite scheme swaps to the pair mate', () => {
  assert.equal(resolveTheme('light', 'aurora', DEFAULT_ACCENT, 'midnight').bg, grove.bg);
  assert.equal(resolveTheme('dark', 'aurora', DEFAULT_ACCENT, 'grove').bg, midnight.bg);
});

test('Berry and Chrome dark use the hand-tuned presets, not gen.py', () => {
  const b = resolveTheme('dark', 'aurora', DEFAULT_ACCENT, 'berry');
  const c = resolveTheme('dark', 'aurora', DEFAULT_ACCENT, 'chrome');
  assert.equal(b.bg, berry.bg);
  assert.equal(b.accent, berry.accent);
  assert.equal(c.bg, chrome.bg);
  assert.equal(c.accent, chrome.accent);
  assert.deepEqual(c.accentMetal, chrome.accentMetal);
  // gen.py at the Chrome hue is a vivid cyan — must not replace the silver preset.
  const genCyan = generateAuroraPalette(222, 'dark');
  assert.notEqual(c.accent, genCyan.accent);
  assert.notEqual(c.bg, genCyan.bg);
});

test('Berry light and Chrome light are generated, flagged unreviewed, and match the token map', () => {
  const bl = auroraPaletteFor('berry', 'light');
  const cl = auroraPaletteFor('chrome', 'light');
  assert.equal(bl.unreviewed, true);
  assert.equal(cl.unreviewed, true);
  assert.equal(bl.bg, berryLight.bg);
  assert.equal(bl.bg, '#F8EBED');
  assert.equal(bl.faint, '#88797B');
  assert.equal(cl.bg, chromeLight.bg);
  assert.equal(cl.bg, '#E4F1F6');
  assert.equal(cl.faint, '#718086');
  assert.equal(resolveTheme('light', 'aurora', DEFAULT_ACCENT, 'berry').unreviewed, true);
  assert.equal(resolveTheme('light', 'aurora', DEFAULT_ACCENT, 'chrome').unreviewed, true);
});

test('generateAuroraPalette matches aurora-v4/src/gen.py for sampled hues', () => {
  for (const row of fixture) {
    const got = generateAuroraPalette(row.hue as number, row.scheme as 'dark' | 'light');
    const label = `${row.scheme} hue ${row.hue}`;
    assert.equal(got.bg, row.bg, `${label} bg`);
    assert.equal(got.page, row.page, `${label} page`);
    assert.equal(got.text, row.text, `${label} text`);
    assert.equal(got.mut, row.mut, `${label} mut`);
    assert.equal(got.accent, row.accent, `${label} accent`);
    assert.equal(got.accentInk, row.ink, `${label} ink`);
    assert.equal(got.accentText, row.accentText, `${label} accentText`);
    assert.deepEqual(got.glows, row.blobs, `${label} glows`);
    assert.deepEqual(got.accentMetal, row.grad, `${label} grad`);
    assert.equal(got.rowOn, row.rowOn, `${label} rowOn`);
    assert.equal(got.glass, row.glass, `${label} glass`);
    assert.equal(got.glassBorder, row.gb, `${label} glassBorder`);
    assert.equal(got.inputFill, row.input, `${label} input`);
    assert.equal(got.track, row.track, `${label} track`);
    assert.equal(got.grain, row.grain, `${label} grain`);
    assert.equal(got.grainBlend, row.blend, `${label} blend`);
  }
});
