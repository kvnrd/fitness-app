import type { DayKey } from '../data/types';

/** Screenshot harness: force the workout route's day when not on /workout/[day]. */
export let previewWorkoutDay: DayKey | null = null;

export function setPreviewWorkoutDay(day: DayKey | null): void {
  previewWorkoutDay = day;
}
