/**
 * Estimated 1RM. Configurable between Epley and Brzycki.
 *
 * Approved default: Epley with a 10-rep cap. Brzycki remains available as a setting.
 *
 *   Epley:   w × (1 + reps/30)
 *   Brzycki: w × 36 / (37 − reps)
 *
 * Weights are in pounds (canonical). Returns null when the set is not eligible.
 */

export type E1rmFormula = 'epley' | 'brzycki';

export const DEFAULT_E1RM_FORMULA: E1rmFormula = 'epley';
export const DEFAULT_E1RM_REP_CAP = 10;

/** Input limits so typos do not create fake PRs. */
export const PR_WEIGHT_LB = { min: 50, max: 700 } as const;
export const PR_REPS = { min: 1, max: 50 } as const;

export type E1rmOptions = {
  formula?: E1rmFormula;
  /** Inclusive max reps used for e1RM. Must be 1–36 so Brzycki stays defined. Default 10. */
  cap?: number;
};

export type StrengthSet = {
  weightLb: number;
  reps: number;
  excludeFromPrs?: boolean;
};

export function isWithinPrInputLimits(weightLb: number, reps: number): boolean {
  return (
    Number.isFinite(weightLb) &&
    Number.isFinite(reps) &&
    weightLb >= PR_WEIGHT_LB.min &&
    weightLb <= PR_WEIGHT_LB.max &&
    Number.isInteger(reps) &&
    reps >= PR_REPS.min &&
    reps <= PR_REPS.max
  );
}

export function resolveE1rmOptions(opts: E1rmOptions = {}): { formula: E1rmFormula; cap: number } {
  const formula = opts.formula ?? DEFAULT_E1RM_FORMULA;
  const cap = opts.cap ?? DEFAULT_E1RM_REP_CAP;
  if (formula !== 'epley' && formula !== 'brzycki') {
    throw new Error('unknown e1RM formula');
  }
  if (!Number.isInteger(cap) || cap < 1 || cap > 36) {
    throw new Error('e1RM rep cap must be an integer between 1 and 36');
  }
  return { formula, cap };
}

/**
 * e1RM for one set, or null if it is excluded, outside input limits, or over the rep cap.
 * Sets over the cap still count toward volume elsewhere; they do not get an e1RM.
 */
export function e1rmLb(weightLb: number, reps: number, opts: E1rmOptions = {}): number | null {
  const { formula, cap } = resolveE1rmOptions(opts);
  if (!isWithinPrInputLimits(weightLb, reps)) return null;
  if (reps > cap) return null;
  if (formula === 'epley') return weightLb * (1 + reps / 30);
  // Brzycki is undefined at 37+; the cap (≤36) keeps the denominator ≥ 1.
  return (weightLb * 36) / (37 - reps);
}

export function bestSetE1rmLb(sets: readonly StrengthSet[], opts: E1rmOptions = {}): number | null {
  let best: number | null = null;
  for (const s of sets) {
    if (s.excludeFromPrs) continue;
    const v = e1rmLb(s.weightLb, s.reps, opts);
    if (v != null && (best == null || v > best)) best = v;
  }
  return best;
}

export function topSetLb(sets: readonly StrengthSet[]): number | null {
  let best: number | null = null;
  for (const s of sets) {
    if (!isWithinPrInputLimits(s.weightLb, s.reps)) continue;
    if (best == null || s.weightLb > best) best = s.weightLb;
  }
  return best;
}

/** Σ w × reps for eligible sets (input limits apply; excludeFromPrs does not). */
export function sessionVolumeLb(sets: readonly StrengthSet[]): number {
  let n = 0;
  for (const s of sets) {
    if (!isWithinPrInputLimits(s.weightLb, s.reps)) continue;
    n += s.weightLb * s.reps;
  }
  return n;
}


/** Every e1RM value is an estimate and must be labeled as such in the data. */
export const E1RM_LABEL = 'Est. 1RM' as const;
export const E1RM_ACCESSIBILITY_LABEL = 'estimated 1 rep max' as const;

export type E1rmEstimate = {
  lb: number;
  estimated: true;
  label: typeof E1RM_LABEL;
  accessibilityLabel: typeof E1RM_ACCESSIBILITY_LABEL;
};

/**
 * Epley (default): load × (1 + reps/30), only for sets of 10 reps or fewer.
 * Teens never get an e1RM from body-weight loads.
 */
export function e1rmEstimate(
  weightLb: number,
  reps: number,
  opts: E1rmOptions & { isMinor?: boolean; bodyweightLift?: boolean } = {},
): E1rmEstimate | null {
  if (opts.isMinor && opts.bodyweightLift) return null;
  const lb = e1rmLb(weightLb, reps, opts);
  if (lb == null) return null;
  return { lb, estimated: true, label: E1RM_LABEL, accessibilityLabel: E1RM_ACCESSIBILITY_LABEL };
}
