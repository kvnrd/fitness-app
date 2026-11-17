import { router, useLocalSearchParams } from 'expo-router';
import { useSession } from '../../auth/SessionProvider';
import { DAY_KEYS, type DayKey } from '../../data/types';
import { bodyweightRepsNotInVolumeCopy, recapStreakLine, recapVolume, type RecapSet } from '../../progress/workoutRecap.ts';
import { WorkoutRecapScreen } from '../../progress/screens/WorkoutRecap';
import { rowsFor, useAppStore, useDayProgress } from '../../state/AppStore';

export default function WorkoutRecapRoute() {
  const params = useLocalSearchParams<{ day?: string }>();
  const day = (DAY_KEYS.includes(params.day as DayKey) ? params.day : 'mon') as DayKey;
  const { program, logs } = useAppStore();
  const { done, total } = useDayProgress(day);
  const { onboarding } = useSession();
  const w = program.days[day];
  const sets: RecapSet[] = [];
  let exercisesDone = 0;
  for (const e of w.exercises) {
    const rows = rowsFor(logs[day], e);
    if (rows.some((r) => r.done)) exercisesDone += 1;
    const bodyweightLift = e.kind !== 'cardio' && !e.fields.includes('weight');
    for (const r of rows) {
      if (!r.done) continue;
      const weightLb = parseFloat(r.weight ?? '') || 0;
      const reps = parseFloat(r.reps ?? '') || 0;
      sets.push({
        bodyweightLift: bodyweightLift || (e.kind !== 'cardio' && weightLb <= 0),
        weightLb: weightLb > 0 ? weightLb : null,
        reps,
      });
    }
  }
  const isMinor = !!onboarding?.is_minor;
  const vol = recapVolume(sets, { isMinor });
  const dateLine = new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    timeZone: 'America/Denver',
  }).format(new Date());
  return (
    <WorkoutRecapScreen
      dateLine={dateLine}
      complete={total > 0 && done >= total}
      volume={vol.loadedVolumeLb.toLocaleString()}
      unit="lb"
      lastWorkout={w.title}
      lastVolume="0"
      bodyweightRepsCopy={vol.bodyweightReps > 0 ? bodyweightRepsNotInVolumeCopy(vol.bodyweightReps) : null}
      setsDone={done}
      setsTotal={total}
      exercisesDone={exercisesDone}
      exercisesTotal={w.exercises.length}
      minutes={0}
      prs={[]}
      streakLine={recapStreakLine(0)}
      onDone={() => (router.canGoBack() ? router.back() : router.replace('/'))}
    />
  );
}
