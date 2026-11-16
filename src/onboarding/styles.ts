/**
 * Training styles (Setup step 6) and their follow-ups. Pure logic. Source: onboarding-notes.md "Training style step".
 * Server allowlist: hybrid, hyrox, bodybuilding, powerlifting, crossfit, general.
 */
export const STYLE_IDS = ['hybrid', 'hyrox', 'bodybuilding', 'powerlifting', 'crossfit', 'general'] as const;
export type StyleId = (typeof STYLE_IDS)[number];

export const STYLES: readonly { id: StyleId; label: string; description: string }[] = [
  { id: 'hybrid', label: 'Hybrid', description: 'Lift and condition in one plan.' },
  { id: 'hyrox', label: 'Hyrox', description: 'Race prep — running and stations.' },
  { id: 'bodybuilding', label: 'Bodybuilding', description: 'Muscle growth, isolation and physique.' },
  { id: 'powerlifting', label: 'Powerlifting', description: 'Squat, bench and deadlift strength.' },
  { id: 'crossfit', label: 'CrossFit-style', description: 'High-intensity workouts and skills.' },
  { id: 'general', label: 'General fitness', description: 'A balanced plan to stay consistent.' },
];

export const DEFAULT_STYLE: StyleId = 'general';
export const DAYS_MIN = 2;
export const DAYS_MAX = 7;
export const DEFAULT_DAYS = 4;

export type StyleSelection = { styles: StyleId[]; main: StyleId | null };

export const EMPTY_SELECTION: StyleSelection = { styles: [], main: null };

const order = (ids: Iterable<StyleId>): StyleId[] => STYLE_IDS.filter((id) => new Set(ids).has(id));

/** Tap a style: select (first pick becomes Main) or unselect (if Main, Main moves to the first remaining in list order). */
export function toggleStyle(sel: StyleSelection, id: StyleId): StyleSelection {
  if (sel.styles.includes(id)) {
    const styles = sel.styles.filter((s) => s !== id);
    const main = sel.main === id ? (order(styles)[0] ?? null) : sel.main;
    return { styles: order(styles), main };
  }
  const styles = order([...sel.styles, id]);
  return { styles, main: sel.main ?? id };
}

/** "Set as main" on an already selected style; ignored otherwise. */
export function setMain(sel: StyleSelection, id: StyleId): StyleSelection {
  return sel.styles.includes(id) ? { styles: sel.styles, main: id } : sel;
}

export const canContinueStyles = (sel: StyleSelection): boolean => sel.styles.length > 0 && sel.main != null && sel.styles.includes(sel.main);

/** Skip on the picker: General fitness as Main (follow-up defaults apply, days 4). */
export function skipSelection(): StyleSelection {
  return { styles: [DEFAULT_STYLE], main: DEFAULT_STYLE };
}

// ───────────── follow-ups ─────────────

export const HYROX_DIVISIONS = ['open', 'pro', 'doubles'] as const;
export type HyroxDivision = (typeof HYROX_DIVISIONS)[number];
export const BODY_FOCUS = ['chest', 'back', 'legs', 'shoulders', 'arms', 'glutes'] as const;
export type BodyFocus = (typeof BODY_FOCUS)[number];
export const CROSSFIT_LEVELS = ['beginner', 'intermediate', 'experienced'] as const;
export type CrossfitLevel = (typeof CROSSFIT_LEVELS)[number];

export type Maxes = { squat: number | null; bench: number | null; deadlift: number | null };

export type Followups = {
  daysPerWeek: number;
  /** Hybrid: share of the week that is running, 0-100 (default 50 = even). */
  hybridRunPct: number;
  hyroxRaceDate: string | null; // YYYY-MM-DD, optional
  hyroxDivision: HyroxDivision;
  /** Empty = Balanced. */
  bodyFocus: BodyFocus[];
  powerCompete: boolean;
  powerMaxes: Maxes;
  crossfitLevel: CrossfitLevel;
};

export function defaultFollowups(): Followups {
  return {
    daysPerWeek: DEFAULT_DAYS,
    hybridRunPct: 50,
    hyroxRaceDate: null,
    hyroxDivision: 'open',
    bodyFocus: [],
    powerCompete: false,
    powerMaxes: { squat: null, bench: null, deadlift: null },
    crossfitLevel: 'intermediate',
  };
}

export const clampDays = (n: number): number => Math.min(DAYS_MAX, Math.max(DAYS_MIN, Math.round(Number.isFinite(n) ? n : DEFAULT_DAYS)));

/** Picking body areas deselects Balanced; clearing returns to Balanced (empty list). */
export function toggleFocus(current: BodyFocus[], f: BodyFocus): BodyFocus[] {
  const next = current.includes(f) ? current.filter((x) => x !== f) : [...current, f];
  return BODY_FOCUS.filter((x) => next.includes(x));
}

/** Which follow-up sections to show for the picked styles ('general' has none; days per week is always shown). */
export function followupSections(sel: StyleSelection): StyleId[] {
  return sel.styles.filter((s) => s !== 'general');
}
