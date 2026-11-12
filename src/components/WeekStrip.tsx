import { Pressable, StyleSheet, View } from 'react-native';
import { DAY_KEYS, DAY_LABELS, DayKey } from '../data/types';
import { useDayProgress } from '../state/AppStore';
import { colors, fonts, space } from '../theme/tokens';
import { Text } from './ui';

export function todayKey(date = new Date()): DayKey {
  return DAY_KEYS[(date.getDay() + 6) % 7]; // JS: 0 = Sunday
}

function DayTab({ day, selected, isToday, onPress }: { day: DayKey; selected: boolean; isToday: boolean; onPress: () => void }) {
  const { ratio } = useDayProgress(day);
  const complete = ratio >= 1;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="tab"
      accessibilityLabel={`${DAY_LABELS[day].long}${isToday ? ', today' : ''}${complete ? ', completed' : ''}`}
      accessibilityState={{ selected }}
      style={styles.tab}
    >
      <Text
        style={{ fontFamily: fonts.display, fontSize: 20, lineHeight: 24 }}
        color={selected ? colors.text : isToday ? colors.textSecondary : colors.textMuted}
      >
        {DAY_LABELS[day].short[0]}
      </Text>
      <View style={[styles.mark, complete && styles.markDone, !complete && ratio > 0 && styles.markPartial]} />
      <View style={[styles.underline, selected && { backgroundColor: colors.text }]} />
    </Pressable>
  );
}

export function WeekStrip({ selected, onSelect }: { selected: DayKey; onSelect: (d: DayKey) => void }) {
  const today = todayKey();
  return (
    <View style={styles.row} accessibilityRole="tablist">
      {DAY_KEYS.map((d) => (
        <DayTab key={d} day={d} selected={d === selected} isToday={d === today} onPress={() => onSelect(d)} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  tab: { flex: 1, alignItems: 'center', paddingTop: space.xs, gap: 6 },
  mark: { width: 5, height: 5, borderRadius: 3, backgroundColor: 'transparent' },
  markPartial: { borderWidth: 1, borderColor: colors.textSecondary },
  markDone: { backgroundColor: colors.text },
  underline: { height: 2, alignSelf: 'stretch', marginHorizontal: 8, backgroundColor: 'transparent' },
});
