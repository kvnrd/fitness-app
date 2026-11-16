/**
 * AI-plan quiz options and the request payload. Enums and integers only — nothing free-text
 * is sent to the ai-plan function (Counsel §13). Hybrid and Hyrox are first-class goals.
 * Teen list omits Lose fat / Muscle-as-size; "Build muscle" is strength and performance. [ATTORNEY]
 */
import type { AiEquipment, AiExperience, AiGoal, AiPlanRequest } from './aiPlan';

export const ADULT_QUIZ_GOALS: readonly { id: AiGoal; label: string }[] = [
  { id: 'build_strength', label: 'Strength' },
  { id: 'lose_fat', label: 'Lose fat' },
  { id: 'hybrid', label: 'Hybrid' },
  { id: 'hyrox', label: 'Hyrox' },
  { id: 'endurance', label: 'Endurance' },
  { id: 'build_muscle', label: 'Muscle' },
];

export const TEEN_QUIZ_GOALS: readonly { id: AiGoal; label: string }[] = [
  { id: 'build_strength', label: 'Strength' },
  { id: 'hybrid', label: 'Hybrid' },
  { id: 'hyrox', label: 'Hyrox' },
  { id: 'endurance', label: 'Endurance' },
  { id: 'build_muscle', label: 'Build muscle' },
];

export const quizGoals = (teen: boolean) => (teen ? TEEN_QUIZ_GOALS : ADULT_QUIZ_GOALS);

export const QUIZ_TITLE = 'Build your AI plan';
export const QUIZ_SUB_ADULT = 'After the health screen. Six short answers.';
export const QUIZ_SUB_TEEN =
  'Choose what you want to work on. Build muscle is about strength and performance. Weight-loss, size, calorie, and supplement goals aren’t shown.';
export const QUIZ_GOAL_CAP = 'Up to 2';
export const QUIZ_INJURY_CAP = 'One only';
export const QUIZ_GENERATE = 'Generate plan';
export const QUIZ_PRIVACY =
  'Anthropic, our AI provider, only receives your goals, experience, equipment, age range, and an injury category — ' +
  'never your name, email, photos, location, or injury notes. The category is used only to avoid or swap exercises, not to build a rehab or treatment plan.';

export const EXPERIENCE_OPTIONS: readonly { id: AiExperience; label: string }[] = [
  { id: 'beginner', label: 'New' },
  { id: 'intermediate', label: '1–3 years' },
  { id: 'advanced', label: '3+ years' },
];

export const DAYS_PER_WEEK = [2, 3, 4, 5, 6] as const;
export const SESSION_MINUTES = [30, 40, 50, 60, 75] as const;

export type QuizEquipmentId = 'full_gym' | 'dumbbells' | 'kettlebells' | 'bodyweight' | 'rower' | 'bike';

export const EQUIPMENT_OPTIONS: readonly { id: QuizEquipmentId; label: string }[] = [
  { id: 'full_gym', label: 'Full gym' },
  { id: 'dumbbells', label: 'Dumbbells' },
  { id: 'kettlebells', label: 'Kettlebells' },
  { id: 'bodyweight', label: 'Bodyweight' },
  { id: 'rower', label: 'Rower' },
  { id: 'bike', label: 'Bike' },
];

const EQUIPMENT_MAP: Record<QuizEquipmentId, readonly AiEquipment[]> = {
  full_gym: ['machines', 'barbell', 'cables', 'bench', 'pullup_bar', 'cardio_machine', 'dumbbells', 'kettlebell'],
  dumbbells: ['dumbbells'],
  kettlebells: ['kettlebell'],
  bodyweight: ['none'],
  rower: ['cardio_machine'],
  bike: ['cardio_machine'],
};

/** Union of mapped schema enums. `none` (bodyweight) is dropped if any other equipment is also selected. */
export function mapEquipment(ids: readonly QuizEquipmentId[]): AiEquipment[] {
  const set = new Set<AiEquipment>();
  for (const id of ids) for (const e of EQUIPMENT_MAP[id]) set.add(e);
  if (set.size > 1) set.delete('none');
  return [...set];
}

export const INJURY_CHIPS: readonly { id: 'none' | 'lower_back' | 'knee' | 'shoulder' | 'other'; label: string }[] = [
  { id: 'none', label: 'None' },
  { id: 'lower_back', label: 'Lower back' },
  { id: 'knee', label: 'Knee' },
  { id: 'shoulder', label: 'Shoulder' },
  { id: 'other', label: 'Other' },
];

export type InjuryChipId = (typeof INJURY_CHIPS)[number]['id'];

export const MAX_GOALS = 2;

export type QuizState = {
  goals: AiGoal[];
  experience: AiExperience | null;
  equipment: QuizEquipmentId[];
  daysPerWeek: number | null;
  sessionMinutes: number | null;
  injury: InjuryChipId | null;
};

export const emptyQuiz = (): QuizState => ({
  goals: [],
  experience: null,
  equipment: [],
  daysPerWeek: null,
  sessionMinutes: null,
  injury: null,
});

export function toggleGoal(goals: AiGoal[], id: AiGoal, allowed: readonly { id: AiGoal }[]): AiGoal[] {
  if (goals.includes(id)) return goals.filter((g) => g !== id);
  if (!allowed.some((g) => g.id === id)) return goals;
  if (goals.length >= MAX_GOALS) return [...goals.slice(1), id];
  return [...goals, id];
}

export function toggleEquipment(ids: QuizEquipmentId[], id: QuizEquipmentId): QuizEquipmentId[] {
  return ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id];
}

export const quizComplete = (s: QuizState): boolean =>
  s.goals.length >= 1 &&
  s.experience !== null &&
  s.equipment.length >= 1 &&
  s.daysPerWeek !== null &&
  s.sessionMinutes !== null &&
  s.injury !== null;

/** First selected goal is sent to the API (schema is one goal). The second is kept for display. */
export function toPlanRequest(s: QuizState): AiPlanRequest | null {
  if (!quizComplete(s) || !s.experience || !s.daysPerWeek || !s.sessionMinutes) return null;
  return {
    goal: s.goals[0],
    experience: s.experience,
    equipment: mapEquipment(s.equipment),
    daysPerWeek: s.daysPerWeek,
    sessionMinutes: s.sessionMinutes,
  };
}

export function goalLabels(ids: readonly AiGoal[], teen: boolean): string[] {
  const list = quizGoals(teen);
  return ids.map((id) => list.find((g) => g.id === id)?.label ?? id);
}

export function injuryLabel(id: InjuryChipId | null): string | null {
  if (!id || id === 'none') return null;
  return INJURY_CHIPS.find((c) => c.id === id)?.label ?? null;
}
