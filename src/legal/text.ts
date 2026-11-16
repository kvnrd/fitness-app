/**
 * Consent and notice wording from Counsel (Phase 2 legal answers, section 12, Nov 15, 2026).
 * Copied VERBATIM except for the placeholders noted below. Every text is [ATTORNEY before launch].
 *
 * Each grant sends the policy version AND a SHA-256 of the exact string shown (consent records:
 * "version, text hash, timestamps"). Changing a single character here means a new version id.
 *
 * Placeholders filled here (need Kevin/Counsel confirmation, see docs/phase-2-backend.md):
 *   [App]  -> APP_NAME (the app.json name, "Fitness App", not a final brand)
 *   [Teen] -> "your teen" (a parent cannot read the teen's name under current RLS)
 *   "[Same retention and training sentence as the version in use.]" -> Version B's two sentences
 *   "[Version A or B text.]" -> the Version B body
 */
import { HEALTH_POLICY_DOC, PRIVACY_POLICY_DOC } from './policies/policies.generated.ts';
import { sha256Hex } from './hash.ts';

export const APP_NAME = 'Fitness App';

const fill = (s: string) => s.replace(/\[App\]/g, APP_NAME);

/** Not-eligible dead end (Paper onb_dob). No age, no threshold, no retry option, no button. [ATTORNEY] */
export const NOT_ELIGIBLE_TITLE = "Sorry, you can't create an account right now"; // [ATTORNEY]
export const NOT_ELIGIBLE_BODY = 'Nothing you entered has been saved.'; // [ATTORNEY]

/** Health data (collection). */
export const HEALTH_TEXT = fill(
  "Save my health info. Turn on to let [App] collect and store your body weight, measurements, injury and pain notes, health-screen answers, form-check numbers, and training data. We use it only to build and adjust your workouts, show your progress, and keep plans safe. It's encrypted, never sold, never used for ads. Shared only with service providers who process it for us under contract. Turn off anytime in Settings › Privacy; you can also delete it there.",
);

const AI_TITLE = 'Use AI to build my plan.';
/** AI vendor, Version B (no ZDR yet). Switch to Version A only after Anthropic confirms ZDR in writing. */
export const AI_TEXT_VERSION_B =
  "Use AI to build my plan. Turn on to send Anthropic, our AI provider, your goals, experience, equipment, age range, and injury category (no name, email, photos, or location) so it can create and adapt your plan. Anthropic processes it only for us, under contract, and doesn't train its AI on it. Anthropic deletes it within 30 days, unless its automated safety checks flag a request (then it may keep that request for up to 2 years) or the law requires it to keep data longer. Turn off anytime in Settings › Privacy; your saved plan stays but stops adapting.";
const AI_B_BODY = AI_TEXT_VERSION_B.slice(AI_TITLE.length + 1);
const AI_B_RETENTION_AND_TRAINING =
  "Anthropic processes it only for us, under contract, and doesn't train its AI on it. Anthropic deletes it within 30 days, unless its automated safety checks flag a request (then it may keep that request for up to 2 years) or the law requires it to keep data longer.";

/** 16-17, teen's own switch (locked until the parent agrees). */
export const AI_TEXT_TEEN = `${AI_TITLE} ${AI_B_BODY} Your parent must also agree before this turns on, and either of you can turn it off.`;

/** Parent's AI box for their teen. */
export const AI_TEXT_PARENT = fill(
  `Let [App] send Anthropic, our AI provider, your teen's goals, experience, equipment, age range, and injury category (no name, email, photos, or location) to create and adapt your teen's plan. ${AI_B_RETENTION_AND_TRAINING} Your teen must also agree. You or your teen can turn it off anytime; your teen's saved plan stays but stops adapting.`,
);

