import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { sha256Hex, sha256HexPure } from '../../src/legal/hash.ts';
import {
  AI_NEEDS_HEALTH_ACTION, AI_NEEDS_HEALTH_BODY, AI_NEEDS_HEALTH_DISMISS, AI_NEEDS_HEALTH_TITLE, AI_TEXT_PARENT, HEALTH_POLICY, HEALTH_TEXT_WITH_AI, NOT_ELIGIBLE_BODY, NOT_ELIGIBLE_TITLE, PRIVACY_POLICY, aiNeedsHealthBody, parentAiNeedsHealthBody,
  adultRiskCard, legalTexts, parentAiText, parentAttestationText, parentCoachText, parentRiskCard, RISK_BODY_RISKS,
} from '../../src/legal/text.ts';

const node = (s: string) => createHash('sha256').update(s, 'utf8').digest('hex');

test('pure sha256 matches node:crypto (incl. unicode and block boundaries)', async () => {
  for (const s of ['', 'abc', 'é–’ 🏋️', 'x'.repeat(55), 'x'.repeat(56), 'x'.repeat(64), 'x'.repeat(1000)]) {
    assert.equal(sha256HexPure(s), node(s));
    assert.equal(await sha256Hex(s), node(s));
  }
});

test('not-eligible copy is exact', () => {
  assert.equal(NOT_ELIGIBLE_TITLE, "Sorry, you can't create an account right now");
  assert.equal(NOT_ELIGIBLE_BODY, 'Nothing you entered has been saved.');
});

test('policy refs carry version + 64-hex hash', () => {
  for (const p of [PRIVACY_POLICY, HEALTH_POLICY]) {
    assert.match(p.hash, /^[0-9a-f]{64}$/);
    assert.ok(p.version.length >= 1 && p.version.length <= 64);
    assert.match(p.version, /v0\.2-draft$/);
  }
  assert.notEqual(PRIVACY_POLICY.hash, HEALTH_POLICY.hash);
});

test('parent AI builder equals the Phase 2 constant when the name is unknown', () => {
  assert.equal(parentAiText(), AI_TEXT_PARENT);
});

test('risk text: emergency sentence present; parent version is third person', () => {
  assert.ok(RISK_BODY_RISKS.includes('Stop right away and get medical help if you have chest pain, fainting or dizziness, or trouble breathing. In an emergency, call 911.'));
  const p = parentRiskCard({ teenName: 'Alex' });
  assert.equal(p.checkbox, "I have read this notice and talked with Alex about these risks. I understand this is not a waiver of Alex's legal rights.");
  assert.ok(p.bodyNotMedical.includes('before Alex starts or changes a program'));
  assert.ok(!/\byou\b/i.test(p.bodyRisks.replace('In an emergency', '')), p.bodyRisks);
  assert.equal(adultRiskCard().checkbox, 'I understand this is not medical advice, and I understand the risks of exercise.');
  assert.ok(!/supervis|help .* train safely/i.test(p.checkbox));
});

test('coach box never offers health items; attestation fills names', () => {
  const c = parentCoachText({ teenName: 'Alex' });
  assert.ok(c.includes('Coaches never see Alex\'s health info'));
  assert.ok(!/and the health items/.test(c));
  const a = parentAttestationText({ teenName: 'Alex', teenFullName: 'Alex Rivera', parentName: 'Sam Rivera' });
  assert.ok(a.startsWith('I am Sam Rivera, 18 or older, and the parent or legal guardian of Alex Rivera'));
  assert.ok(!/\[(Name|Teen|App)/.test(a));
  assert.ok(parentAttestationText().startsWith('I am 18 or older'));
});

test('health text includes the injury-category sentence; each legal text has a version and hashes stably', async () => {
  assert.ok(HEALTH_TEXT_WITH_AI.endsWith('never your notes, measurements, name, or email.'));
  for (const t of [legalTexts.terms(), legalTexts.health(), legalTexts.aiAdult(), legalTexts.aiTeen(), legalTexts.riskAdult(), legalTexts.riskParent({ teenName: 'Alex' }), legalTexts.parentAttest(), legalTexts.parentHealth(), legalTexts.parentAi(), legalTexts.parentCoach()]) {
    assert.ok(t.version.length > 0 && t.version.length <= 64);
    assert.equal(await sha256Hex(t.text), node(t.text));
  }
  assert.notEqual(legalTexts.riskParent({ teenName: 'Alex' }).text, legalTexts.riskParent({ teenName: 'Sam' }).text);
});

test('AI-needs-health copy is Counsel\'s exact wording (phase3-build-answers §1)', () => {
  assert.equal(AI_NEEDS_HEALTH_TITLE, 'AI planning needs health info');
  assert.equal(AI_NEEDS_HEALTH_ACTION, 'Turn on health info');
  assert.equal(AI_NEEDS_HEALTH_DISMISS, 'Not now');
  assert.equal(
    AI_NEEDS_HEALTH_BODY,
    'AI planning checks your health-screen answers and uses any injury you add to avoid or swap exercises, so "Save my health info" has to be on first. From your health info, Anthropic, our AI provider, receives only an injury category, never your notes, measurements, name, or email. You can turn health info on now, or leave AI off.',
  );
  assert.equal(aiNeedsHealthBody('teen'), `${AI_NEEDS_HEALTH_BODY} Your parent must also agree to both.`);
  assert.equal(aiNeedsHealthBody('adult'), AI_NEEDS_HEALTH_BODY);
  const p = parentAiNeedsHealthBody({ teenName: 'Alex' });
  assert.equal(
    p,
    "AI planning checks Alex's health-screen answers and uses any injury Alex adds to avoid or swap exercises, so the health box has to be on first. From that health info, Anthropic, our AI provider, receives only an injury category, never Alex's notes, measurements, name, or email. You can turn it on now, or leave AI off.",
  );
  assert.ok(parentAiNeedsHealthBody().includes("your teen's health-screen answers"));
});
