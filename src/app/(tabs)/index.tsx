import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { todayKey } from '../../components/WeekStrip';
import { Button, ProgressBar, SectionHeader, Text } from '../../components/ui';
import { DAY_KEYS, DAY_LABELS, DayKey } from '../../data/types';
import { useAppStore, useDayProgress } from '../../state/AppStore';
import { useTheme } from '../../theme/ThemeProvider';
import { ScreenBackground } from '../../components/ScreenAtmosphere';
import { space } from '../../theme/tokens';

function plural(n: number, word: string) {
  return `${n} ${word}${n === 1 ? '' : 's'}`;
}

function Today({ day }: { day: DayKey }) {
  const { colors } = useTheme();
  const { program } = useAppStore();
  const w = program.days[day];
  const { ratio, done, total } = useDayProgress(day);
  const action = w.rest ? 'View recovery plan' : ratio >= 1 ? 'Review workout' : ratio > 0 ? 'Continue workout' : 'Start workout';

  return (
    <View style={{ gap: space.lg }}>
      <View style={{ gap: space.xs }}>
        <Text variant="stamp" accessibilityRole="header">
          {DAY_LABELS[day].long}
        </Text>
        <Text variant="title">{w.title}</Text>
        <Text variant="body" color={colors.textSecondary}>
          {w.rest
            ? 'Rest day. Walk and mobility only.'
            : `${w.durationMin} min, ${plural(w.exercises.length, 'exercise')}${done > 0 ? `, ${done} of ${total} sets logged` : ''}`}
        </Text>
      </View>
      <Button label={action} onPress={() => router.push(`/workout/${day}`)} />
      {total > 0 ? <ProgressBar ratio={ratio} /> : null}
    </View>
  );
}

function DayRow({ day, isToday }: { day: DayKey; isToday: boolean }) {
  const { colors, fonts } = useTheme();
  const { program } = useAppStore();
  const w = program.days[day];
  const { ratio } = useDayProgress(day);
  const complete = ratio >= 1;
  return (
    <Pressable
      onPress={() => router.push(`/workout/${day}`)}
      accessibilityRole="button"
      accessibilityLabel={`${DAY_LABELS[day].long}${isToday ? ', today' : ''}: ${w.title}${complete ? ', completed' : ''}`}
      style={({ pressed }) => [styles.dayRow, { borderTopColor: colors.border }, pressed && { backgroundColor: colors.surfaceSunken }]}
    >
      <Text style={[styles.dayName, { fontFamily: fonts.displayBold }]} color={isToday ? colors.text : colors.textMuted}>
        {DAY_LABELS[day].short}
      </Text>
      <Text variant="bodyStrong" color={w.rest ? colors.textSecondary : colors.text} style={{ flex: 1 }} numberOfLines={1}>
        {w.title}
      </Text>
      <Text variant="small" color={colors.textMuted} style={{ fontVariant: ['tabular-nums'] }}>
        {w.rest ? 'Rest' : `${w.durationMin} min`}
      </Text>
      <View
        style={[
          styles.status,
          { borderColor: colors.borderStrong },
          complete && { backgroundColor: colors.accent, borderColor: colors.accent },
          !complete && ratio > 0 && { borderColor: colors.textSecondary },
        ]}
      >
        {complete ? <Ionicons name="checkmark" size={12} color={colors.accentText} /> : null}
      </View>
    </Pressable>
  );
}

export default function TrainScreen() {
  const { colors, fonts } = useTheme();
  const insets = useSafeAreaInsets();
  const { program } = useAppStore();
  const today = todayKey();
  const initials = program.trainer.name
    .split(' ')
    .map((p) => p[0])
    .join('');

  return (
    <ScreenBackground>
    <ScrollView
      style={{ flex: 1, backgroundColor: 'transparent' }}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + space.md }]}
    >
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text variant="bodyStrong">{program.trainer.programName}</Text>
          <Text variant="small" color={colors.textSecondary}>
            {program.weekLabel} with <Text variant="small" color={colors.coach}>{program.trainer.name}</Text>
          </Text>
        </View>
        <View style={[styles.avatar, { borderColor: colors.coach }]} accessibilityLabel={`Coach ${program.trainer.name}`}>
          <Text variant="small" color={colors.coach} style={{ fontFamily: fonts.bodySemi }}>
            {initials}
          </Text>
        </View>
      </View>

      <Today day={today} />

      <View>
        <SectionHeader title="This week" />
        <View>
          {DAY_KEYS.map((d) => (
            <DayRow key={d} day={d} isToday={d === today} />
          ))}
        </View>
      </View>
    </ScrollView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: space.lg, paddingBottom: space['4xl'], gap: space['4xl'], maxWidth: 640, width: '100%', alignSelf: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingVertical: space.md,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  dayName: { fontSize: 20, lineHeight: 24, width: 44 },
  status: { width: 18, height: 18, borderRadius: 9, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
});
