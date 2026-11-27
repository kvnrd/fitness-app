import { DAY_KEYS } from './types.ts';
import type { DayKey, DayLog, Exercise, LogField, Program, SetLog, WorkoutDay } from './types.ts';

/**
 * Pure mapping between the Supabase training tables (20260101000200_training.sql) and the app's
 * Program / DayLog shapes. No Supabase import here so it stays unit-testable under Node.
 *
 * Canonical units in set_logs: weight in pounds, distance in miles, time in seconds.
 */

export interface ExerciseRow {
  id: string;
  name: string;
  kind: 'strength' | 'cardio';
  sets: number;
  target: string;
  fields: string[];
  description: string;
  rest_seconds: number | null;
  position: number;
}

export interface PlanDayRow {
  id: string;
  day_key: string;
  title: string;
  focus: string;
  duration_min: number;
  rest: boolean;
  key_points: string[] | null;
  video_title: string | null;
  video_duration: string | null;
  video_uri: string | null;
  exercises: ExerciseRow[] | null;
}

export interface PlanRow {
  id: string;
  name: string;
  week_label: string | null;
  owner_id: string;
  ai_generated?: boolean | null;
  overview?: string | null;
  plan_days: PlanDayRow[] | null;
}

export interface SetLogRow {
  exercise_id: string;
  performed_on: string;
  set_index: number;
  weight: number | string | null;
  reps: number | null;
  time_seconds: number | null;
  distance: number | string | null;
  calories: number | string | null;
  power: number | string | null;
  rpe: number | string | null;
  done: boolean;
}

/** Columns the client writes for one set (everything but the key). */
export type SetLogValues = Pick<SetLogRow, 'weight' | 'reps' | 'time_seconds' | 'distance' | 'calories' | 'power' | 'rpe' | 'done'>;

/**
 * Hosts a coach's video may stream from (CLAUDE.md: remote video sources must be allowlisted).
 * Empty until Kevin picks a video host, so every plan video shows its poster only.
 */
export const VIDEO_HOST_ALLOWLIST: readonly string[] = [];

export function allowedVideoUri(uri: string | null | undefined, allow: readonly string[] = VIDEO_HOST_ALLOWLIST): string | undefined {
  if (!uri) return undefined;
  try {
    const u = new URL(uri);
    return u.protocol === 'https:' && allow.includes(u.hostname) ? u.toString() : undefined;
  } catch {
    return undefined;
  }
}

const VALID_FIELDS = new Set<LogField>(['weight', 'reps', 'time', 'distance', 'calories', 'power', 'rpe']);

function isDayKey(v: string): v is DayKey {
  return (DAY_KEYS as string[]).includes(v);
}

/** A day the coach left out of the plan. Shown as a rest day. */
export function emptyDay(day: DayKey): WorkoutDay {
  return { day, title: 'Rest', focus: '', durationMin: 0, rest: true, keyPoints: [], exercises: [] };
}

export function mapExercise(row: ExerciseRow): Exercise {
  return {
    id: row.id,
    name: row.name,
    kind: row.kind,
    description: row.description ?? '',
    sets: Math.max(1, row.sets),
    target: row.target ?? '',
    fields: (row.fields ?? []).filter((f): f is LogField => VALID_FIELDS.has(f as LogField)),
    restSeconds: row.rest_seconds ?? undefined,
  };
}

export function mapPlanDay(row: PlanDayRow): WorkoutDay | null {
  if (!isDayKey(row.day_key)) return null;
  const exercises = [...(row.exercises ?? [])].sort((a, b) => a.position - b.position).map(mapExercise);
  return {
    day: row.day_key,
    title: row.title,
    focus: row.focus ?? '',
    durationMin: row.duration_min ?? 0,
    rest: row.rest || undefined,
    video: row.video_title
      ? { title: row.video_title, durationLabel: row.video_duration ?? '', uri: allowedVideoUri(row.video_uri) }
      : undefined,
    keyPoints: row.key_points ?? [],
    exercises,
  };
}

/**
 * The coach's display name is not readable by the client under RLS (profiles_select_* only allow
 * self and coach-of-client), so the trainer shows the plan name until a read path exists.
 */
export function mapPlan(row: PlanRow, trainerName = ''): Program {
  const days = Object.fromEntries(DAY_KEYS.map((d) => [d, emptyDay(d)])) as Record<DayKey, WorkoutDay>;
  for (const d of row.plan_days ?? []) {
    const mapped = mapPlanDay(d);
    if (mapped) days[mapped.day] = mapped;
  }
  return {
    trainer: { id: row.owner_id, name: trainerName, handle: '', programName: row.name },
    weekLabel: row.week_label ?? '',
    days,
    ...(row.ai_generated ? { aiGenerated: true } : {}),
    ...(row.overview ? { overview: row.overview } : {}),
  };
}

// ------------------------------------------------------------------ dates

function pad(n: number) {
  return String(n).padStart(2, '0');
}

