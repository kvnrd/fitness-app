import { createContext, ReactNode, useCallback, useContext, useMemo, useState } from 'react';
import { mockProgram } from '../data/mockProgram';
import { DayKey, DayLog, Exercise, LogField, Program, SetLog } from '../data/types';

/**
 * In-memory store for the MVP interface. Swapped for Supabase later;
 * screens only talk to this hook, so the swap stays local.
 */
interface AppStore {
  program: Program;
  logs: Partial<Record<DayKey, DayLog>>;
  /** Last session's numbers, shown beside the inputs. */
  previous: Record<string, SetLog[]>;
  updateSet: (day: DayKey, exercise: Exercise, index: number, field: LogField, value: string) => void;
  toggleSetDone: (day: DayKey, exercise: Exercise, index: number) => void;
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

function rowsFor(log: DayLog | undefined, exercise: Exercise): SetLog[] {
  const existing = log?.[exercise.id] ?? [];
  return Array.from({ length: exercise.sets }, (_, i) => existing[i] ?? {});
}

export function AppStoreProvider({ children }: { children: ReactNode }) {
  const [program, setProgram] = useState<Program>(mockProgram);
  const [logs, setLogs] = useState<AppStore['logs']>({});

  const patchRow = useCallback((day: DayKey, exercise: Exercise, index: number, fn: (row: SetLog) => SetLog) => {
    setLogs((prev) => {
      const dayLog = prev[day] ?? {};
      const rows = rowsFor(dayLog, exercise);
      rows[index] = fn(rows[index]);
      return { ...prev, [day]: { ...dayLog, [exercise.id]: rows } };
    });
  }, []);

  const value = useMemo<AppStore>(
    () => ({
      program,
      logs,
      previous: previousMock,
      updateSet: (day, exercise, index, field, v) => patchRow(day, exercise, index, (row) => ({ ...row, [field]: v })),
      toggleSetDone: (day, exercise, index) => patchRow(day, exercise, index, (row) => ({ ...row, done: !row.done })),
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
    [program, logs, patchRow],
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
