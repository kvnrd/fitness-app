// Maps a filtered AI plan to the row shape mark_ai_plan_accepted() copies into plans / plan_days /
// exercises. Pure, so it is unit-tested under Node. Only call this on a plan that passed filterPlan().
import type { Plan, PlanExercise } from './plan.ts';

export interface DraftExercise {
  name: string;
  kind: 'strength' | 'cardio';
  sets: number;
  target: string;
  fields: ('weight' | 'reps' | 'time' | 'distance')[];
  description: string;
}
export interface DraftDay {
  day_key: string;
  title: string;
  focus: string;
  duration_min: number;
  rest: boolean;
  exercises: DraftExercise[];
}
export interface PlanDraft { days: DraftDay[] }

// A target given as time or distance ("20 min", "1 mile", "400 m") and not as reps is cardio.
const TIME_OR_DISTANCE = /\b\d+(\.\d+)?\s*(min|mins|minutes|sec|secs|seconds|mile|miles|mi|km|m|meters?)\b/i;
const REPS = /\brep/i;

export function exerciseKind(e: PlanExercise): 'strength' | 'cardio' {
  return TIME_OR_DISTANCE.test(e.target) && !REPS.test(e.target) ? 'cardio' : 'strength';
}

export function planToDraft(plan: Plan): PlanDraft {
  return {
    days: plan.days.map((d) => ({
      day_key: d.day,
      title: d.title,
      focus: d.focus,
      duration_min: d.duration_min,
      rest: d.rest,
      exercises: d.exercises.map((e) => {
        const kind = exerciseKind(e);
        return {
          name: e.name,
          kind,
          sets: e.sets,
          target: e.target,
          fields: kind === 'cardio' ? ['time', 'distance'] : ['weight', 'reps'],
          description: e.notes,
        };
      }),
    })),
  };
}