export function isoDate(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Monday of the local week containing `now`, as YYYY-MM-DD. */
export function weekStart(now: Date = new Date()): string {
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const offset = (d.getDay() + 6) % 7; // Mon = 0 ... Sun = 6
  d.setDate(d.getDate() - offset);
  return isoDate(d);
}

/**
 * The date a day's sets are logged under: that weekday in the current week. Logging Monday's
 * session late on Tuesday still lands on Monday, so a day's log is one stable key per week.
 */
export function dateForDay(day: DayKey, start: string): string {
  const [y, m, d] = start.split('-').map(Number);
  const date = new Date(y, m - 1, d + DAY_KEYS.indexOf(day));
  return isoDate(date);
}

export function dayForDate(date: string, start: string): DayKey | null {
  for (const d of DAY_KEYS) if (dateForDay(d, start) === date) return d;
  return null;
}

// ------------------------------------------------------------------ values

function num(v: string | undefined, { int = false, min = 0, max = Number.POSITIVE_INFINITY } = {}): number | null {
  const s = v?.trim().replace(',', '.');
  if (!s) return null;
  if (!/^\d+(\.\d+)?$/.test(s)) return null;
  const n = Number(s);
  if (!Number.isFinite(n) || n < min || n > max) return null;
  if (int && !Number.isInteger(n)) return null;
  return n;
}

/** "mm:ss", "h:mm:ss" or plain seconds -> seconds. */
export function parseTime(v: string | undefined): number | null {
  const s = v?.trim();
  if (!s) return null;
  if (/^\d+$/.test(s)) return Number(s);
  const parts = s.split(':');
  if (parts.length < 2 || parts.length > 3 || parts.some((p) => !/^\d+$/.test(p))) return null;
  const nums = parts.map(Number);
  const [h, m, sec] = nums.length === 3 ? nums : [0, nums[0], nums[1]];
  if (sec >= 60 || (nums.length === 3 && m >= 60)) return null;
  return h * 3600 + m * 60 + sec;
}

export function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}

/** The app's typed row -> database columns. Text that doesn't parse is stored as null. */
export function toRowValues(log: SetLog): SetLogValues {
  return {
    weight: num(log.weight),
    reps: num(log.reps, { int: true }),
    time_seconds: parseTime(log.time),
    distance: num(log.distance),
    calories: num(log.calories),
    power: num(log.power),
    rpe: num(log.rpe, { min: 1, max: 10 }),
    done: !!log.done,
  };
}

function str(v: number | string | null): string | undefined {
  if (v === null || v === undefined) return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? String(n) : undefined;
}

export function fromRow(row: SetLogRow): SetLog {
  const out: SetLog = {};
  const w = str(row.weight);
  if (w) out.weight = w;
  if (row.reps !== null && row.reps !== undefined) out.reps = String(row.reps);
  if (row.time_seconds !== null && row.time_seconds !== undefined) out.time = formatTime(row.time_seconds);
  const dist = str(row.distance);
  if (dist) out.distance = dist;
  const cal = str(row.calories);
  if (cal) out.calories = cal;
  const pw = str(row.power);
  if (pw) out.power = pw;
  const rpe = str(row.rpe);
  if (rpe) out.rpe = rpe;
  if (row.done) out.done = true;
  return out;
}

/** This week's set_logs -> the store's day -> exercise -> rows map. */
export function logsFromRows(rows: SetLogRow[], program: Program, start: string): Partial<Record<DayKey, DayLog>> {
  const dayOfExercise = new Map<string, DayKey>();
  for (const d of DAY_KEYS) for (const e of program.days[d].exercises) dayOfExercise.set(e.id, d);
  const out: Partial<Record<DayKey, DayLog>> = {};
  for (const r of rows) {
    const day = dayOfExercise.get(r.exercise_id);
    if (!day || dateForDay(day, start) !== r.performed_on) continue;
    const dayLog = (out[day] ??= {});
    const list = (dayLog[r.exercise_id] ??= []);
    list[r.set_index] = fromRow(r);
  }
  for (const dayLog of Object.values(out)) {
    for (const [id, list] of Object.entries(dayLog!)) dayLog![id] = Array.from(list, (x) => x ?? {});
  }
  return out;
}

/** Earlier set_logs -> exercise -> rows from the most recent date before this week ("Last"). */
export function previousFromRows(rows: SetLogRow[], start: string): Record<string, SetLog[]> {
  const latest = new Map<string, string>();
  for (const r of rows) {
    if (r.performed_on >= start) continue;
    const cur = latest.get(r.exercise_id);
    if (!cur || r.performed_on > cur) latest.set(r.exercise_id, r.performed_on);
  }
  const out: Record<string, SetLog[]> = {};
  for (const r of rows) {
    if (latest.get(r.exercise_id) !== r.performed_on) continue;
    const list = (out[r.exercise_id] ??= []);
    list[r.set_index] = fromRow(r);
  }
  for (const [id, list] of Object.entries(out)) out[id] = Array.from(list, (x) => x ?? {});
  return out;
}
