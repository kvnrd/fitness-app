import { useEffect, type ReactElement } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ProgressScreen from '../../app/(tabs)/progress';
import TrainScreen from '../../app/(tabs)/train';
import WorkoutDayScreen from '../../app/workout/[day]';
import { AuroraTabBar, AURORA_TAB_BAR_RESERVE } from '../../components/AuroraTabBar';
import { AppearanceSettingsScreen } from '../../settings/screens/AppearanceSettings';
import { useAppStore } from '../../state/AppStore';
import { setPreviewToday } from '../../theme/dayLabels.ts';
import { setPreviewWorkoutDay } from '../../preview/flags.ts';
import type { DayKey, DayLog } from '../../data/types';

/** Mid-session Wednesday: 3 of 4 bench sets logged, rest of the week partly filled for Progress. */
export const AURORA_PREVIEW_LOGS: Partial<Record<DayKey, DayLog>> = {
  mon: {
    mon_1: [
      { weight: '185', reps: '6', done: true },
      { weight: '195', reps: '6', done: true },
      { weight: '195', reps: '6', done: true },
      { weight: '195', reps: '5', done: true },
    ],
    mon_2: [
      { weight: '155', reps: '10', done: true },
      { weight: '155', reps: '9', done: true },
      { weight: '155', reps: '8', done: true },
    ],
    mon_3: [
      { weight: '50', reps: '12', done: true },
      { weight: '50', reps: '12', done: true },
      { weight: '50', reps: '12', done: true },
    ],
    mon_4: [{ time: '10:00', calories: '95', power: '0.12', done: true }],
  },
  tue: {
    tue_1: [
      { time: '4:00', distance: '0.68', power: '0.24', calories: '62', done: true },
      { time: '4:00', distance: '0.67', power: '0.23', calories: '60', done: true },
    ],
  },
  wed: {
    wed_1: [
      { weight: '185', reps: '5', rpe: '8', done: true },
      { weight: '185', reps: '5', rpe: '8', done: true },
      { weight: '185', reps: '5', rpe: '8', done: true },
      { weight: '185', reps: '5', rpe: '8', done: false },
    ],
  },
};

function usePinnedToday(day: DayKey) {
  useEffect(() => {
    setPreviewToday(day);
    return () => setPreviewToday(null);
  }, [day]);
}

function usePreviewLogs(logs: Partial<Record<DayKey, DayLog>> | null) {
  const { replaceLogs } = useAppStore();
  useEffect(() => {
    replaceLogs(logs ?? {});
    return () => replaceLogs({});
  }, [replaceLogs, logs]);
}

function FakeTabBar({ active }: { active: 'index' | 'train' | 'progress' | 'profile' }) {
  const insets = useSafeAreaInsets();
  const routes = [
    { key: 'index', name: 'index' },
    { key: 'train', name: 'train' },
    { key: 'progress', name: 'progress' },
    { key: 'profile', name: 'profile' },
  ];
  const index = routes.findIndex((r) => r.name === active);
  return (
    <AuroraTabBar
      state={{ key: 'tabs', index, routeNames: routes.map((r) => r.name), routes, type: 'tab', stale: false, history: [], preloadedRouteKeys: [] } as never}
      descriptors={Object.fromEntries(routes.map((r) => [r.key, { options: {}, navigation: {}, route: r }])) as never}
      navigation={{ emit: () => ({ defaultPrevented: true }), navigate: () => {} } as never}
      insets={insets}
    />
  );
}

function WithTabs({ active, children }: { active: 'index' | 'train' | 'progress' | 'profile'; children: ReactElement }) {
  return (
    <View style={{ flex: 1, minHeight: 844, paddingBottom: AURORA_TAB_BAR_RESERVE }}>
      {children}
      <FakeTabBar active={active} />
    </View>
  );
}

export function AuroraTrainPreview() {
  usePinnedToday('wed');
  usePreviewLogs(AURORA_PREVIEW_LOGS);
  return (
    <WithTabs active="train">
      <TrainScreen />
    </WithTabs>
  );
}

export function AuroraProgressPreview() {
  usePinnedToday('wed');
  usePreviewLogs(AURORA_PREVIEW_LOGS);
  return (
    <WithTabs active="progress">
      <ProgressScreen />
    </WithTabs>
  );
}

const EMPTY_LOGS: Partial<Record<DayKey, DayLog>> = {};

export function AuroraWorkoutPreview({ empty }: { empty?: boolean }) {
  usePinnedToday('wed');
  usePreviewLogs(empty ? EMPTY_LOGS : AURORA_PREVIEW_LOGS);
  // The route reads useLocalSearchParams; for preview we need day=wed.
  // WorkoutDayScreen defaults to 'mon' if the param is missing. Wrap by setting params is not possible here,
  // so we temporarily default via preview today and a shim... We'll pass day through a search-params mock
  // by rendering WorkoutDayScreen after pushing isn't available. Instead, export a day-forced screen.
  return <WorkoutForced day="wed" />;
}

function WorkoutForced({ day }: { day: DayKey }) {
  useEffect(() => {
    setPreviewWorkoutDay(day);
    return () => setPreviewWorkoutDay(null);
  }, [day]);
  return <WorkoutDayScreen />;
}
