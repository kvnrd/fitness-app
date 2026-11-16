/**
 * Plan-screen AI notice, EXACTLY as worded by Counsel (section 12 of the Phase 2 legal answers;
 * required by Anthropic Commercial Terms §D.3 and the Usage Policy AI-disclosure rules).
 * Do not edit the wording: supabase/functions/tests/ai.test.ts asserts it matches the server copy.
 *
 * The full sentence is always available. After the first session it may shrink to the short footer
 * (full text a tap away) but it never disappears (phase4-review #7). [ATTORNEY]
 */
export const AI_PLAN_NOTICE =
  "Made with AI. It can be wrong, so check that it fits you. It isn't medical advice. Stop and see a professional if anything hurts.";

/** One-line footer after the first session. Full verbatim remains a tap away. [ATTORNEY] */
export const AI_PLAN_NOTICE_SHORT = 'Made with AI. It can be wrong. Not medical advice.';

export const AI_PLAN_NOTICE_MORE = 'More';
