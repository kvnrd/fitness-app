/**
 * End-of-workout recap data (no UI). Volume is weight × reps for loaded lifts
 * only; bodyweight lifts show reps. Everyone uses a planned-workouts streak,
 * shown only when n ≥ 2, with the same two strings (Kevin, Nov 17: teens get
 * adult streaks). There is no streak-break or freeze copy, and no streak push
 * notifications. Teens: no weight in the recap, and nothing is calculated from
 * a teen's body weight (teenWeightPolicy).
 */
import { allowTeenWeight, mayUseTeenBodyWeightInCalculations } from './teenWeightPolicy.ts';
import { teenAllowsLossCelebrations } from './phase5bFlags.ts';

export type RecapSet = {
  bodyweightLift: boolean;
  /** External load only. Never a person's body weight. */
  weightLb?: number | null;
  reps: number;
};

export type PlannedWeek = {
  /** ISO date (Monday) of the week. Oldest first when scoring a streak. */
  weekStart: string;
  plannedDays: readonly string[];
  completedDays: readonly string[];
};

export type RecapWeight = { changed: boolean; value?: number } | null;

export type RecapStreakLine = { title: string; body: string } | null;

export function recapVolume(sets: readonly RecapSet[], opts: { isMinor: boolean }): {
  loadedVolumeLb: number;
  bodyweightReps: number;
} {
  let loadedVolumeLb = 0;
  let bodyweightReps = 0;
  for (const s of sets) {
    if (s.bodyweightLift) {
      void mayUseTeenBodyWeightInCalculations();
      bodyweightReps += s.reps;
      continue;
    }
    if (typeof s.weightLb === 'number' && s.weightLb > 0 && s.reps > 0) {
      loadedVolumeLb += s.weightLb * s.reps;
    }
  }
  return { loadedVolumeLb, bodyweightReps };
}

/** Counsel U4. Fine for teens because volume is never computed from body weight. */
export function bodyweightRepsNotInVolumeCopy(n: number): string {
  if (n === 1) return 'Plus 1 body-weight rep, not counted in volume.';
  return `Plus ${n} body-weight reps, not counted in volume.`;
}

export function weekPlanHit(week: PlannedWeek): boolean {
  if (week.plannedDays.length === 0) return false;
  const done = new Set(week.completedDays);
  return week.plannedDays.every((d) => done.has(d));
}

/** Consecutive weeks in which every planned workout was hit, counted from the end of a chronological list. */
export function plannedWorkoutStreak(weeksOldestFirst: readonly PlannedWeek[]): number {
  let n = 0;
  for (let i = weeksOldestFirst.length - 1; i >= 0; i--) {
    if (!weekPlanHit(weeksOldestFirst[i]!)) break;
    n += 1;
  }
  return n;
}

/** @deprecated Use plannedWorkoutStreak. */
export function workoutStreak(weeksOldestFirst: readonly PlannedWeek[]): number {
  return plannedWorkoutStreak(weeksOldestFirst);
}

/** Same planned-workouts streak for teens and adults (Kevin, Nov 17). */
export function recapStreakCount(weeks: readonly PlannedWeek[]): number {
  return plannedWorkoutStreak(weeks);
}

/**
 * Planned-workouts line only when n ≥ 2 (Counsel U1). Same copy for teens and adults.
 */
export function recapStreakLine(n: number): RecapStreakLine {
  if (n < 2) return null;
  return {
    title: `${n}-week streak`,
    body: `You’ve hit your planned workouts ${n} weeks in a row.`,
  };
}

export function recapAllowsWeight(isMinor: boolean): boolean {
  if (!isMinor) return true;
  return allowTeenWeight('recap');
}

/** Loss copy is withheld for everyone; teens must never receive it. */
export function recapLossCopy(_isMinor: boolean): null {
  return null;
}

export function teenLossCelebrationAllowed(isMinor: boolean): boolean {
  if (!isMinor) return true;
  return teenAllowsLossCelebrations();
}

export function teenWeighInReminderAllowed(isMinor: boolean): boolean {
  return teenLossCelebrationAllowed(isMinor);
}

export function teenWeightPrAllowed(isMinor: boolean): boolean {
  return teenLossCelebrationAllowed(isMinor);
}

export function buildWorkoutRecap(opts: {
  isMinor: boolean;
  sets: readonly RecapSet[];
  weeks: readonly PlannedWeek[];
  weight?: RecapWeight;
}): {
  loadedVolumeLb: number;
  bodyweightReps: number;
  bodyweightRepsCopy: string | null;
  streakWeeks: number;
  streakLine: RecapStreakLine;
  weight: RecapWeight;
  lossCopy: null;
} {
  const vol = recapVolume(opts.sets, { isMinor: opts.isMinor });
  const streakWeeks = recapStreakCount(opts.weeks);
  return {
    ...vol,
    bodyweightRepsCopy: vol.bodyweightReps > 0 ? bodyweightRepsNotInVolumeCopy(vol.bodyweightReps) : null,
    streakWeeks,
    streakLine: recapStreakLine(streakWeeks),
    weight: recapAllowsWeight(opts.isMinor) ? (opts.weight ?? null) : null,
    lossCopy: recapLossCopy(opts.isMinor),
  };
}
