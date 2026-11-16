/**
 * Goal lists (Setup step 5). Pure data.
 *
 * Adult goals go to the server as a plain enum (+ pace). Body weights NEVER go to the server from here:
 * they are health data and live in deviceSetupStore until the health switch is on.
 *
 * Minor-safe list: APPROVED by Counsel (legal/phase4-review.md #1). No weights, no pace, no lose/gain,
 * no calories. The server allowlist must match these ids. [ATTORNEY]
 */
export const ADULT_GOAL_IDS = ['lose', 'gain', 'maintain'] as const;
export type AdultGoalId = (typeof ADULT_GOAL_IDS)[number];

export const ADULT_GOALS: readonly { id: AdultGoalId; label: string; description: string }[] = [
  { id: 'lose', label: 'Lose', description: 'Cut body fat' },
  { id: 'gain', label: 'Gain', description: 'Build size' },
  { id: 'maintain', label: 'Maintain', description: 'Hold steady' },
];

export const PACE_IDS = ['steady', 'moderate', 'fast'] as const;
export type PaceId = (typeof PACE_IDS)[number];

export const PACES: readonly { id: PaceId; label: string; lbPerWeek: number }[] = [
  { id: 'steady', label: 'Steady', lbPerWeek: 0.25 },
  { id: 'moderate', label: 'Moderate', lbPerWeek: 0.5 },
  { id: 'fast', label: 'Fast', lbPerWeek: 1.0 },
];
export const DEFAULT_PACE: PaceId = 'moderate';

export const MINOR_GOAL_IDS = ['general_fitness', 'build_strength', 'learn_lifts', 'endurance', 'sport_event', 'consistency'] as const;
export type MinorGoalId = (typeof MINOR_GOAL_IDS)[number];

// [ATTORNEY] approved wording (phase4-review #1)
export const MINOR_GOALS: readonly { id: MinorGoalId; label: string; description: string }[] = [
  { id: 'general_fitness', label: 'Get generally fitter', description: 'Feel stronger and more capable in everyday training.' },
  { id: 'build_strength', label: 'Build strength', description: 'Get stronger on the main lifts, without a weight target.' },
  { id: 'learn_lifts', label: 'Learn the lifts', description: 'Practice technique and build confidence with the movements.' },
  { id: 'endurance', label: 'Improve endurance', description: 'Go longer on runs, rows, rides or mixed sessions.' },
  { id: 'sport_event', label: 'Train for a sport or event', description: 'Prepare for a race, game or event — not a weight class cut.' },
  { id: 'consistency', label: 'Stay consistent', description: 'Show up on a simple weekly rhythm.' },
];

// [ATTORNEY]
export const MINOR_GOAL_HINT = "These goals don't include weight loss, calories, or body-fat targets.";

/** Skip, or Continue with nothing picked, for a minor. */
export const DEFAULT_MINOR_GOAL: MinorGoalId = 'general_fitness';

export function isMinorGoalId(v: unknown): v is MinorGoalId {
  return typeof v === 'string' && (MINOR_GOAL_IDS as readonly string[]).includes(v);
}
export function isAdultGoalId(v: unknown): v is AdultGoalId {
  return typeof v === 'string' && (ADULT_GOAL_IDS as readonly string[]).includes(v);
}
export function isPaceId(v: unknown): v is PaceId {
  return typeof v === 'string' && (PACE_IDS as readonly string[]).includes(v);
}

export function resolveMinorGoal(picked: string | null | undefined): MinorGoalId {
  return isMinorGoalId(picked) ? picked : DEFAULT_MINOR_GOAL;
}
