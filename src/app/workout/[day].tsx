import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ExerciseCard } from '../../components/ExerciseCard';
import { VideoHero } from '../../components/VideoHero';
import { WeekStrip } from '../../components/WeekStrip';
import { Button, Card, ProgressRing, SectionLabel, Text } from '../../components/ui';
import { DAY_KEYS, DAY_LABELS, DayKey } from '../../data/types';
import { useAppStore, useDayProgress } from '../../state/AppStore';
import { colors, radius, space } from '../../theme/tokens';

export default function WorkoutDayScreen() {
  const params = useLocalSearchParams<{ day: string }>();
  const day = (DAY_KEYS.includes(params.day as DayKey) ? params.day : 'mon') as DayKey;
  const insets = useSafeAreaInsets();
  const { program } = useAppStore();
  const w = program.days[day];
  const { ratio, done, total } = useDayProgress(day);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + space.sm, paddingBottom: insets.bottom + 120 }]}>
        <View style={styles.topBar}>
          <Pressable
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
            accessibilityRole="button"
            accessibilityLabel="Back"
            hitSlop={10}
            style={styles.iconBtn}
          >
            <Ionicons name="chevron-back" size={22} color={colors.text} />
          </Pressable>
          <Text variant="label" color={colors.textMuted}>
            {program.weekLabel}
          </Text>
          <View style={{ width: 40 }} />
        </View>

        <WeekStrip selected={day} onSelect={(d) => router.setParams({ day: d })} />

        <View style={{ gap: 6 }}>
          <Text variant="label" color={colors.accent}>
            {DAY_LABELS[day].long}
          </Text>
          <Text variant="hero">{w.title}</Text>
          <Text variant="body" color={colors.textSecondary}>
            {w.focus} · {w.durationMin} min
          </Text>
        </View>

        <VideoHero day={w} trainerName={program.trainer.name} />

        {w.keyPoints.length ? (
          <Card>
            <SectionLabel>Key points from your coach</SectionLabel>
            <View style={{ gap: space.sm }}>
              {w.keyPoints.map((k, i) => (
                <View key={i} style={{ flexDirection: 'row', gap: space.sm }}>
                  <View style={styles.bullet} />
                  <Text variant="body" style={{ flex: 1 }}>
                    {k}
                  </Text>
                </View>
              ))}
            </View>
          </Card>
        ) : null}

        {w.exercises.length ? (
          <View>
            <SectionLabel
              right={
                <Text variant="small" color={colors.textMuted} style={{ fontVariant: ['tabular-nums'] }}>
                  {done}/{total} sets
                </Text>
              }
            >
              Workout
            </SectionLabel>
            <View style={{ gap: space.sm }}>
              {w.exercises.map((e, i) => (
                <ExerciseCard key={e.id} day={day} exercise={e} index={i} />
              ))}
            </View>
          </View>
        ) : (
          <Card>
            <Text variant="heading">Recovery day</Text>
            <Text variant="body" color={colors.textSecondary} style={{ marginTop: 6 }}>
              Nothing to log today. Follow the key points above and come back fresh tomorrow.
            </Text>
          </Card>
        )}
      </ScrollView>

      {total > 0 ? (
        <View style={[styles.footer, { paddingBottom: insets.bottom + space.md }]}>
          <ProgressRing ratio={ratio} size={44}>
            <Text variant="small" style={{ fontSize: 11, fontWeight: '700' }}>
              {Math.round(ratio * 100)}%
            </Text>
          </ProgressRing>
          <Button
            label={ratio >= 1 ? 'Workout complete' : 'Finish workout'}
            style={{ flex: 1 }}
            disabled={ratio === 0}
            onPress={() => router.back()}
          />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: space.lg, gap: space.xl, maxWidth: 720, width: '100%', alignSelf: 'center' },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  bullet: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.accent, marginTop: 9 },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingHorizontal: space.lg,
    paddingTop: space.md,
    backgroundColor: 'rgba(10,10,11,0.94)',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
  },
});
