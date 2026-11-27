import type { SupabaseClient } from '@supabase/supabase-js';
import { DayKey, DayLog, Exercise, Program, SetLog } from './types';
import {
  logsFromRows,
  mapPlan,
  PlanRow,
  previousFromRows,
  SetLogRow,
  toRowValues,
} from './planMapping';

/**
 * Supabase reads and writes for the weekly plan, the day workout and set logging.
 * RLS decides everything: a client sees plans where client_id = auth.uid(), and can only write
 * its own set_logs while app.can_train() holds.
 */

const PLAN_SELECT =
  'id, name, week_label, owner_id, ai_generated, overview, updated_at, ' +
  'plan_days(id, day_key, title, focus, duration_min, rest, key_points, video_title, video_duration, video_uri, ' +
  'exercises(id, name, kind, sets, target, fields, description, rest_seconds, position))';

const LOG_SELECT = 'exercise_id, performed_on, set_index, weight, reps, time_seconds, distance, calories, power, rpe, done';

/** How many earlier rows to scan for the "Last" column. One plan week is well under this. */
const PREVIOUS_LIMIT = 1000;

export type Result<T> = { ok: true; value: T } | { ok: false; error: string };

/** The newest plan assigned to this user, or null when the coach hasn't assigned one. */
export async function loadAssignedPlan(db: SupabaseClient, userId: string): Promise<Result<Program | null>> {
  const { data, error } = await db
    .from('plans')
    .select(PLAN_SELECT)
    .eq('client_id', userId)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) return { ok: false, error: error.message };
  return { ok: true, value: data ? mapPlan(data as unknown as PlanRow) : null };
}

function exerciseIds(program: Program): string[] {
  return Object.values(program.days).flatMap((d) => d.exercises.map((e) => e.id));
}

export interface LoadedLogs {
  logs: Partial<Record<DayKey, DayLog>>;
  previous: Record<string, SetLog[]>;
}

export async function loadLogs(db: SupabaseClient, userId: string, program: Program, start: string): Promise<Result<LoadedLogs>> {
  const ids = exerciseIds(program);
  if (ids.length === 0) return { ok: true, value: { logs: {}, previous: {} } };
  const [week, earlier] = await Promise.all([
    db.from('set_logs').select(LOG_SELECT).eq('user_id', userId).in('exercise_id', ids).gte('performed_on', start),
    db
      .from('set_logs')
      .select(LOG_SELECT)
      .eq('user_id', userId)
      .in('exercise_id', ids)
      .lt('performed_on', start)
      .order('performed_on', { ascending: false })
      .limit(PREVIOUS_LIMIT),
  ]);
  if (week.error) return { ok: false, error: week.error.message };
  if (earlier.error) return { ok: false, error: earlier.error.message };
  return {
    ok: true,
    value: {
      logs: logsFromRows((week.data ?? []) as SetLogRow[], program, start),
      previous: previousFromRows((earlier.data ?? []) as SetLogRow[], start),
    },
  };
}

/**
 * Save one set. Update first, insert when no row exists yet. A plain upsert can't be used: its
 * ON CONFLICT UPDATE would set user_id and exercise_id, which have no column UPDATE grant.
 * A unique-violation on insert (another write got there first) falls back to the update.
 */
export async function saveSet(
  db: SupabaseClient,
  userId: string,
  exercise: Exercise,
  performedOn: string,
  setIndex: number,
  log: SetLog,
): Promise<Result<null>> {
  const values = toRowValues(log);
  const update = () =>
    db
      .from('set_logs')
      .update(values)
      .eq('user_id', userId)
      .eq('exercise_id', exercise.id)
      .eq('performed_on', performedOn)
      .eq('set_index', setIndex)
      .select('id');

  const first = await update();
  if (first.error) return { ok: false, error: first.error.message };
  if ((first.data ?? []).length > 0) return { ok: true, value: null };

  const ins = await db
    .from('set_logs')
    .insert({ user_id: userId, exercise_id: exercise.id, performed_on: performedOn, set_index: setIndex, ...values });
  if (!ins.error) return { ok: true, value: null };
  if (ins.error.code !== '23505') return { ok: false, error: ins.error.message };

  const retry = await update();
  return retry.error ? { ok: false, error: retry.error.message } : { ok: true, value: null };
}