/** Policy versions recorded with each grant. Draft ids until Counsel/attorney sign off. */
export const VERSIONS = {
  health: 'health-2026-11-15-draft',
  aiB: 'ai-B-2026-11-15-draft',
  aiTeen: 'ai-B-teen-2026-11-15-draft',
  aiParent: 'ai-B-parent-2026-11-15-draft',
  coachPlaceholder: 'coach-placeholder-v1',
  terms: 'terms-2026-11-15-draft',
  healthWithAi: 'health-ai-2026-11-15-draft',
  riskAdult: 'risk-2026-11-15-draft',
  riskParent: 'risk-parent-2026-11-15-draft',
  parentAttest: 'parent-attest-2026-11-15-draft',
  parentHealth: 'health-parent-2026-11-15-draft',
  parentCoach: 'coach-parent-2026-11-15-draft',
  aiNeedsHealth: 'ai-needs-health-2026-11-16-draft',
  coachAttestGeneral: 'coach-attest-general-2026-11-16-draft',
  coachAttestMinors: 'coach-attest-minors-2026-11-16-draft',
} as const;

// ───────────────────────────── Policies (Counsel v0.2 DRAFT) ─────────────────────────────

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9.]+/g, '-').replace(/^-|-$/g, '');

/**
 * Send `version` + `hash` with consent / terms calls. hash = SHA-256 of the exact bundled body shown in-app
 * (policies.generated.ts, drafting notes stripped). [ATTORNEY] drafts until published.
 */
export const PRIVACY_POLICY = {
  id: PRIVACY_POLICY_DOC.id,
  version: `privacy-policy-${slug(PRIVACY_POLICY_DOC.version)}`,
  label: PRIVACY_POLICY_DOC.version,
  hash: PRIVACY_POLICY_DOC.sha256,
} as const;
export const HEALTH_POLICY = {
  id: HEALTH_POLICY_DOC.id,
  version: `health-policy-${slug(HEALTH_POLICY_DOC.version)}`,
  label: HEALTH_POLICY_DOC.version,
  hash: HEALTH_POLICY_DOC.sha256,
} as const;

// ───────────────────────────── Phase 3 onboarding copy ─────────────────────────────
// Sources: paper/onb_p3.py, paper/onb_dob.py, legal/phase3-review.md, legal/phase4-review.md.
// Apostrophes are straight (') to match the Phase 2 constants above. Every string is [ATTORNEY] before launch.

/** Create screen: the ONLY checkbox. Not pre-checked. No age clause. */ // [ATTORNEY]
export const TERMS_CHECKBOX_TEXT = 'I agree to the Terms and Privacy Policy.';

// Pending 16-17 screen. Body is Counsel verbatim; the title is UI chrome. // [ATTORNEY]
export const PENDING_TITLE = 'Waiting for a parent';
export const PENDING_BODY =
  'Your parent needs to approve before you can save health info or start training. You can set up your training style and gym now.';

// Privacy & safety document chrome // [ATTORNEY]
export const PRIVACY_SAFETY_TITLE = 'Privacy & safety';
export const PRIVACY_SAFETY_SUB_ADULT = 'Health and AI are optional. The safety notice is required.';
export const PRIVACY_SAFETY_SUB_TEEN = 'Health and AI stay off until you and your parent both agree. The safety notice is required.';
export const SECTION_HEALTH = 'Health data';
export const SECTION_AI = 'AI planning';
export const SECTION_SAFETY = 'Safety notice';
export const SECTION_PARENT_OPTIONAL = 'Choose separately · optional';
export const HEALTH_POLICY_LINK_LABEL = 'Consumer Health Data Privacy Policy';
export const HINT_OPTIONAL = 'You can continue with this off. Free logging stays available.'; // [ATTORNEY]
export const HINT_PRIVACY = 'Check the box to continue. Health and AI can stay off.'; // [ATTORNEY]
export const HINT_PARENT_PRIVACY = 'Check the terms and the safety notice to link. Health, AI and coach sharing stay off unless you choose them.'; // [ATTORNEY]

/** Health section on Privacy & safety: Counsel #1 version (HEALTH_TEXT + the injury-category sentence). */ // [ATTORNEY]
export const HEALTH_AI_SENTENCE =
  'If you also turn on AI planning, we use this health info to help the AI avoid or swap exercises that may not fit you. From your health info, Anthropic, our AI provider, receives only an injury category, never your notes, measurements, name, or email.';
