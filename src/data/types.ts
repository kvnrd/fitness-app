export type DayKey = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';

export const DAY_KEYS: DayKey[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

export const DAY_LABELS: Record<DayKey, { short: string; long: string }> = {
  mon: { short: 'Mon', long: 'Monday' },
  tue: { short: 'Tue', long: 'Tuesday' },
  wed: { short: 'Wed', long: 'Wednesday' },
  thu: { short: 'Thu', long: 'Thursday' },
  fri: { short: 'Fri', long: 'Friday' },
  sat: { short: 'Sat', long: 'Saturday' },
  sun: { short: 'Sun', long: 'Sunday' },
};

/** What a trainer can ask a client to log for an exercise. */
export type LogField = 'weight' | 'reps' | 'time' | 'distance' | 'calories' | 'power' | 'rpe';

export const LOG_FIELDS: Record<LogField, { label: string; short: string; unit: string; keyboard: 'numeric' | 'default' }> = {
  weight: { label: 'Weight', short: 'lb', unit: 'lb', keyboard: 'numeric' },
  reps: { label: 'Reps', short: 'Reps', unit: 'reps', keyboard: 'numeric' },
  time: { label: 'Time', short: 'Time', unit: 'mm:ss', keyboard: 'default' },
  distance: { label: 'Distance', short: 'mi', unit: 'mi', keyboard: 'numeric' },
  calories: { label: 'Calories', short: 'Cal', unit: 'kcal', keyboard: 'numeric' },
  power: { label: 'Power', short: 'kW', unit: 'kW', keyboard: 'numeric' },
  rpe: { label: 'RPE', short: 'RPE', unit: '1–10', keyboard: 'numeric' },
};

export type ExerciseKind = 'strength' | 'cardio';

export interface Exercise {
  id: string;
  name: string;
  kind: ExerciseKind;
  description: string;
  /** Number of rows the client logs (sets for strength, intervals for cardio). */
  sets: number;
  /** Human-readable target, e.g. "8–10 reps @ RPE 8" or "20 min steady". */
  target: string;
  fields: LogField[];
  restSeconds?: number;
}

export interface WorkoutDay {
  day: DayKey;
  title: string;
  focus: string;
  durationMin: number;
  rest?: boolean;
  video?: {
    title: string;
    durationLabel: string;
    /** Remote URL once uploads exist; undefined shows the poster only. */
    uri?: string;
  };
  keyPoints: string[];
  exercises: Exercise[];
}

export interface Trainer {
  id: string;
  name: string;
  handle: string;
  programName: string;
}

export interface Program {
  trainer: Trainer;
  weekLabel: string;
  days: Record<DayKey, WorkoutDay>;
}

/** One logged row: field -> value as typed. */
export type SetLog = Partial<Record<LogField, string>> & { done?: boolean };

/** Logs for a day: exerciseId -> rows. */
export type DayLog = Record<string, SetLog[]>;
