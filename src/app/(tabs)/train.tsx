import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { aiStepRoute, healthScreenAiPaused, nextAiStep } from '../../ai/flow';
import { useAiPlan } from '../../ai/useAiPlan';
import { AURORA_TAB_BAR_RESERVE } from '../../components/AuroraTabBar';
import { HeroNumeral } from '../../components/HeroNumeral';
import { todayKey } from '../../components/WeekStrip';
import { Button, ProgressBar, SectionHeader, Text } from '../../components/ui';
import { DAY_KEYS, DAY_LABELS, DayKey } from '../../data/types';
import { shortDay } from '../../theme/dayLabels.ts';
import { WORKOUTS_LOCKED_NOTICE } from '../../onboarding/copy';
import { useAppStore, useDayProgress } from '../../state/AppStore';
import { useTheme } from '../../theme/ThemeProvider';
import { ScreenBackground } from '../../components/ScreenAtmosphere';
import { AiNotice } from '../../components/AiNotice';
import { PlanOverview } from '../../ai/PlanOverview';
import { endAiPlan } from '../../ai/api';

// Proposed to Kevin on 2026-11-27 (he asked for this button); wording pending his OK.
const NEW_PLAN_BUTTON = 'Start a new AI plan';
const NEW_PLAN_CONFIRM_TITLE = 'Start a new AI plan?';
const NEW_PLAN_CONFIRM_BODY = 'This ends your current plan. Workouts you’ve logged are kept.';
const NEW_PLAN_CONFIRM_ACTION = 'End plan';
import { HealthScreenPausedBanner } from '../../components/HealthScreenPausedBanner';
import { useSession } from '../../auth/SessionProvider';
import { space } from '../../theme/tokens';

function plural(n: number, word: string) {
  return `${n} ${word}${n === 1 ? '' : 's'}`;
}

function Today({ day }: { day: DayKey }) {
  const { colors, family, radius } = useTheme();
  const { program, locked } = useAppStore();
  const w = program.days[day];
  const { ratio, done, total } = useDayProgress(day);
  const action = w.rest ? 'View recovery plan' : ratio >= 1 ? 'Review workout' : ratio > 0 ? 'Continue workout' : 'Start workout';

  const inner = (
    <View style={{ gap: space.lg }}>
      <View style={{ gap: space.xs }}>
        {family === 'aurora' ? (
          <HeroNumeral variant="stamp" accessibilityRole="header">
            {DAY_LABELS[day].long}
          </HeroNumeral>
        ) : (
          <Text variant="stamp" accessibilityRole="header">
            {DAY_LABELS[day].long}
          </Text>
        )}
        <Text variant="title">{w.title}</Text>
        <Text variant="body" color={colors.textSecondary}>
          {w.rest
            ? 'Rest day. Walk and mobility only.'
            : `${w.durationMin} min, ${plural(w.exercises.length, 'exercise')}${done > 0 ? `, ${done} of ${total} sets logged` : ''}`}
        </Text>
      </View>
      <Button label={action} disabled={locked} onPress={() => router.push(`/workout/${day}`)} />
      {total > 0 ? <ProgressBar ratio={ratio} /> : null}
    </View>
  );
  if (family !== 'aurora') return inner;
  return (
    <View style={{ backgroundColor: colors.glass, borderColor: colors.glassBorder, borderWidth: StyleSheet.hairlineWidth, borderRadius: radius.hero, padding: 20, gap: space.sm }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Text variant="label" style={{ fontWeight: '600' }}>Today</Text>
        {total > 0 ? (
          <Text variant="label" color={colors.textSecondary}>
            {done} of {total} sets logged
          </Text>
        ) : null}
      </View>
      {inner}
    </View>
  );
}

function DayRow({ day, isToday }: { day: DayKey; isToday: boolean }) {
  const { colors, fonts, family } = useTheme();
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
        {shortDay(day, family)}
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
  const { colors, fonts, family, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const { program, locked, reload } = useAppStore();
  const { start, notice, state, refresh } = useAiPlan();
  const { onboarding } = useSession();
  const teen = !!onboarding?.is_minor;
  const today = todayKey();
  const initials = program.trainer.name
    .split(' ')
    .map((p) => p[0])
    .join('');
  const hasAi = !!state?.planAccepted || program.aiGenerated;

  function confirmNewPlan() {
    Alert.alert(NEW_PLAN_CONFIRM_TITLE, NEW_PLAN_CONFIRM_BODY, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: NEW_PLAN_CONFIRM_ACTION,
        style: 'destructive',
        onPress: () => {
          void (async () => {
            if (!(await endAiPlan())) return;
            reload();
            // Route from the fresh server state (the hook's state still says a plan is accepted).
            const fresh = await refresh();
            router.push(fresh ? aiStepRoute(nextAiStep(fresh)) : '/ai/health-switch');
          })();
        },
      },
    ]);
  }

  return (
    <ScreenBackground>
    <ScrollView
      style={{ flex: 1, backgroundColor: 'transparent' }}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + space.md, paddingBottom: space['4xl'] + (family === 'aurora' ? AURORA_TAB_BAR_RESERVE + insets.bottom : 0) }]}
    >
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text variant="small" color={colors.textMuted} style={{ fontFamily: fonts.bodyBold, letterSpacing: 0.8, textTransform: 'uppercase' }}>Your plan</Text>
          <Text variant="title">{program.trainer.programName}</Text>
          <Text variant="small" color={colors.textSecondary}>
            {program.weekLabel}
            {program.trainer.name ? <> with <Text variant="small" color={colors.coach}>{program.trainer.name}</Text></> : null}
          </Text>
        </View>
        {hasAi ? (
          <View style={{ paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, borderWidth: 1, borderColor: colors.borderStrong }}>
            <Text color={colors.textSecondary} style={{ fontFamily: fonts.bodyBold, fontSize: 12, letterSpacing: 0.8, textTransform: 'uppercase' }}>
              AI plan
            </Text>
          </View>
        ) : program.trainer.name ? (
          <View style={[styles.avatar, { borderColor: colors.coach }]} accessibilityLabel={`Coach ${program.trainer.name}`}>
            <Text variant="small" color={colors.coach} style={{ fontFamily: fonts.bodySemi }}>
              {initials}
            </Text>
          </View>
        ) : null}
      </View>

      {locked ? (
        <View accessibilityLiveRegion="polite" style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 16, padding: space.md, backgroundColor: colors.surface }}>
          <Text variant="small" color={colors.textSecondary}>
            {WORKOUTS_LOCKED_NOTICE}
          </Text>
        </View>
      ) : null}

      {state && healthScreenAiPaused(state) ? (
        <HealthScreenPausedBanner teen={teen} onUpdate={() => router.push('/ai/health')} />
      ) : null}
      {hasAi && notice === 'banner' ? <AiNotice /> : null}
      {program.aiGenerated ? <PlanOverview text={program.overview} /> : null}

      {!hasAi && process.env.EXPO_PUBLIC_SCREEN_PREVIEW !== '1' ? (
        <Button label="Build an AI plan" onPress={start} />
      ) : null}

      <Today day={today} />

      <View>
        <SectionHeader title="This week" />
        <View>
          {DAY_KEYS.map((d) => (
            <DayRow key={d} day={d} isToday={d === today} />
          ))}
        </View>
      </View>
      {program.aiGenerated ? <Button label={NEW_PLAN_BUTTON} variant="secondary" onPress={confirmNewPlan} /> : null}
      {hasAi && notice === 'footer' ? <AiNotice variant="footer" /> : null}
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
