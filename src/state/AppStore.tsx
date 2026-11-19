import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useSession } from '../auth/SessionProvider';
import { supabase } from '../auth/supabase';
import { mockProgram } from '../data/mockProgram';
import { loadAssignedPlan, loadLogs, saveSet } from '../data/planApi';
import { dateForDay, emptyDay, weekStart } from '../data/planMapping';
import { workoutsLocked } from '../onboarding/routing';
import { DAY_KEYS, DayKey, DayLog, Exercise, LogField, Program, SetLog } from '../data/types';

/**
 * Store for the weekly plan, the day workout and set logging. Screens only talk to this hook.
 *
 * - Supabase unconfigured: the in-memory prototype (mockProgram, logs kept in memory).
 * - Supabase configured and signed in: the newest plan assigned to the user (plans.client_id) and
 *   this week's set_logs. Each typed value or tick saves to set_logs after a short pause.
 *
 * Coach-side edits (addExercise, removeExercise, updateDay) still only change the local copy.
 */
export type PlanStatus = 'mock' | 'loading' | 'ready' | 'none' | 'error';

interface AppStore {
  program: Program;
  /** Where `program` came from. 'none' = signed in, but no plan is assigned yet. */
  planStatus: PlanStatus;
  /** Last load or save error message, cleared by the next success. Never shown raw to users. */
  syncError: string | null;
  reload: () => void;
  /** can_train is false (e.g. a teen whose parent has not finished their part): logging is disabled in the UI; the server enforces. */
  locked: boolean;
  logs: Partial<Record<DayKey, DayLog>>;
  /** Last session's numbers, shown beside the inputs. */
  previous: Record<string, SetLog[]>;
  updateSet: (day: DayKey, exercise: Exercise, index: number, field: LogField, value: string) => void;
  toggleSetDone: (day: DayKey, exercise: Exercise, index: number) => void;
  /** Preview / tests: replace the in-memory log map. */
  replaceLogs: (next: AppStore['logs']) => void;
  addExercise: (day: DayKey, exercise: Exercise) => void;
  removeExercise: (day: DayKey, exerciseId: string) => void;
  updateDay: (day: DayKey, patch: Partial<Pick<Program['days'][DayKey], 'title' | 'focus' | 'rest'>>) => void;
}

const Ctx = createContext<AppStore | null>(null);

const previousMock: Record<string, SetLog[]> = {
  mon_1: [
    { weight: '185', reps: '6' },
    { weight: '195', reps: '6' },
    { weight: '195', reps: '6' },
    { weight: '195', reps: '5' },
  ],
  mon_2: [
    { weight: '155', reps: '10' },
    { weight: '155', reps: '9' },
    { weight: '155', reps: '8' },
  ],
  tue_1: [
    { time: '4:00', distance: '0.68', power: '0.24', calories: '62' },
    { time: '4:00', distance: '0.67', power: '0.23', calories: '60' },
  ],
  wed_1: [
    { weight: '165', reps: '5', rpe: '7' },
    { weight: '175', reps: '5', rpe: '8' },
  ],
};

/** Shown while the real plan loads, or when none is assigned: every day a rest day. */
const EMPTY_PROGRAM: Program = {
  trainer: { id: '', name: '', handle: '', programName: '' },
  weekLabel: '',
  days: Object.fromEntries(DAY_KEYS.map((d) => [d, emptyDay(d)])) as Program['days'],
};

const SAVE_DELAY_MS = 600;

function rowsFor(log: DayLog | undefined, exercise: Exercise): SetLog[] {
  const existing = log?.[exercise.id] ?? [];
  return Array.from({ length: exercise.sets }, (_, i) => existing[i] ?? {});
}

