import { Pressable, StyleSheet, View } from 'react-native';
import { DAY_KEYS, DAY_LABELS, DayKey } from '../data/types';
import { useDayProgress } from '../state/AppStore';
import { shortDay, todayKey } from '../theme/dayLabels.ts';
import { useTheme } from '../theme/ThemeProvider';
import { space } from '../theme/tokens';
import { Text } from './ui';

export { todayKey };

function DayTab({ day, selected, isToday, onPress }: { day: DayKey; selected: boolean; isToday: boolean; onPress: () => void }) {
  const { colors, fonts, family, minControlSize, radius } = useTheme();
  const { ratio } = useDayProgress(day);
  const complete = ratio >= 1;
  const aurora = family === 'aurora';
  const label = shortDay(day, family);
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="tab"
      accessibilityLabel={`${DAY_LABELS[day].long}${isToday ? ', today' : ''}${complete ? ', completed' : ''}`}
      accessibilityState={{ selected }}
      style={[
        styles.tab,
        { minWidth: minControlSize, minHeight: minControlSize },
        aurora && selected && { backgroundColor: colors.tabOn, borderRadius: 22 },
      ]}
    >
      <Text
        style={{ fontFamily: fonts.displayBold, fontSize: aurora ? 12 : 20, lineHeight: aurora ? 16 : 24 }}
        color={selected ? (aurora ? colors.tabOnText : colors.text) : isToday ? colors.textSecondary : colors.textMuted}
      >
        {aurora ? label : DAY_LABELS[day].short[0]}
      </Text>
      <View
        style={[
          styles.mark,
          complete && { backgroundColor: selected && aurora ? colors.tabOnText : colors.accent },
          !complete && ratio > 0 && { borderWidth: 1, borderColor: colors.textSecondary },
          !complete && ratio === 0 && aurora && { borderWidth: 1.5, borderColor: colors.faint },
        ]}
      />
      {aurora ? null : <View style={[styles.underline, selected && { backgroundColor: colors.accentLine }]} />}
    </Pressable>
  );
}

export function WeekStrip({ selected, onSelect }: { selected: DayKey; onSelect: (d: DayKey) => void }) {
  const { colors, family } = useTheme();
  const today = todayKey();
  return (
    <View
      style={[styles.row, family !== 'aurora' && { borderBottomColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth }]}
      accessibilityRole="tablist"
    >
      {DAY_KEYS.map((d) => (
        <DayTab key={d} day={d} selected={d === selected} isToday={d === today} onPress={() => onSelect(d)} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 4 },
  tab: { flex: 1, alignItems: 'center', paddingTop: space.xs, gap: 6, minHeight: 56, justifyContent: 'center' },
  mark: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'transparent' },
  underline: { height: 2, alignSelf: 'stretch', marginHorizontal: 8, backgroundColor: 'transparent' },
});
