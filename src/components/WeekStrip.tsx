import { Pressable, StyleSheet, View } from 'react-native';
import { DAY_KEYS, DAY_LABELS, DayKey } from '../data/types';
import { useAppStore, useDayProgress } from '../state/AppStore';
import { colors, radius, space } from '../theme/tokens';
import { Text } from './ui';

export function todayKey(date = new Date()): DayKey {
  // JS: 0 = Sunday
  return DAY_KEYS[(date.getDay() + 6) % 7];
}

function DayPill({ day, selected, isToday, onPress }: { day: DayKey; selected: boolean; isToday: boolean; onPress: () => void }) {
  const { program } = useAppStore();
  const { ratio } = useDayProgress(day);
  const rest = program.days[day].rest;
  const complete = ratio >= 1;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${DAY_LABELS[day].long}${complete ? ', completed' : ''}`}
      accessibilityState={{ selected }}
      style={({ pressed }) => [styles.pill, selected && styles.pillSelected, pressed && { opacity: 0.8 }]}
    >
      <Text variant="label" color={selected ? colors.accentText : colors.textMuted} style={{ letterSpacing: 0.8 }}>
        {DAY_LABELS[day].short}
      </Text>
      <View
        style={[
          styles.dot,
          complete && { backgroundColor: selected ? colors.accentText : colors.accent },
          !complete && ratio > 0 && { borderColor: selected ? colors.accentText : colors.accent },
          rest && !complete && { opacity: 0.35 },
        ]}
      />
      {isToday && !selected ? <View style={styles.todayBar} /> : null}
    </Pressable>
  );
}

export function WeekStrip({ selected, onSelect }: { selected: DayKey; onSelect: (d: DayKey) => void }) {
  const today = todayKey();
  return (
    <View style={styles.row}>
      {DAY_KEYS.map((d) => (
        <DayPill key={d} day={d} selected={d === selected} isToday={d === today} onPress={() => onSelect(d)} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 6 },
  pill: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: space.sm,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    gap: 8,
  },
  pillSelected: { backgroundColor: colors.accent, borderColor: colors.accent },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
  },
  todayBar: {
    position: 'absolute',
    bottom: 4,
    width: 14,
    height: 2,
    borderRadius: 1,
    backgroundColor: colors.accent,
  },
});
