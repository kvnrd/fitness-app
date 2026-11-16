import { cleanGymName, defaultGym, type GymDraft, type GymMaxes } from './equipment.ts';
import { DEFAULT_PACE, isAdultGoalId, isPaceId, resolveMinorGoal, type AdultGoalId, type PaceId } from './goals.ts';
import { cleanAccent, defaultPrefs, type Prefs } from './prefs.ts';
import {
  clampDays,
  defaultFollowups,
  skipSelection,
  type Followups,
  type Maxes,
  type StyleSelection,
} from './styles.ts';

/**
 * Builds the JSON for the server's public.save_training_setup(jsonb).
 *
 * NEVER includes body weights (current/target weight): those are health data and stay in deviceSetupStore.
 * The server rejects unknown keys, so this builder only emits the allowlisted ones.
 * Numeric maxes (gym + powerlifting) are sent as entered, in the draft's `units` (lb or kg).
 * Minors: goal is always one of the minor-safe ids, goal_pace is always null.
 */
export type SetupDraft = {
  /** Adult goal id, or (for minors) a minor-safe id; null = not chosen. */
  goal: string | null;
  pace: PaceId | null;
  selection: StyleSelection;
  followups: Followups;
  gym: GymDraft;
  prefs: Prefs;
};

export function defaultDraft(): SetupDraft {
  return { goal: null, pace: null, selection: skipSelection(), followups: defaultFollowups(), gym: defaultGym(), prefs: defaultPrefs() };
}

export type SetupPayload = {
  goal: string | null;
  goal_pace: PaceId | null;
  styles: string[];
  main_style: string;
  days_per_week: number;
  followups: {
    hybrid?: { run_lift_pct: number };
    hyrox?: { race_date: string | null; division: string };
    bodybuilding?: { focus: string[] };
    powerlifting?: { compete: boolean; maxes: Partial<Maxes> | null };
    crossfit?: { experience: string };
  };
  gym: { name: string; preset: string; items: string[]; maxes: GymMaxes | null };
  units: string;
  distance: string;
  accent: string;
};

const num = (v: unknown, min: number, max: number): number | null =>
  typeof v === 'number' && Number.isFinite(v) ? Math.min(max, Math.max(min, Math.round(v))) : null;

function maxesOut(m: Maxes): Partial<Maxes> | null {
  const out: Partial<Maxes> = {};
  for (const k of ['squat', 'bench', 'deadlift'] as const) {
    const v = num(m[k], 1, 2000);
    if (v != null) out[k] = v;
  }
  return Object.keys(out).length ? out : null;
}

function gymMaxesOut(items: readonly string[], m: GymMaxes): GymMaxes | null {
  const out: GymMaxes = {};
  for (const k of ['barbell', 'dumbbells', 'kettlebells'] as const) {
    const v = num(m[k], 1, 1500);
    if (v != null && items.includes(k)) out[k] = v; // a cap only makes sense for equipment the gym has
  }
  return Object.keys(out).length ? out : null;
}

export function buildSetupPayload(draft: SetupDraft, opts: { minor: boolean }): SetupPayload {
  const { selection, followups: f } = draft;
  const picked = selection.styles.length > 0 && selection.main && selection.styles.includes(selection.main) ? selection : skipSelection();
  const has = (s: string) => (picked.styles as string[]).includes(s);

  let goal: string | null;
  let pace: PaceId | null;
  if (opts.minor) {
    goal = resolveMinorGoal(draft.goal);
    pace = null;
  } else {
    goal = isAdultGoalId(draft.goal) ? (draft.goal as AdultGoalId) : null;
    // Pace only means something for lose/gain.
    pace = goal === 'lose' || goal === 'gain' ? (isPaceId(draft.pace) ? draft.pace : DEFAULT_PACE) : null;
  }

  const followups: SetupPayload['followups'] = {};
  if (has('hybrid')) followups.hybrid = { run_lift_pct: num(f.hybridRunPct, 0, 100) ?? 50 };
  if (has('hyrox')) {
    const d = f.hyroxRaceDate;
    followups.hyrox = { race_date: d && /^\d{4}-\d{2}-\d{2}$/.test(d) ? d : null, division: f.hyroxDivision };
  }
  if (has('bodybuilding')) followups.bodybuilding = { focus: f.bodyFocus.length ? [...f.bodyFocus] : ['balanced'] };
  if (has('powerlifting')) followups.powerlifting = { compete: !!f.powerCompete, maxes: maxesOut(f.powerMaxes) };
  if (has('crossfit')) followups.crossfit = { experience: f.crossfitLevel };

  const items = [...draft.gym.items];
  return {
    goal,
    goal_pace: pace,
    styles: [...picked.styles],
    main_style: picked.main as string,
    days_per_week: clampDays(f.daysPerWeek),
    followups,
    gym: { name: cleanGymName(draft.gym.name), preset: draft.gym.preset, items, maxes: gymMaxesOut(items, draft.gym.maxes) },
    units: draft.prefs.units,
    distance: draft.prefs.distance,
    accent: cleanAccent(draft.prefs.accent),
  };
}
