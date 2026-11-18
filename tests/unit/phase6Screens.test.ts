import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { HASH_MATCHING_LIVE } from '../../src/studio/phase6Flags.ts';
import {
  DFPS_HOTLINE_URL,
  DFPS_ONLINE_URL,
  EMERGENCY_URL,
  SAFETY_ACTIONS,
} from '../../src/studio/safetyLinks.ts';

const root = resolve(import.meta.dirname, '../..');
const read = (p: string) => readFileSync(resolve(root, p), 'utf8');

const phase6Source = read('src/studio/screens/Phase6Screen.tsx');
const safetySource = read('src/studio/screens/SafetyScreens.tsx');
const registrySource = read('src/onboarding/preview/registry.tsx');

function screenIds(): string[] {
  const block = phase6Source.match(/export const PHASE6_SCREEN_IDS = \[([\s\S]*?)\] as const/);
  assert.ok(block, 'PHASE6_SCREEN_IDS array not found');
  return [...block[1].matchAll(/'([^']+)'/g)].map((m) => m[1]);
}

/** Source text of one exported screen function, up to the next top-level function. */
function screenBody(name: string): string {
  const start = safetySource.indexOf(`export function ${name}(`);
  assert.ok(start >= 0, `${name} not found`);
  const next = safetySource.indexOf('\nexport function ', start + 1);
  const nextLocal = safetySource.indexOf('\nfunction ', start + 1);
  const ends = [next, nextLocal].filter((i) => i > 0);
  return safetySource.slice(start, ends.length ? Math.min(...ends) : undefined);
}

test('Phase 6 has 85 unique screen IDs', () => {
  const ids = screenIds();
  assert.equal(ids.length, 85);
  assert.equal(new Set(ids).size, 85);
});

test('every Phase 6 screen ID renders a case and is in the preview registry', () => {
  for (const id of screenIds()) {
    assert.ok(phase6Source.includes(`case '${id}':`), `no switch case for ${id}`);
  }
  assert.match(registrySource, /PHASE6_SCREEN_IDS\.map\(\(id\) => \[id, \(\) => <Phase6Screen id=\{id\} \/>\]\)/);
  assert.match(registrySource, /\.\.\.phase6Previews/);
});

test('55 puts the three DFPS and 911 actions first, with working destinations', () => {
  assert.equal(DFPS_HOTLINE_URL, 'tel:18002525400');
  assert.equal(DFPS_ONLINE_URL, 'https://www.txabusehotline.org');
  assert.equal(EMERGENCY_URL, 'tel:911');
  const body = screenBody('SafetyReportingScreen');
  let last = -1;
  for (const { label, url } of SAFETY_ACTIONS) {
    const at = body.indexOf(`label="${label}"`);
    assert.ok(at > last, `${label} missing or out of order`);
    last = at;
    const constName = { [DFPS_HOTLINE_URL]: 'DFPS_HOTLINE_URL', [DFPS_ONLINE_URL]: 'DFPS_ONLINE_URL', [EMERGENCY_URL]: 'EMERGENCY_URL' }[url];
    const line = body.slice(at, body.indexOf('\n', at));
    assert.ok(line.includes(`openSafetyUrl(${constName})`), `${label} is not wired to ${url}`);
  }
  assert.ok(body.indexOf('Tell [App] too') > last, 'Tell [App] too must come after the first actions');
  assert.ok(body.includes('This doesn’t replace your report.'));
  assert.ok(body.includes('View reporting training'));
  assert.ok(!/<TextInput/.test(body), 'there must be no in-app DFPS form');
});

test('56 keeps the 1-year preservation line and no hash sentence while the flag is off', () => {
  const body = screenBody('NcmecPolicyScreen');
  assert.ok(body.includes('preserve the reported material for 1 year.'));
  assert.ok(body.includes('What you’ll see'));
  assert.ok(body.includes('16–17 year olds can’t upload progress photos.'));
  if (!HASH_MATCHING_LIVE) {
    assert.ok(!/hash/i.test(body), '56 must not mention hash matching while HASH_MATCHING_LIVE is false');
  }
});
