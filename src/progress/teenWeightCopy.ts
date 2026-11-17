/** Approved teen-weight SPEC rev 2 copy. Curly apostrophes (U+2019). */

export const WEIGHT_GATE_TITLE = 'Weight charts use Health data' as const;

/** 02b — teen’s own Health opt-in is off. */
export const WEIGHT_GATE_TEEN_OFF =
  'Health data is off, so weigh-ins aren’t saved or charted. You can change this in Profile › Privacy.' as const;

/** 02c and 20b — parent’s Health opt-in is off. Counsel redline, verbatim. */
export const WEIGHT_GATE_PARENT_OFF =
  'Your parent has Health data off, so weigh-ins aren’t saved or charted.' as const;

export const HOME_WEIGHT_CARD_TITLE = 'Weight' as const;
export const HOME_WEIGHT_PROGRESS_LINK = 'Progress' as const;

export const HEALTH_PILL_YOU_ON = 'You: On' as const;
export const HEALTH_PILL_YOU_OFF = 'You: Off' as const;
export const HEALTH_PILL_PARENT_ON = 'Parent: On' as const;
export const HEALTH_PILL_PARENT_OFF = 'Parent: Off' as const;

export const COACH_CLIENT_META = '16–17 · Weight isn’t shared · No photos' as const;
export const COACH_WEIGHT_NOT_SHARED = 'Weight isn’t shared' as const;
export const COACH_SHARING_LIMITS_TITLE = 'Sharing limits for 16–17' as const;
export const COACH_TEEN_CLIENT_NOTE =
  'You never see Sam’s weight or health info, including weight from Apple Health or Garmin. Progress photos aren’t available for anyone under 18.' as const;

export const GOAL_DIRECTION_LOSE = 'Lose' as const;
export const GOAL_DIRECTION_MAINTAIN = 'Maintain' as const;
export const GOAL_DIRECTION_GAIN = 'Gain' as const;
export const GOAL_DIRECTIONS = [GOAL_DIRECTION_LOSE, GOAL_DIRECTION_MAINTAIN, GOAL_DIRECTION_GAIN] as const;
export type GoalDirection = (typeof GOAL_DIRECTIONS)[number];

/** Training goal, not the weight-sheet direction. Adults only. */
export const LOSE_FAT_TRAINING_GOAL = 'Lose fat' as const;

export const WEIGHT_EMPTY_TITLE = 'No weigh-ins yet' as const;
export const WEIGHT_EMPTY_BODY =
  'Log your weight a few mornings a week. We smooth out day-to-day swings so you see the real trend.' as const;
export const WEIGHT_EMPTY_CTA = 'Log first weigh-in' as const;
export const WEIGHT_EMPTY_ALT = 'Or connect Apple Health in Profile' as const;
export const GOAL_EDIT = 'Edit' as const;
export const TREND_WEIGHT_LABEL = 'Trend weight' as const;
export const SAVE_GOAL = 'Save goal' as const;
export const CANCEL = 'Cancel' as const;

export function healthPills(selfOn: boolean, parentOn: boolean): { you: string; parent: string } {
  return {
    you: selfOn ? HEALTH_PILL_YOU_ON : HEALTH_PILL_YOU_OFF,
    parent: parentOn ? HEALTH_PILL_PARENT_ON : HEALTH_PILL_PARENT_OFF,
  };
}

export function gatedWeightBody(kind: 'gated_teen_off' | 'gated_parent_off'): string {
  return kind === 'gated_parent_off' ? WEIGHT_GATE_PARENT_OFF : WEIGHT_GATE_TEEN_OFF;
}
