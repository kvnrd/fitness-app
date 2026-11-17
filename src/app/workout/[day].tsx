import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ExerciseCard } from '../../components/ExerciseCard';
import { VideoHero } from '../../components/VideoHero';
import { EmptySetsFooter, RestTimerDock, type RestTimerState } from '../../components/RestTimerDock';
import { WeekStrip } from '../../components/WeekStrip';
import { Button, ProgressBar, SectionHeader, Text } from '../../components/ui';
import { DAY_KEYS, DAY_LABELS, DayKey, type Exercise } from '../../data/types';
import { useAppStore, useDayProgress } from '../../state/AppStore';
import { ScreenBackground } from '../../components/ScreenAtmosphere';
import { useTheme } from '../../theme/ThemeProvider';
import { space } from '../../theme/tokens';
import { previewWorkoutDay } from '../../preview/flags.ts';

export default function WorkoutDayScreen() {
  const { colors, family, fonts, minControlSize, radius } = useTheme();
  const params = useLocalSearchParams<{ day: string }>();
  const day = (previewWorkoutDay ?? (DAY_KEYS.includes(params.day as DayKey) ? params.day : 'mon')) as DayKey;
  const insets = useSafeAreaInsets();
  const { program } = useAppStore();
  const w = program.days[day];
  const { ratio, done, total } = useDayProgress(day);
  const aurora = family === 'aurora';
  const [notesOpen, setNotesOpen] = useState(false);
  const [rest, setRest] = useState<RestTimerState | null>(null);
  const restRef = useRef<RestTimerState | null>(null);
  restRef.current = rest;

  useEffect(() => {
    if (!aurora || process.env.EXPO_PUBLIC_SCREEN_PREVIEW !== '1') return;
    if (done === 0 || rest) return;
    const ex = w.exercises[0];
    if (ex?.restSeconds) {
      setRest({ remaining: 102, total: ex.restSeconds, nextLabel: 'set 4 next' });
    }
  }, [aurora, done, rest, w]);

  useEffect(() => {
    if (!rest) return;
    const id = setInterval(() => {
      setRest((cur) => {
        if (!cur) return cur;
        if (cur.remaining <= 1) return null;
        return { ...cur, remaining: cur.remaining - 1 };
      });
    }, 1000);
    return () => clearInterval(id);
  }, [rest != null]);

  const onChecked = (exercise: Exercise, _index: number, nowDone: boolean) => {
    if (!aurora || !nowDone || !exercise.restSeconds) return;
    const nextIdx = _index + 2; // "set N next" is 1-based next set
    setRest({
      remaining: exercise.restSeconds,
      total: exercise.restSeconds,
      nextLabel: nextIdx <= exercise.sets ? `set ${nextIdx} next` : 'last set done',
    });
  };

  const previewNote = w.keyPoints[0] ?? '';

  return (
    <ScreenBackground>
      <View style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={[
            styles.content,
            { paddingTop: insets.top + space.xs, paddingBottom: insets.bottom + (aurora ? (done === 0 ? 90 : 280) : 140) },
          ]}
        >
          <View style={styles.topBar}>
            <Pressable
              onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
              accessibilityRole="button"
              accessibilityLabel="Back to this week"
              hitSlop={12}
              style={[
                styles.back,
                aurora && {
                  backgroundColor: colors.glass,
                  borderColor: colors.glassBorder,
                  borderWidth: StyleSheet.hairlineWidth,
                  borderRadius: 22,
                  width: minControlSize,
                  paddingHorizontal: 0,
                  justifyContent: 'center',
                  marginLeft: 0,
                },
              ]}
            >
              <Ionicons name="chevron-back" size={22} color={colors.text} />
              {aurora ? null : (
                <Text variant="small" color={colors.textSecondary}>
                  {program.weekLabel}
                </Text>
              )}
            </Pressable>
            {aurora ? (
              <Text variant="small" style={{ fontFamily: fonts.bodySemi, flex: 1 }}>
                {program.weekLabel}
              </Text>
            ) : null}
          </View>

          <WeekStrip selected={day} onSelect={(d) => router.setParams({ day: d })} />

          {aurora ? (
            <View style={styles.auroraHead}>
              <View style={{ flex: 1, gap: 2 }}>
                <Text variant="label" color={colors.textSecondary}>
                  {DAY_LABELS[day].long} · {w.durationMin} min
                </Text>
                <Text variant="title" accessibilityRole="header">
                  {w.title}
                </Text>
              </View>
              <VideoHero day={w} trainerName={program.trainer.name} />
            </View>
          ) : (
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
          )}

          {!aurora ? <VideoHero day={w} trainerName={program.trainer.name} /> : null}

          {w.keyPoints.length ? (
            aurora ? (
              <Pressable
                onPress={() => setNotesOpen((o) => !o)}
                accessibilityRole="button"
                accessibilityState={{ expanded: notesOpen }}
                accessibilityLabel="Coach's notes"
                style={[
                  styles.notesRow,
                  {
                    backgroundColor: colors.glass,
                    borderColor: colors.glassBorder,
                    minHeight: 48,
                    borderRadius: 24,
                  },
                ]}
              >
                <Ionicons name="mic" size={20} color={colors.accentInk} />
                <Text variant="small" style={{ fontFamily: fonts.bodySemi }}>
                  Coach's notes
                </Text>
                <Text variant="small" color={colors.textSecondary} numberOfLines={1} style={{ flex: 1 }}>
                  {notesOpen ? '' : previewNote}
                </Text>
                <View style={{ width: minControlSize, height: minControlSize, alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name={notesOpen ? 'chevron-up' : 'chevron-down'} size={20} color={colors.textSecondary} />
                </View>
              </Pressable>
            ) : (
              <View>
                <SectionHeader title="Coach's notes" />
                {w.keyPoints.map((k, i) => (
                  <View key={i} style={styles.note}>
                    <View style={[styles.noteBar, { backgroundColor: colors.coach }]} />
                    <Text variant="body" style={{ flex: 1 }}>
                      {k}
                    </Text>
                  </View>
                ))}
              </View>
            )
          ) : null}

          {aurora && notesOpen && w.keyPoints.length ? (
            <View style={{ gap: space.xs, paddingHorizontal: space.sm }}>
              {w.keyPoints.map((k, i) => (
                <Text key={i} variant="small" color={colors.coach}>
                  {k}
                </Text>
              ))}
            </View>
          ) : null}

          {w.exercises.length ? (
            <View>
              {aurora ? null : (
                <SectionHeader
                  title="Workout"
                  right={
                    <Text variant="small" color={colors.textMuted} style={{ fontVariant: ['tabular-nums'] }}>
                      {done} of {total} sets
                    </Text>
                  }
                />
              )}
              {w.exercises.map((e, i) => (
                <ExerciseCard key={e.id} day={day} exercise={e} index={i} onChecked={onChecked} />
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

        {aurora && total > 0 && done === 0 ? <EmptySetsFooter done={done} total={total} /> : null}
        {aurora && total > 0 && done > 0 && rest ? (
          <RestTimerDock
            rest={rest}
            onAdjust={(d) => setRest((cur) => (cur ? { ...cur, remaining: Math.max(0, cur.remaining + d), total: Math.max(cur.total, cur.remaining + d) } : cur))}
            onSkip={() => setRest(null)}
            finishLabel={`Finish workout (${done} of ${total} sets)`}
            onFinish={() => router.back()}
          />
        ) : null}
        {aurora && total > 0 && done > 0 && !rest ? (
          <View style={[styles.finishOnly, { paddingBottom: insets.bottom + space.md, backgroundColor: colors.glass, borderColor: colors.glassBorder, borderRadius: radius.sheet }]}>
            <Button label={`Finish workout (${done} of ${total} sets)`} onPress={() => router.back()} />
          </View>
        ) : null}

        {!aurora && total > 0 ? (
          <View
            style={[
              styles.footer,
              { paddingBottom: insets.bottom + space.md, backgroundColor: colors.bg, borderTopColor: colors.border },
            ]}
          >
            <ProgressBar ratio={ratio} />
            <Button
              label={ratio >= 1 ? 'Save workout' : `Finish workout (${done} of ${total} sets)`}
              disabled={done === 0}
              onPress={() => router.back()}
            />
          </View>
        ) : null}
      </View>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: space.lg, gap: space.md, maxWidth: 640, width: '100%', alignSelf: 'center' },
  topBar: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  back: { flexDirection: 'row', alignItems: 'center', gap: 4, marginLeft: -6, minHeight: 44 },
  note: { flexDirection: 'row', gap: space.sm, paddingVertical: space.xs },
  noteBar: { width: 2, borderRadius: 1 },
  auroraHead: { flexDirection: 'row', gap: 12, alignItems: 'flex-end' },
  notesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingLeft: 16,
    paddingRight: 4,
    borderWidth: StyleSheet.hairlineWidth,
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    gap: space.sm,
    paddingHorizontal: space.lg,
    paddingTop: space.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  finishOnly: {
    position: 'absolute',
    left: 10,
    right: 10,
    bottom: 10,
    padding: 12,
    borderWidth: StyleSheet.hairlineWidth,
  },
});
