import test from 'node:test';
import assert from 'node:assert/strict';
import { HINT_PRIVACY } from '../../src/legal/text.ts';
import { canContinue, initPs, setAi, setHealth, setRisk, submission } from '../../src/onboarding/privacySafety.ts';
import {
  decidePrivacyContinue,
  loadLocalPrivacySafety,
  recordFromSubmission,
  saveLocalPrivacySafety,
} from '../../src/onboarding/localPrivacySafety.ts';
import type { KeyValueAdapter } from '../../src/onboarding/deviceSetupStore.ts';

function mem(): KeyValueAdapter & { m: Map<string, string> } {
  const m = new Map<string, string>();
  return { m, getItem: async (k) => m.get(k) ?? null, setItem: async (k, v) => void m.set(k, v), removeItem: async (k) => void m.delete(k) };
}

const META = {
  healthVersion: 'h1',
  healthHash: 'hh',
  aiVersion: 'a1',
  aiHash: 'ah',
  riskVersion: 'r1',
  riskHash: 'rh',
  healthPolicyHash: 'ph',
};

test('Continue with the risk box checked and no backend used to fail silently; it now chooses preview', () => {
  const s = setRisk(initPs('adult'), true);
  assert.equal(canContinue(s), true);
  const sub = submission(s);
  assert.deepEqual(sub, { health: false, ai: false });
  // The old route did `if (!sub || busy || !user) return` and showed no message.
  const decision = decidePrivacyContinue({
    submission: sub,
    busy: false,
    hasUser: false,
    supabaseConfigured: false,
    hint: HINT_PRIVACY,
  });
  assert.deepEqual(decision, { type: 'preview' });
});

test('Continue still requires the risk checkbox and shows the hint instead of doing nothing', () => {
  const s = setAi(setHealth(initPs('adult'), true), true);
  assert.equal(canContinue(s), false);
  assert.equal(submission(s), null);
  const decision = decidePrivacyContinue({
    submission: submission(s),
    busy: false,
    hasUser: true,
    supabaseConfigured: true,
    hint: HINT_PRIVACY,
  });
  assert.deepEqual(decision, { type: 'blocked', message: HINT_PRIVACY });
});

test('busy is a no-op; a signed-in configured session submits remotely', () => {
  const sub = submission(setRisk(initPs('adult'), true));
  assert.deepEqual(
    decidePrivacyContinue({ submission: sub, busy: true, hasUser: true, supabaseConfigured: true, hint: HINT_PRIVACY }),
    { type: 'busy' },
  );
  assert.deepEqual(
    decidePrivacyContinue({ submission: sub, busy: false, hasUser: true, supabaseConfigured: true, hint: HINT_PRIVACY }),
    { type: 'remote' },
  );
  // A configured backend with no user still falls back to preview rather than failing silently.
  assert.deepEqual(
    decidePrivacyContinue({ submission: sub, busy: false, hasUser: false, supabaseConfigured: true, hint: HINT_PRIVACY }),
    { type: 'preview' },
  );
});

test('local save keeps health and AI as separate opt-ins, forces AI off when health is off, and pre-checks nothing', async () => {
  const storage = mem();
  assert.equal(await loadLocalPrivacySafety(storage), null);

  const off = recordFromSubmission({ health: false, ai: true }, META, () => '2026-11-16T20:00:00.000Z');
  assert.deepEqual([off.health, off.ai], [false, false]);
  await saveLocalPrivacySafety(storage, off);
  const loadedOff = await loadLocalPrivacySafety(storage);
  assert.deepEqual(loadedOff, off);

  const both = recordFromSubmission({ health: true, ai: true }, META, () => '2026-11-16T20:01:00.000Z');
  assert.deepEqual([both.health, both.ai], [true, true]);
  await saveLocalPrivacySafety(storage, both);
  assert.deepEqual(await loadLocalPrivacySafety(storage), both);

  const healthOnly = recordFromSubmission({ health: true, ai: false }, META, () => '2026-11-16T20:02:00.000Z');
  assert.deepEqual([healthOnly.health, healthOnly.ai], [true, false]);
});

test('teen submission without parent grants still stores both switches off', () => {
  const s = setRisk(initPs('teen'), true);
  const rec = recordFromSubmission(submission(s)!, META, () => 't');
  assert.deepEqual([rec.health, rec.ai], [false, false]);
});

test('corrupt or incomplete local records are ignored', async () => {
  const storage = mem();
  await storage.setItem('privacySafety.local.v1', '{not-json');
  assert.equal(await loadLocalPrivacySafety(storage), null);
  await storage.setItem('privacySafety.local.v1', JSON.stringify({ health: true, ai: true }));
  assert.equal(await loadLocalPrivacySafety(storage), null);
});
