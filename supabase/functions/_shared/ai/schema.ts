// Fixed vocabularies. Everything that can reach the AI prompt is one of these values or a small
// integer: there is no free-text input path from the user to Anthropic (Counsel section 12/13).

export const INJURY_CATEGORIES = [
  'none', 'neck', 'shoulder', 'elbow_wrist_hand', 'upper_back', 'lower_back', 'hip', 'knee', 'ankle_foot', 'other',
] as const;
export type InjuryCategory = (typeof INJURY_CATEGORIES)[number];

export const GOALS = ['build_strength', 'build_muscle', 'general_fitness', 'endurance', 'mobility', 'sport_performance', 'lose_fat'] as const;
export type Goal = (typeof GOALS)[number];
/** 16-17: no weight-loss or calorie goals (Counsel, parental consent text). */
export const MINOR_BLOCKED_GOALS: readonly Goal[] = ['lose_fat'];

export const EXPERIENCE = ['beginner', 'intermediate', 'advanced'] as const;
export type Experience = (typeof EXPERIENCE)[number];

export const EQUIPMENT = ['none', 'dumbbells', 'barbell', 'kettlebell', 'machines', 'cables', 'bands', 'pullup_bar', 'bench', 'cardio_machine'] as const;
export type Equipment = (typeof EQUIPMENT)[number];

export const AGE_BANDS = ['16_17', '18_plus'] as const;
export type AgeBand = (typeof AGE_BANDS)[number];

export const DAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;

export function isOneOf<T extends string>(list: readonly T[], v: unknown): v is T {
  return typeof v === 'string' && (list as readonly string[]).includes(v);
}

/** What the app may send to the ai-plan function. Enums and integers only. */
export interface PlanRequest {
  goal: Goal;
  experience: Experience;
  equipment: Equipment[];
  daysPerWeek: number;
  sessionMinutes: number;
}

const REQUEST_KEYS = ['goal', 'experience', 'equipment', 'daysPerWeek', 'sessionMinutes'] as const;

export function parsePlanRequest(input: unknown): PlanRequest | null {
  if (input === null || typeof input !== 'object' || Array.isArray(input)) return null;
  const o = input as Record<string, unknown>;
  // Strict: any extra key (name, email, notes, photo, location, ...) rejects the whole request.
  if (Object.keys(o).some((k) => !(REQUEST_KEYS as readonly string[]).includes(k))) return null;
  if (!isOneOf(GOALS, o.goal) || !isOneOf(EXPERIENCE, o.experience)) return null;
  if (!Array.isArray(o.equipment) || o.equipment.length > EQUIPMENT.length || !o.equipment.every((e) => isOneOf(EQUIPMENT, e))) return null;
  const days = o.daysPerWeek, mins = o.sessionMinutes;
  if (typeof days !== 'number' || !Number.isInteger(days) || days < 1 || days > 7) return null;
  if (typeof mins !== 'number' || !Number.isInteger(mins) || mins < 15 || mins > 120) return null;
  return {
    goal: o.goal,
    experience: o.experience,
    equipment: [...new Set(o.equipment as Equipment[])],
    daysPerWeek: days,
    sessionMinutes: mins,
  };
}