export function AppStoreProvider({ children }: { children: ReactNode }) {
  const { onboarding, isConfigured, user } = useSession();
  const locked = isConfigured && workoutsLocked(onboarding);
  const remote = isConfigured && !!supabase;
  const userId = user?.id ?? null;

  const [program, setProgram] = useState<Program>(remote ? EMPTY_PROGRAM : mockProgram);
  const [planStatus, setPlanStatus] = useState<PlanStatus>(remote ? 'loading' : 'mock');
  const [logs, setLogsState] = useState<AppStore['logs']>({});
  const [previous, setPrevious] = useState<Record<string, SetLog[]>>(remote ? {} : previousMock);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [reloadTick, setReloadTick] = useState(0);

  // Latest logs for the save queue (state updaters must stay side-effect free).
  const logsRef = useRef<AppStore['logs']>({});
  const weekRef = useRef(weekStart());
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>());
  const chains = useRef(new Map<string, Promise<unknown>>());

  const setLogs = useCallback((next: AppStore['logs']) => {
    logsRef.current = next;
    setLogsState(next);
  }, []);

  useEffect(() => {
    if (!remote || !supabase) return;
    if (!userId) {
      setProgram(EMPTY_PROGRAM);
      setPlanStatus('none');
      setLogs({});
      setPrevious({});
      return;
    }
    const db = supabase;
    let cancelled = false;
    setPlanStatus('loading');
    void (async () => {
      const start = weekStart();
      weekRef.current = start;
      const plan = await loadAssignedPlan(db, userId);
      if (cancelled) return;
      if (!plan.ok) {
        setSyncError(plan.error);
        setPlanStatus('error');
        return;
      }
      if (!plan.value) {
        setProgram(EMPTY_PROGRAM);
        setLogs({});
        setPrevious({});
        setPlanStatus('none');
        setSyncError(null);
        return;
      }
      const loaded = await loadLogs(db, userId, plan.value, start);
      if (cancelled) return;
      setProgram(plan.value);
      if (loaded.ok) {
        setLogs(loaded.value.logs);
        setPrevious(loaded.value.previous);
        setSyncError(null);
      } else {
        setLogs({});
        setPrevious({});
        setSyncError(loaded.error);
      }
      setPlanStatus('ready');
    })();
    return () => {
      cancelled = true;
    };
  }, [remote, userId, reloadTick, setLogs]);

  // Flush nothing on unmount, but don't leave timers running.
  useEffect(() => {
    const t = timers.current;
    return () => t.forEach(clearTimeout);
  }, []);

  const scheduleSave = useCallback(
    (day: DayKey, exercise: Exercise, index: number) => {
      if (!remote || !supabase || !userId) return;
      const db = supabase;
      const key = `${exercise.id}:${index}`;
      const pending = timers.current.get(key);
      if (pending) clearTimeout(pending);
      timers.current.set(
        key,
        setTimeout(() => {
          timers.current.delete(key);
          // Serialize writes per set so an older save can't land after a newer one.
          const prev = chains.current.get(key) ?? Promise.resolve();
          const next = prev.then(async () => {
            const row = rowsFor(logsRef.current[day], exercise)[index];
            const res = await saveSet(db, userId, exercise, dateForDay(day, weekRef.current), index, row);
            setSyncError(res.ok ? null : res.error);
          });
          chains.current.set(key, next.catch(() => {}));
        }, SAVE_DELAY_MS),
      );
    },
    [remote, userId],
  );

  const patchRow = useCallback(
    (day: DayKey, exercise: Exercise, index: number, fn: (row: SetLog) => SetLog) => {
      const prev = logsRef.current;
      const dayLog = prev[day] ?? {};
      const rows = rowsFor(dayLog, exercise);
      rows[index] = fn(rows[index]);
      setLogs({ ...prev, [day]: { ...dayLog, [exercise.id]: rows } });
      scheduleSave(day, exercise, index);
    },
    [setLogs, scheduleSave],
  );

  const value = useMemo<AppStore>(
    () => ({
      program,
      planStatus,
      syncError,
      reload: () => setReloadTick((n) => n + 1),
      locked,
      logs,
      previous,
      updateSet: (day, exercise, index, field, v) => !locked && patchRow(day, exercise, index, (row) => ({ ...row, [field]: v })),
      toggleSetDone: (day, exercise, index) => !locked && patchRow(day, exercise, index, (row) => ({ ...row, done: !row.done })),
      replaceLogs: (next) => setLogs(next),
      addExercise: (day, exercise) =>
        setProgram((p) => ({
          ...p,
          days: { ...p.days, [day]: { ...p.days[day], rest: false, exercises: [...p.days[day].exercises, exercise] } },
        })),
      removeExercise: (day, id) =>
        setProgram((p) => ({
          ...p,
          days: { ...p.days, [day]: { ...p.days[day], exercises: p.days[day].exercises.filter((e) => e.id !== id) } },
        })),
      updateDay: (day, patch) =>
        setProgram((p) => ({ ...p, days: { ...p.days, [day]: { ...p.days[day], ...patch } } })),
    }),
    [program, planStatus, syncError, locked, logs, previous, patchRow, setLogs],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAppStore() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useAppStore must be used inside AppStoreProvider');
  return ctx;
}

export function useDayProgress(day: DayKey) {
  const { program, logs } = useAppStore();
  const d = program.days[day];
  const total = d.exercises.reduce((n, e) => n + e.sets, 0);
  const done = d.exercises.reduce((n, e) => n + rowsFor(logs[day], e).filter((r) => r.done).length, 0);
  return { done, total, ratio: total === 0 ? 0 : done / total };
}

export { rowsFor };
