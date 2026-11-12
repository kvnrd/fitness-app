import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { todayKey } from '../../components/WeekStrip';
import { ProgressRing, SectionLabel, Text } from '../../components/ui';
import { DAY_KEYS, DAY_LABELS, DayKey } from '../../data/types';
import { useAppStore, useDayProgress } from '../../state/AppStore';
import { colors, radius, space } from '../../theme/tokens';

function greeting(d = new Date()) {
  const h = d.getHours();
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
}

function TodayCard({ day }: { day: DayKey }) {
  const { program } = useAppStore();
  const w = program.days[day];
  const { ratio, done, total } = useDayProgress(day);
  return (
    <Pressable
      onPress={() => router.push(`/workout/${day}`)}
      accessibilityRole="button"
      accessibilityLabel={`Open ${DAY_LABELS[day].long}: ${w.title}`}
      style={({ pressed }) => [styles.today, pressed && { transform: [{ scale: 0.99 }] }]}
    >
      <LinearGradient
        colors={['#1F2214', '#131315']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Text variant="label" color={colors.accent}>
          Today · {DAY_LABELS[day].long}
        </Text>
        <ProgressRing ratio={ratio} size={48}>
          <Text variant="small" style={{ fontWeight: '700', fontSize: 12 }}>
            {Math.round(ratio * 100)}%
          </Text>
        </ProgressRing>
      </View>
      <View style={{ gap: 6 }}>
        <Text variant="hero">{w.title}</Text>
        <Text variant="body" color={colors.textSecondary}>
          {w.focus}
        </Text>
      </View>
      <View style={styles.todayMeta}>
        <Meta icon="time-outline" label={`${w.durationMin} min`} />
        <Meta icon="list-outline" label={`${w.exercises.length} ${w.exercises.length === 1 ? 'exercise' : 'exercises'}`} />
        {total > 0 ? <Meta icon="checkmark-done-outline" label={`${done}/${total} sets`} /> : null}
      </View>
      <View style={styles.cta}>
        <Text variant="bodyStrong" color={colors.accentText}>
          {ratio > 0 ? 'Continue workout' : w.rest ? 'View recovery' : 'Start workout'}
        </Text>
        <Ionicons name="arrow-forward" size={18} color={colors.accentText} />
      </View>
    </Pressable>
  );
}

function Meta({ icon, label }: { icon: keyof typeof Ionicons.glyphMap; label: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      <Ionicons name={icon} size={15} color={colors.textSecondary} />
      <Text variant="small" color={colors.textSecondary}>
        {label}
      </Text>
    </View>
  );
}

function DayRow({ day, isToday }: { day: DayKey; isToday: boolean }) {
  const { program } = useAppStore();
  const w = program.days[day];
  const { ratio } = useDayProgress(day);
  const complete = ratio >= 1;
  return (
    <Pressable
      onPress={() => router.push(`/workout/${day}`)}
      accessibilityRole="button"
      accessibilityLabel={`${DAY_LABELS[day].long}: ${w.title}`}
      style={({ pressed }) => [styles.dayRow, isToday && styles.dayRowToday, pressed && { backgroundColor: colors.surfaceRaised }]}
    >
      <View style={styles.dayBadge}>
        <Text variant="label" color={isToday ? colors.accent : colors.textMuted} style={{ letterSpacing: 0.8 }}>
          {DAY_LABELS[day].short}
        </Text>
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <Text variant="bodyStrong" color={w.rest ? colors.textSecondary : colors.text}>
          {w.title}
        </Text>
        <Text variant="small" color={colors.textMuted} numberOfLines={1}>
          {w.rest ? 'Rest day' : `${w.durationMin} min · ${w.focus}`}
        </Text>
      </View>
      {complete ? (
        <View style={styles.doneBadge}>
          <Ionicons name="checkmark" size={14} color={colors.accentText} />
        </View>
      ) : ratio > 0 ? (
        <ProgressRing ratio={ratio} size={26} stroke={3} />
      ) : (
        <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
      )}
    </Pressable>
  );
}

export default function TrainScreen() {
  const insets = useSafeAreaInsets();
  const { program } = useAppStore();
  const today = todayKey();

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + space.lg }]}
    >
      <View style={styles.header}>
        <View style={{ gap: 4, flex: 1 }}>
          <Text variant="small" color={colors.textMuted}>
            {greeting()}
          </Text>
          <Text variant="title">{program.trainer.programName}</Text>
          <Text variant="small" color={colors.textSecondary}>
            {program.weekLabel} · with {program.trainer.name}
          </Text>
        </View>
        <View style={styles.avatar}>
          <Text variant="bodyStrong" color={colors.accent}>
            {program.trainer.name
              .split(' ')
              .map((p) => p[0])
              .join('')}
          </Text>
        </View>
      </View>

      <TodayCard day={today} />

      <View>
        <SectionLabel>This week</SectionLabel>
        <View style={{ gap: space.xs }}>
          {DAY_KEYS.map((d) => (
            <DayRow key={d} day={d} isToday={d === today} />
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: space.lg, paddingBottom: space.xxl, gap: space.xl, maxWidth: 720, width: '100%', alignSelf: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  today: {
    borderRadius: radius.xl,
    overflow: 'hidden',
    padding: space.lg,
    gap: space.lg,
    borderWidth: 1,
    borderColor: '#2A2F18',
  },
  todayMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: space.md },
  cta: {
    backgroundColor: colors.accent,
    borderRadius: radius.pill,
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.xs,
  },
  dayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    padding: space.md,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  dayRowToday: { borderColor: colors.accent, borderWidth: 1 },
  dayBadge: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceSunken,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
