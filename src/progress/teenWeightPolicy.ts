/**
 * Teen body-weight rules for recap, PR, and Progress code.
 *
 * Option 3 (Kevin, Nov 17): 16–17s see their own weight, history and trends
 * like adults. TEEN_WEIGHT_PROFILE_ONLY is false.
 *
 * FIXED rules (not flags): both health opt-ins gate teen weight; coaches never
 * see a minor's weight or health info; volume and PRs are never computed from
 * a teen's body weight; recaps never show teen weight change.
 *
 * Kevin-decidable flags live in phase5bFlags.ts.
 */
import { TEEN_WEIGHT_EXISTS, TEEN_WEIGHT_PROFILE_ONLY } from './phase5Flags.ts';
import { teenAllowsGoalWeightOrLossAdvice, teenAllowsLossCelebrations, teenSupportLinkText } from './phase5bFlags.ts';

export type TeenWeightUse =
  | 'profile_current'
  | 'progress_card'
  | 'home_card'
  | 'trend'
  | 'recap'
  | 'pr'
  | 'volume'
  | 'calculation';

/** Option 3 is in force: teens see history and trends like adults, except the fixed rules. */
export function teenWeightTreatedAsAdult(): boolean {
  return TEEN_WEIGHT_PROFILE_ONLY === false;
}

export function allowTeenWeight(use: TeenWeightUse): boolean {
  if (!TEEN_WEIGHT_EXISTS) return false;
  // Fixed: never compute volume/PRs from a teen's body weight; recaps never show weight change.
  if (use === 'calculation' || use === 'volume' || use === 'pr' || use === 'recap') return false;
  if (TEEN_WEIGHT_PROFILE_ONLY) return use === 'profile_current';
  return use === 'profile_current' || use === 'progress_card' || use === 'home_card' || use === 'trend';
}

export function mayUseTeenBodyWeightInCalculations(): boolean {
  return allowTeenWeight('calculation');
}

/** Fixed: teen weight requires both the teen's and the parent's health opt-ins. */
export function teenWeightRequiresBothHealthOptIns(): true {
  return true;
}

export function teenMayHaveWeightGoal(): boolean {
  return teenAllowsGoalWeightOrLossAdvice();
}

export function teenMaySeeLossCelebrations(): boolean {
  return teenAllowsLossCelebrations();
}

export function teenChartSupportLink(): string | null {
  return teenSupportLinkText();
}
