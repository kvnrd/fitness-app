import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { sha256Hex, sha256HexPure } from '../../src/legal/hash.ts';
import {
  AI_NEEDS_HEALTH_ACTION, AI_NEEDS_HEALTH_BODY, AI_NEEDS_HEALTH_DISMISS, AI_NEEDS_HEALTH_TITLE, AI_TEXT_PARENT, COACH_ATTEST_GENERAL, COACH_ATTEST_MINORS, HEALTH_POLICY, HEALTH_TEXT_WITH_AI, NOT_ELIGIBLE_BODY, NOT_ELIGIBLE_TITLE, PRIVACY_POLICY, TERMS, termsAcceptanceCounts, aiNeedsHealthBody, parentAiNeedsHealthBody,
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
  assert.equal(TERMS.version, 'v0.1-draft');
  assert.equal(TERMS.preProduction, true);
  assert.match(TERMS.hash, /^[0-9a-f]{64}$/);
  assert.notEqual(PRIVACY_POLICY.hash, HEALTH_POLICY.hash);
  assert.notEqual(TERMS.hash, PRIVACY_POLICY.hash);
  assert.equal(termsAcceptanceCounts(TERMS.version, TERMS.hash), true);
  assert.equal(termsAcceptanceCounts('terms-placeholder-v0', TERMS.hash), false);
  assert.equal(termsAcceptanceCounts(TERMS.version, null), false);
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
  for (const t of [legalTexts.terms(), legalTexts.health(), legalTexts.aiAdult(), legalTexts.aiTeen(), legalTexts.riskAdult(), legalTexts.riskParent({ teenName: 'Alex' }), legalTexts.parentAttest(), legalTexts.parentHealth(), legalTexts.parentAi(), legalTexts.parentCoach(), legalTexts.coachAttestGeneral(), legalTexts.coachAttestMinors()]) {
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

test('coach attestations are Counsel\'s exact wording (phase3-build-answers §2)', () => {
  assert.equal(
    COACH_ATTEST_GENERAL,
    "I confirm that:\n- I'm 18 or older, and everything in my application is true.\n- I'm an independent coach, not an employee of [Company]. I sell my 1:1 coaching myself, as the seller of record, through my own Stripe account, and I handle my own refunds, chargebacks, and taxes.\n- I won't give medical advice, diagnose or treat injuries or conditions, or call myself a doctor, physical therapist, or dietitian unless I'm licensed as one.\n- I'll see a client's info only if they share it with me. I'll never ask for a 16–17 client's health info, and I'll see an adult's health answers only if they choose to share them.\n- I'll keep client info confidential, use it only to coach that client, and not copy it out of Fitness App. If the client, their parent, or [Company] asks, I'll delete any notes or copies I kept outside Fitness App and confirm when it's done.\n- I agree to the [Coach Terms] and the Fitness App Terms of Service.",
  );
  assert.equal(
    COACH_ATTEST_MINORS,
    "I want to coach 16–17-year-olds, and I agree that:\n- [Company] will run a National Sex Offender Public Website (NSOPW) search on me before approving me, and I'll complete Texas child-abuse reporting training first.\n- If I believe a child is being abused or neglected, I'll report it as Texas law requires (Texas Family Code chapter 261), and also use Fitness App's report tools.\n- I'll talk with minor clients only by text in Fitness App chat, which their parent can read and which is filtered and reviewed. I won't message between 10 pm and 7 am, never contact a minor client outside Fitness App, and won't try to get around the filters.\n- Live sessions with minors happen only in Fitness App, with their parent invited, and I'll never record them.\n- I'll never see or ask for a minor client's health info, photos, or videos, and I won't give them weight-loss, calorie, body-size, bulking, or supplement advice.",
  );
  assert.equal(legalTexts.coachAttestGeneral().version, 'coach-attest-general-2026-11-16-draft');
  assert.equal(legalTexts.coachAttestMinors().version, 'coach-attest-minors-2026-11-16-draft');
  assert.match(COACH_ATTEST_GENERAL, /16–17/);
  assert.match(COACH_ATTEST_MINORS, /16–17-year-olds/);
});
