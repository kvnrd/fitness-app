import { AURORA_TAB_BAR_RESERVE } from '../../components/AuroraTabBar';
import { HeroNumeral } from '../../components/HeroNumeral';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { SectionHeader, Text } from '../../components/ui';
import { DAY_KEYS, DAY_LABELS } from '../../data/types';
import { shortDay } from '../../theme/dayLabels.ts';
import { rowsFor, useAppStore } from '../../state/AppStore';
import { useTheme } from '../../theme/ThemeProvider';
import { useAiPlan } from '../../ai/useAiPlan';
import { AiNotice } from '../../components/AiNotice';
import { ScreenBackground } from '../../components/ScreenAtmosphere';
import { radius, space } from '../../theme/tokens';
import { loadConsents } from '../../auth/consents';
import { useSession } from '../../auth/SessionProvider';
import { addPhotosEntry } from '../../progress/addPhotosRoute.ts';
import { PhotoGalleryScreen } from '../../progress/screens/PhotoGallery';
import { ProgressChips, type ProgressChip } from '../../progress/screens/ProgressChips';
import { ProgressWeightScreen } from '../../progress/screens/ProgressWeight';
import { weightSurfaceState } from '../../progress/weightGate.ts';
import { deviceSetupStore } from '../../onboarding/deviceStorage';

