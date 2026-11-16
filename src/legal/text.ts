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
export const APP_NAME = 'Fitness App';

const fill = (s: string) => s.replace(/\[App\]/g, APP_NAME);

/** Generic rejection notice. No age, no threshold, no retry option. */
export const REJECTION_NOTICE = fill("Sorry, you can't use [App]. Nothing you entered has been saved.");

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
} as const;
