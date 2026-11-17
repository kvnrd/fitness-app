import { DAY_LABELS, type DayKey } from '../data/types.ts';
import type { ThemeFamily } from './tokens.ts';

/** Two-letter weekday labels used on Aurora boards (Mo, Tu, We…). */
export const AURORA_DAY_SHORT: Record<DayKey, string> = {
  mon: 'Mo',
  tue: 'Tu',
  wed: 'We',
  thu: 'Th',
  fri: 'Fr',
  sat: 'Sa',
  sun: 'Su',
};

export function shortDay(day: DayKey, family: ThemeFamily): string {
  return family === 'aurora' ? AURORA_DAY_SHORT[day] : DAY_LABELS[day].short;
}

/** Screenshot harness only: pin "today" so Train/Workout/Progress match the v4 boards. */
let previewToday: DayKey | null = null;

export function setPreviewToday(day: DayKey | null): void {
  previewToday = day;
}

export function todayKey(date = new Date()): DayKey {
  if (previewToday) return previewToday;
  const keys: DayKey[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
  return keys[(date.getDay() + 6) % 7];
}
