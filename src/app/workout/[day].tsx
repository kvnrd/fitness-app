import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ExerciseCard } from '../../components/ExerciseCard';
import { VideoHero } from '../../components/VideoHero';
import { WeekStrip } from '../../components/WeekStrip';
import { Button, ProgressBar, SectionHeader, Text } from '../../components/ui';
import { DAY_KEYS, DAY_LABELS, DayKey } from '../../data/types';
import { useAppStore, useDayProgress } from '../../state/AppStore';
import { colors, space } from '../../theme/tokens';

export default function WorkoutDayScreen() {
  const params = useLocalSearchParams<{ day: string }>();
  const day = (DAY_KEYS.includes(params.day as DayKey) ? params.day : 'mon') as DayKey;
  const insets = useSafeAreaInsets();
  const { program } = useAppStore();
  const w = program.days[day];
  const { ratio, done, total } = useDayProgress(day);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + space.xs, paddingBottom: insets.bottom + 140 }]}>
        <View style={styles.topBar}>
          <Pressable
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
            accessibilityRole="button"
            accessibilityLabel="Back to this week"
            hitSlop={12}
            style={styles.back}
          >
            <Ionicons name="chevron-back" size={22} color={colors.text} />
            <Text variant="small" color={colors.textSecondary}>
              {program.weekLabel}
            </Text>
          </Pressable>
        </View>

        <WeekStrip selected={day} onSelect={(d) => router.setParams({ day: d })} />

        <View style={{ gap: space.xs }}>
          <Text variant="body" color={colors.textSecondary}>
            {DAY_LABELS[day].long}, {w.durationMin} min
          </Text>
          <Text variant="hero" accessibilityRole="header">
            {w.title}
          </Text>
          <Text variant="body" color={colors.textSecondary}>
            {w.focus}
          </Text>
        </View>

        <VideoHero day={w} trainerName={program.trainer.name} />

        {w.keyPoints.length ? (
          <View>
            <SectionHeader title="Coach's notes" />
            {w.keyPoints.map((k, i) => (
              <View key={i} style={styles.note}>
                <View style={styles.noteBar} />
                <Text variant="body" style={{ flex: 1 }}>
                  {k}
                </Text>
              </View>
            ))}
          </View>
        ) : null}

        {w.exercises.length ? (
          <View>
            <SectionHeader
              title="Workout"
              right={
                <Text variant="small" color={colors.textMuted} style={{ fontVariant: ['tabular-nums'] }}>
                  {done} of {total} sets
                </Text>
              }
            />
            {w.exercises.map((e, i) => (
              <ExerciseCard key={e.id} day={day} exercise={e} index={i} />
            ))}
          </View>
        ) : (
          <View style={{ gap: space.xs }}>
            <Text variant="title">Nothing to log today</Text>
            <Text variant="body" color={colors.textSecondary}>
              Follow the notes above and come back fresh tomorrow.
            </Text>
          </View>
        )}
      </ScrollView>

      {total > 0 ? (
        <View style={[styles.footer, { paddingBottom: insets.bottom + space.md }]}>
          <ProgressBar ratio={ratio} />
          <Button
            label={ratio >= 1 ? 'Save workout' : `Finish workout (${done} of ${total} sets)`}
            disabled={done === 0}
            onPress={() => router.back()}
          />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: space.lg, gap: space.xl, maxWidth: 640, width: '100%', alignSelf: 'center' },
  topBar: { flexDirection: 'row', alignItems: 'center' },
  back: { flexDirection: 'row', alignItems: 'center', gap: 4, marginLeft: -6, minHeight: 44 },
  note: { flexDirection: 'row', gap: space.sm, paddingVertical: space.xs },
  noteBar: { width: 2, borderRadius: 1, backgroundColor: colors.coach },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    gap: space.sm,
    paddingHorizontal: space.lg,
    paddingTop: space.sm,
    backgroundColor: colors.bg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
});