export const HEALTH_TEXT_WITH_AI = `${HEALTH_TEXT} ${HEALTH_AI_SENTENCE}`;

/** Adult AI = AI_TEXT_VERSION_B. Teen line is shown under the locked teen switch. */ // [ATTORNEY]
export const AI_TEEN_LINE = 'Your parent must also agree before this turns on, and either of you can turn it off.';

/**
 * "AI planning needs health info" explanation (Counsel phase3-build-answers.md §1, Nov 16, 2026).
 * Title and buttons kept. The explanation itself is not a consent. "Turn on health info" flips the
 * same visible health switch; the normal health consent row is logged on submit (version + hash).
 * AI still needs its own tap. [ATTORNEY]
 */
export const AI_NEEDS_HEALTH_TITLE = 'AI planning needs health info'; // [ATTORNEY]
export const AI_NEEDS_HEALTH_BODY =
  'AI planning checks your health-screen answers and uses any injury you add to avoid or swap exercises, so "Save my health info" has to be on first. From your health info, Anthropic, our AI provider, receives only an injury category, never your notes, measurements, name, or email. You can turn health info on now, or leave AI off.'; // [ATTORNEY]
/** Teen (16-17): adult text, then this sentence. */ // [ATTORNEY]
export const AI_NEEDS_HEALTH_TEEN_LINE = 'Your parent must also agree to both.';
export const AI_NEEDS_HEALTH_BODY_TEEN = `${AI_NEEDS_HEALTH_BODY} ${AI_NEEDS_HEALTH_TEEN_LINE}`;
export const AI_NEEDS_HEALTH_ACTION = 'Turn on health info'; // [ATTORNEY]
export const AI_NEEDS_HEALTH_DISMISS = 'Not now'; // [ATTORNEY]
export const aiNeedsHealthBody = (audience: 'adult' | 'teen'): string =>
  audience === 'teen' ? AI_NEEDS_HEALTH_BODY_TEEN : AI_NEEDS_HEALTH_BODY;
/** Parent-voice version. ${teen} is the teen's first name, or "your teen". */ // [ATTORNEY]
export const parentAiNeedsHealthBody = (n: ParentNames = {}): string => {
  const teen = teenOf(n);
  return `AI planning checks ${teen}'s health-screen answers and uses any injury ${teen} adds to avoid or swap exercises, so the health box has to be on first. From that health info, Anthropic, our AI provider, receives only an injury category, never ${teen}'s notes, measurements, name, or email. You can turn it on now, or leave AI off.`;
};

/** Safety-notice card, adult and teen (Counsel phase3-review #2, incl. emergency stop signs). The UI uppercases the headings. */ // [ATTORNEY]
export const RISK_HEADING_NOT_MEDICAL = 'This is not medical advice';
export const RISK_HEADING_RISKS = 'Exercise has risks';
export const RISK_BODY_NOT_MEDICAL = fill(
  "[App] creates training plans and logs for general fitness. It isn't medical care, a diagnosis, or a treatment plan, and it isn't a substitute for advice from a doctor or other qualified professional. Talk to a professional before you start or change a program, especially if you have an injury, a health condition, or you're returning to training.",
);
export const RISK_BODY_RISKS =
  "Strength training and conditioning can cause injury. You choose to take part, and you control how you train: check that a plan fits you, use equipment safely, and stop if something hurts. If anything feels wrong, stop and see a professional. Stop right away and get medical help if you have chest pain, fainting or dizziness, or trouble breathing. In an emergency, call 911.";
export const RISK_CHECKBOX_TEXT = "I understand this is not medical advice, and I understand the risks of exercise.";

// ───────────── Parent-voice texts: take the teen's name (and the parent's) ─────────────

