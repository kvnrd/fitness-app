/**
 * Kevin-decidable Phase 5b teen-safeguard flags. Each is a single switch:
 * flipping the constant changes behavior with no rework.
 *
 * Kevin, Nov 17: all three optional flags are OFF.
 * Tests pass an override so both states stay covered.
 *
 * These are separate from the FIXED rules in teenWeightPolicy.ts
 * (both health opt-ins, coaches never see a minor's weight or health info,
 * nothing is calculated from a teen's body weight, and teens never get an
 * e1RM from body-weight loads). Progress photos stay 18+ on the server.
 */

/** When true: no goal weight and no weight-loss advice for teens. Kevin: off. */
export const TEEN_NO_GOAL_WEIGHT_OR_LOSS_ADVICE: boolean = false;

/** When true: no loss celebrations, badges, streaks, weight PRs or weigh-in reminders for teens. Kevin: off. */
export const TEEN_NO_LOSS_CELEBRATIONS: boolean = false;

/** When true: show the NEDA/988 support link by the teen chart. Kevin: off. */
export const TEEN_SUPPORT_LINK: boolean = false;

/** Counsel-suggested body-neutral support line (phase5-review.md, Option 3). Used only when the flag is on. */
export const TEEN_WEIGHT_SUPPORT_LINK_TEXT =
  'Want support? Take a free screening at NEDA (nationaleatingdisorders.org), or call or text 988, the Suicide & Crisis Lifeline.';

export function teenAllowsGoalWeightOrLossAdvice(flag: boolean = TEEN_NO_GOAL_WEIGHT_OR_LOSS_ADVICE): boolean {
  return flag === false;
}

export function teenAllowsLossCelebrations(flag: boolean = TEEN_NO_LOSS_CELEBRATIONS): boolean {
  return flag === false;
}

export function teenSupportLinkText(flag: boolean = TEEN_SUPPORT_LINK): string | null {
  return flag ? TEEN_WEIGHT_SUPPORT_LINK_TEXT : null;
}
