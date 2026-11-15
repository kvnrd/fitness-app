import { Pressable, StyleSheet, View } from 'react-native';
import { DAY_KEYS, DAY_LABELS, DayKey } from '../data/types';
import { useDayProgress } from '../state/AppStore';
import { useTheme } from '../theme/ThemeProvider';
import { space } from '../theme/tokens';
import { Text } from './ui';

export function todayKey(date = new Date()): DayKey {
  return DAY_KEYS[(date.getDay() + 6) % 7]; // JS: 0 = Sunday
}

function DayTab({ day, selected, isToday, onPress }: { day: DayKey; selected: boolean; isToday: boolean; onPress: () => void }) {
  const { colors, fonts } = useTheme();
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
        style={{ fontFamily: fonts.displayBold, fontSize: 20, lineHeight: 24 }}
        color={selected ? colors.text : isToday ? colors.textSecondary : colors.textMuted}
      >
        {DAY_LABELS[day].short[0]}
      </Text>
      <View
        style={[
          styles.mark,
          complete && { backgroundColor: colors.accent },
          !complete && ratio > 0 && { borderWidth: 1, borderColor: colors.textSecondary },
        ]}
      />
      <View style={[styles.underline, selected && { backgroundColor: colors.accentLine }]} />
    </Pressable>
  );
}

export function WeekStrip({ selected, onSelect }: { selected: DayKey; onSelect: (d: DayKey) => void }) {
  const { colors } = useTheme();
  const today = todayKey();
  return (
    <View style={[styles.row, { borderBottomColor: colors.border }]} accessibilityRole="tablist">
      {DAY_KEYS.map((d) => (
        <DayTab key={d} day={d} selected={d === selected} isToday={d === today} onPress={() => onSelect(d)} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', borderBottomWidth: StyleSheet.hairlineWidth },
  tab: { flex: 1, alignItems: 'center', paddingTop: space.xs, gap: 6 },
  mark: { width: 5, height: 5, borderRadius: 3, backgroundColor: 'transparent' },
  underline: { height: 2, alignSelf: 'stretch', marginHorizontal: 8, backgroundColor: 'transparent' },
});