export type ParentNames = {
  /** Teen's first name as the parent knows it. Falls back to "your teen". */
  teenName?: string | null;
  /** Teen's full name, for the attestation. Falls back to teenName. */
  teenFullName?: string | null;
  /** The parent's own name, for the attestation. Omitted from the sentence when unknown. */
  parentName?: string | null;
};
const clean = (s: string | null | undefined) => (s ?? '').trim().slice(0, 80);
const teenOf = (n: ParentNames) => clean(n.teenName) || 'your teen';
const poss = (name: string) => `${name}'s`;
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const they = (_name: string) => 'they'; // neutral: the teen's pronouns are not known

/** Parent attestation (Counsel §12, placeholders filled as in the Paper generator). [ATTORNEY] */
export function parentAttestationText(n: ParentNames = {}): string {
  const teen = teenOf(n);
  const full = clean(n.teenFullName) || teen;
  const me = clean(n.parentName);
  return fill(
    `I am ${me ? `${me}, ` : ''}18 or older, and the parent or legal guardian of ${full} with authority to agree for them. ` +
      `I agree to [App]'s Terms (draft) and Privacy Policy (draft) as the contracting party for ${poss(teen)} account, and I'm responsible for purchases I approve. ` +
      `I understand ${teen} is 16–17 and will have: text-only coach chat that I can read, no progress-photo uploads, form checks shared only as skeleton and numbers, no weight-loss or calorie goals, and live sessions only with my invite. ` +
      `Separately, I choose each option below. ${cap(teen)} must also agree to each. ` +
      `I can view ${poss(teen)} data and change or withdraw any choice anytime in Parent Settings, and ${teen} will be told when I do.`,
  );
}

export function parentLinkSubtitle(n: ParentNames = {}): string {
  return `You're linking to ${poss(clean(n.teenFullName) || teenOf(n))} account.`;
}

/** Parent health box (Counsel-approved with fixes; the parent-voice paragraph itself is an [ATTORNEY] draft). */
export function parentHealthText(n: ParentNames = {}): string {
  const teen = teenOf(n);
  return fill(
    `Let [App] collect and store ${poss(teen)} body weight, measurements, injury and pain notes, health-screen answers, form-check numbers, and training data, only to build and adjust workouts, show progress, and keep plans safe. ` +
      `It's encrypted, never sold, never used for ads. Shared only with service providers who process it for us under contract. ` +
      `If AI planning is also on, Anthropic receives only an injury category from this health info. ${cap(teen)} must also agree. ` +
      `You can turn it off in Parent Settings and ${teen} can in Settings › Privacy, and either of you can delete it. ${cap(teen)} will be told when you change it.`,
  );
}

/** Parent AI box. Same as AI_TEXT_PARENT when the teen's name is unknown. */
export function parentAiText(n: ParentNames = {}): string {
  const teen = teenOf(n);
  return fill(
    `Let [App] send Anthropic, our AI provider, ${poss(teen)} goals, experience, equipment, age range, and injury category (no name, email, photos, or location) to create and adapt ${poss(teen)} plan. ${AI_B_RETENTION_AND_TRAINING} ${cap(teen)} must also agree. You or ${teen} can turn it off anytime; ${poss(teen)} saved plan stays but stops adapting.`,
  );
}

/** Parent coach-sharing box: Counsel's REQUIRED version. No health items. */
export function parentCoachText(n: ParentNames = {}): string {
  const teen = teenOf(n);
  return `Let ${poss(teen)} independent coach see ${poss(teen)} workouts, history, PRs, and charts so they can coach ${teen}. Coaches never see ${poss(teen)} health info (weight, measurements, injury or pain notes, health-screen answers). Videos are never shared; form checks show only skeleton and numbers. ${cap(teen)} must also agree. Either of you can turn this off anytime, and access stops immediately.`;
}

