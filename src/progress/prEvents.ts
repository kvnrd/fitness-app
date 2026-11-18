/**
 * PR events fired when a set is logged. Types: heaviest lift, most reps at a
 * weight, and best e1RM (Epley, 10 reps or fewer). Teen body-weight PRs are
 * never emitted; route that rule through teenWeightPolicy.
 */
import { e1rmEstimate, e1rmLb, isWithinPrInputLimits, DEFAULT_E1RM_FORMULA, DEFAULT_E1RM_REP_CAP, type E1rmEstimate } from './e1rm.ts';
import { PR_MARGIN_LB } from './prs.ts';
import { allowTeenWeight } from './teenWeightPolicy.ts';

export type PrKind = 'heaviest_lift' | 'most_reps_at_weight' | 'best_e1rm';

export type LoggedStrengthSet = {
  exerciseId: string;
  weightLb: number;
  reps: number;
  /** True for bodyweight lifts (pull-ups, etc.). External load may still be 0. */
  bodyweightLift?: boolean;
  excludeFromPrs?: boolean;
};

export type PrEvent = { kind: PrKind; exerciseId: string; e1rm?: E1rmEstimate };

const E1RM_OPTS = { formula: DEFAULT_E1RM_FORMULA, cap: DEFAULT_E1RM_REP_CAP } as const;

export function prEventsForLoggedSet(
  set: LoggedStrengthSet,
  history: readonly LoggedStrengthSet[],
  opts: { isMinor: boolean },
): PrEvent[] {
  if (set.excludeFromPrs) return [];
  if (set.bodyweightLift && opts.isMinor && !allowTeenWeight('pr')) return [];
  if (!isWithinPrInputLimits(set.weightLb, set.reps) && !set.bodyweightLift) return [];

  const prior = history.filter((s) => s.exerciseId === set.exerciseId && !s.excludeFromPrs);
  const events: PrEvent[] = [];

  if (!set.bodyweightLift && isWithinPrInputLimits(set.weightLb, set.reps)) {
    const prevHeavy = prior.reduce((m, s) => (s.weightLb > m ? s.weightLb : m), 0);
    if (set.weightLb > prevHeavy) events.push({ kind: 'heaviest_lift', exerciseId: set.exerciseId });

    const prevRepsAtWeight = prior
      .filter((s) => s.weightLb === set.weightLb)
      .reduce((m, s) => (s.reps > m ? s.reps : m), 0);
    if (set.reps > prevRepsAtWeight) events.push({ kind: 'most_reps_at_weight', exerciseId: set.exerciseId });

    const e1rm = e1rmEstimate(set.weightLb, set.reps, { ...E1RM_OPTS, isMinor: opts.isMinor, bodyweightLift: set.bodyweightLift });
    if (e1rm != null) {
      let prevBest: number | null = null;
      for (const s of prior) {
        const v = e1rmEstimate(s.weightLb, s.reps, { ...E1RM_OPTS, isMinor: opts.isMinor, bodyweightLift: s.bodyweightLift });
        if (v != null && (prevBest == null || v.lb > prevBest)) prevBest = v.lb;
      }
      if (prevBest == null || e1rm.lb - prevBest > PR_MARGIN_LB) {
        events.push({ kind: 'best_e1rm', exerciseId: set.exerciseId, e1rm });
      }
    }
  }
  return events;
}