/** Lightweight weekly summary; real history comes with the backend. */
export default function ProgressScreen() {
  const { colors, fonts, family, radius: r } = useTheme();
  const insets = useSafeAreaInsets();
  const aurora = family === 'aurora';
  const { program, logs } = useAppStore();
  const { notice } = useAiPlan();
  const { user, onboarding } = useSession();
  const teen = !!onboarding?.is_minor;
  const [chip, setChip] = useState<ProgressChip>('Week');
  const [healthSelf, setHealthSelf] = useState(false);
  const [healthParent, setHealthParent] = useState(false);
  const [trendLabel, setTrendLabel] = useState<string | undefined>();
  const [unit, setUnit] = useState<string | undefined>();
  const [goalLabel, setGoalLabel] = useState<string | undefined>();

  useEffect(() => {
    if (!user) return;
    void loadConsents(user.id).then((r) => {
      if (r.ok) {
        setHealthSelf(r.state.health_data.self);
        setHealthParent(r.state.health_data.parent);
      }
    });
    void deviceSetupStore.loadWeightGoal(user.id).then((w) => {
      if (w && w.current != null) {
        setTrendLabel(String(w.current));
        setUnit(w.unit);
      }
      if (w && w.target != null) setGoalLabel(`Goal · ${w.target} ${w.unit}`);
    }).catch(() => {});
  }, [user]);

  const surface = weightSurfaceState({ isMinor: teen, healthSelf, healthParent });

  let sets = 0;
  let volume = 0;
  let cardioKcal = 0;
  const perDay = DAY_KEYS.map((d) => {
    let daySets = 0;
    for (const e of program.days[d].exercises) {
      for (const r of rowsFor(logs[d], e)) {
        if (!r.done) continue;
        daySets++;
        volume += (parseFloat(r.weight ?? '') || 0) * (parseFloat(r.reps ?? '') || 0);
        cardioKcal += parseFloat(r.calories ?? '') || 0;
      }
    }
    sets += daySets;
    return { d, daySets };
  });
  const max = Math.max(1, ...perDay.map((p) => p.daySets));

  return (
    <ScreenBackground>
    <ScrollView
      style={{ flex: 1, backgroundColor: 'transparent' }}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + space.lg, paddingBottom: space['4xl'] + (aurora ? AURORA_TAB_BAR_RESERVE + insets.bottom : 0) }]}
    >
      {aurora ? <Text variant="small" color={colors.textSecondary}>{program.weekLabel}</Text> : null}
      <Text variant={aurora ? 'title' : 'hero'} accessibilityRole="header">
        {chip === 'Week' ? 'This week' : 'Progress'}
      </Text>
      <ProgressChips isMinor={teen} selected={chip} onSelect={setChip} />

      {chip === 'Weight' ? (
        <ProgressWeightScreen
          surface={surface}
          healthSelf={healthSelf}
          healthParent={healthParent}
          model={surface.showValues && trendLabel ? {
            trendLabel,
            unit: unit ?? 'lb',
            goalLabel: surface.showGoal ? goalLabel : undefined,
            accessibilityLabel: `Trend weight ${trendLabel} ${unit ?? 'lb'}`,
          } : null}
          onConnectHealth={surface.showValues ? () => router.push('/settings/privacy') : undefined}
        />
      ) : null}
      {chip === 'Photos' && !teen ? (
        <PhotoGalleryScreen
          items={[]}
          onAdd={() => {
            const step = addPhotosEntry({ isMinor: false, photoOptedIn: false });
            if (step.step === 'opt_in') router.push('/photos/opt-in');
            else router.push('/photos/add');
          }}
        />
      ) : null}

      {chip === 'Week' && aurora ? (
        <View style={{ backgroundColor: colors.glass, borderColor: colors.glassBorder, borderWidth: StyleSheet.hairlineWidth, borderRadius: r.hero, padding: 20, gap: 8 }}>
          <Text variant="label" color={colors.textSecondary}>Volume lifted</Text>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8 }}>
            <HeroNumeral variant="stamp">{volume.toLocaleString()}</HeroNumeral>
            <Text variant="body" color={colors.textSecondary}>lb</Text>
          </View>
          <View style={[styles.stats, { borderTopColor: colors.glassBorder, marginTop: 8 }]}>
            <View style={styles.stat}>
              <HeroNumeral variant="hero">{String(sets)}</HeroNumeral>
              <Text variant="label" color={colors.textSecondary}>sets logged</Text>
            </View>
            <View style={styles.stat}>
              <HeroNumeral variant="hero">{String(Math.round(cardioKcal))}</HeroNumeral>
              <Text variant="label" color={colors.textSecondary}>cardio kcal</Text>
            </View>
          </View>
        </View>
      ) : chip === 'Week' ? (
      <View style={[styles.stats, { borderTopColor: colors.border }]}>
        <Stat value={String(sets)} label="sets logged" />
        <Stat value={volume.toLocaleString()} label="lb lifted" />
        <Stat value={String(Math.round(cardioKcal))} label="cardio kcal" />
      </View>
      ) : null}

      {chip === 'Week' ? <View>
        <SectionHeader title="Sets by day" />
        <View style={styles.chart}>
          {perDay.map(({ d, daySets }) => (
            <View key={d} style={styles.barCol} accessibilityLabel={`${DAY_LABELS[d].long}: ${daySets} sets`}>
              <View style={[styles.barTrack, { backgroundColor: colors.surfaceSunken }]}>
                <View style={[styles.bar, { height: `${(daySets / max) * 100}%`, backgroundColor: colors.accent }]} />
              </View>
              <Text style={{ fontFamily: fonts.displayBold, fontSize: 16 }} color={colors.textMuted}>
                {shortDay(d, family)}
              </Text>
            </View>
          ))}
        </View>
      </View> : null}

      {chip === 'Week' ? (
      <Text variant="small" color={colors.textMuted}>
        Check off sets on the Train tab and they add up here. Full history and personal records come once accounts are connected.
      </Text>
      ) : null}
          {notice === 'footer' ? <AiNotice variant="footer" /> : null}
    </ScrollView>
    </ScreenBackground>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  const { colors, fonts } = useTheme();
  return (
    <View style={styles.stat}>
      <Text style={{ fontFamily: fonts.displayHeavy, fontSize: 44, lineHeight: 44 }}>{value}</Text>
      <Text variant="small" color={colors.textSecondary}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: space.lg, paddingBottom: space['4xl'], gap: space['2xl'], maxWidth: 640, width: '100%', alignSelf: 'center' },
  stats: { flexDirection: 'row', borderTopWidth: StyleSheet.hairlineWidth, paddingTop: space.md },
  stat: { flex: 1, gap: 2 },
  chart: { flexDirection: 'row', height: 140, gap: space.sm, alignItems: 'flex-end' },
  barCol: { flex: 1, alignItems: 'center', gap: 8, height: '100%' },
  barTrack: { flex: 1, width: '100%', justifyContent: 'flex-end', borderRadius: radius.tile, overflow: 'hidden' },
  bar: { width: '100%', minHeight: 2 },
  optionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: space.xs, alignItems: 'center' },
  swatchRing: { width: 40, height: 40, borderRadius: 20, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  swatch: { width: 28, height: 28, borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, alignItems: 'center', justifyContent: 'center' },
});