/** Parent risk card, third person (Counsel phase3-review #2). */
export function parentRiskCard(n: ParentNames = {}) {
  const teen = teenOf(n);
  return {
    headingNotMedical: RISK_HEADING_NOT_MEDICAL,
    headingRisks: RISK_HEADING_RISKS,
    bodyNotMedical: fill(
      `[App] creates training plans and logs for general fitness. It isn't medical care, a diagnosis, or a treatment plan, and it isn't a substitute for advice from a doctor or other qualified professional. Talk to a professional before ${teen} starts or changes a program, especially if ${teen} has an injury, a health condition, or is returning to training.`,
    ),
    bodyRisks: `Strength training and conditioning can cause injury. ${cap(teen)} chooses to take part, and ${teen} controls how ${they(teen)} train: check that a plan fits ${teen}, use equipment safely, and stop if something hurts. If anything feels wrong for ${teen}, stop and see a professional. Stop right away and get medical help if ${teen} has chest pain, fainting or dizziness, or trouble breathing. In an emergency, call 911.`,
    checkbox: `I have read this notice and talked with ${teen} about these risks. I understand this is not a waiver of ${poss(teen)} legal rights.`,
  };
}

export function adultRiskCard() {
  return {
    headingNotMedical: RISK_HEADING_NOT_MEDICAL,
    headingRisks: RISK_HEADING_RISKS,
    bodyNotMedical: RISK_BODY_NOT_MEDICAL,
    bodyRisks: RISK_BODY_RISKS,
    checkbox: RISK_CHECKBOX_TEXT,
  };
}

/** Coach general attestation (Counsel phase3-build-answers.md §2). [Company] and [Coach Terms] stay as placeholders. [ATTORNEY] */
export const COACH_ATTEST_GENERAL_INTRO = 'I confirm that:';
export const COACH_ATTEST_GENERAL_BULLETS = [
  "I'm 18 or older, and everything in my application is true.",
  "I'm an independent coach, not an employee of [Company]. I sell my 1:1 coaching myself, as the seller of record, through my own Stripe account, and I handle my own refunds, chargebacks, and taxes.",
  "I won't give medical advice, diagnose or treat injuries or conditions, or call myself a doctor, physical therapist, or dietitian unless I'm licensed as one.",
  "I'll see a client's info only if they share it with me. I'll never ask for a 16–17 client's health info, and I'll see an adult's health answers only if they choose to share them.",
  "I'll keep client info confidential, use it only to coach that client, and not copy it out of [App]. If the client, their parent, or [Company] asks, I'll delete any notes or copies I kept outside [App] and confirm when it's done.",
  'I agree to the [Coach Terms] and the [App] Terms of Service.',
] as const;
export const COACH_ATTEST_GENERAL = fill(
  [COACH_ATTEST_GENERAL_INTRO, ...COACH_ATTEST_GENERAL_BULLETS.map((b) => `- ${b}`)].join('\n'),
);

/** 16-17 box. Optional; gates minor clients only together with NSOPW + training. [ATTORNEY] */
export const COACH_ATTEST_MINORS_INTRO = 'I want to coach 16–17-year-olds, and I agree that:';
export const COACH_ATTEST_MINORS_BULLETS = [
  '[Company] will run a National Sex Offender Public Website (NSOPW) search on me before approving me, and I\'ll complete Texas child-abuse reporting training first.',
  "If I believe a child is being abused or neglected, I'll report it as Texas law requires (Texas Family Code chapter 261), and also use [App]'s report tools.",
  "I'll talk with minor clients only by text in [App] chat, which their parent can read and which is filtered and reviewed. I won't message between 10 pm and 7 am, never contact a minor client outside [App], and won't try to get around the filters.",
  "Live sessions with minors happen only in [App], with their parent invited, and I'll never record them.",
  "I'll never see or ask for a minor client's health info, photos, or videos, and I won't give them weight-loss, calorie, body-size, bulking, or supplement advice.",
] as const;
export const COACH_ATTEST_MINORS = fill(
  [COACH_ATTEST_MINORS_INTRO, ...COACH_ATTEST_MINORS_BULLETS.map((b) => `- ${b}`)].join('\n'),
);

// ───────────── Versions + hashes for each exact text shown ─────────────

export type LegalText = { version: string; text: string };

const joinRisk = (c: ReturnType<typeof adultRiskCard>) => [c.headingNotMedical, c.bodyNotMedical, c.headingRisks, c.bodyRisks, c.checkbox].join('\n\n');

/** The exact text + version id for each consent item. Hash with `legalTextHash` at the moment of the grant. */
export const legalTexts = {
  terms: (): LegalText => ({ version: VERSIONS.terms, text: TERMS_CHECKBOX_TEXT }),
  health: (): LegalText => ({ version: VERSIONS.healthWithAi, text: HEALTH_TEXT_WITH_AI }),
  aiAdult: (): LegalText => ({ version: VERSIONS.aiB, text: AI_TEXT_VERSION_B }),
  aiTeen: (): LegalText => ({ version: VERSIONS.aiTeen, text: AI_TEXT_TEEN }),
  riskAdult: (): LegalText => ({ version: VERSIONS.riskAdult, text: joinRisk(adultRiskCard()) }),
  riskParent: (n: ParentNames = {}): LegalText => {
    const c = parentRiskCard(n);
    return { version: VERSIONS.riskParent, text: joinRisk(c) };
  },
  parentAttest: (n: ParentNames = {}): LegalText => ({ version: VERSIONS.parentAttest, text: parentAttestationText(n) }),
  parentHealth: (n: ParentNames = {}): LegalText => ({ version: VERSIONS.parentHealth, text: parentHealthText(n) }),
  parentAi: (n: ParentNames = {}): LegalText => ({ version: VERSIONS.aiParent, text: parentAiText(n) }),
  parentCoach: (n: ParentNames = {}): LegalText => ({ version: VERSIONS.parentCoach, text: parentCoachText(n) }),
  coachAttestGeneral: (): LegalText => ({ version: VERSIONS.coachAttestGeneral, text: COACH_ATTEST_GENERAL }),
  coachAttestMinors: (): LegalText => ({ version: VERSIONS.coachAttestMinors, text: COACH_ATTEST_MINORS }),
} as const;

/** SHA-256 hex of the exact text shown. */
export const legalTextHash = (t: LegalText): Promise<string> => sha256Hex(t.text);
export { sha256Hex };

// ───────────────────────────── Phase 3 account flow copy (UI job A) ─────────────────────────────
// Source: paper/onb.py + paper/onb_dob.py (curly apostrophes as in the Paper renders). Neutral: no age, no cutoff. [ATTORNEY]
export const DOB_TITLE = 'When were you born?'; // [ATTORNEY]
export const DOB_SUB = 'We use this to set up your account.'; // [ATTORNEY]
export const DOB_PRIVACY_NOTE = 'We don’t save your date of birth. We only keep a general age range.'; // [ATTORNEY]
export const DOB_HINT_OFF = 'Enter month, day and year to continue'; // [ATTORNEY]
export const PARENT_HELP_TITLE = 'A parent or guardian needs to help'; // [ATTORNEY]
export const PARENT_HELP_SUB = 'They have to link to your account and agree before it’s fully active.'; // [ATTORNEY]
export const PARENT_HELP_BULLETS = [
  'You can create a limited account and sign in.',
  'Purchases stay off until they link.',
  'If they don’t link within 14 days, we’ll delete the account. We’ll remind you on day 3 and day 7.',
  'They’ll be able to see your training and privacy choices. We’ll tell you if they change a setting.',
] as const; // [ATTORNEY]
export const INVITE_TITLE = 'Invite a parent or guardian'; // [ATTORNEY]
export const INVITE_SUB = 'We’ll email them a link to review and confirm. We use their email only to send this invite.'; // [ATTORNEY]
export const INVITE_LABEL = 'Parent or guardian email'; // [ATTORNEY]
export const INVITE_HINT_OFF = 'Enter their email to send the invite'; // [ATTORNEY]
export const INVITE_SENT_TITLE = 'Invite sent'; // [ATTORNEY]
export const INVITE_SENT_BODY_AFTER_EMAIL = '. Next, create your account with Apple, Google or email so they can link to it.'; // [ATTORNEY]
export const INVITE_SENT_NOTE =
  'Your account stays limited until they accept — no purchases, and no workout or health data yet. If they don’t link within 14 days, we’ll delete the account and this invite. We’ll remind you on day 3 and day 7.'; // [ATTORNEY]
