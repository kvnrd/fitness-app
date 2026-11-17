import { AURORA_TAB_BAR_RESERVE } from '../../components/AuroraTabBar';
import { HeroNumeral } from '../../components/HeroNumeral';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SectionHeader, Text } from '../../components/ui';
import { DAY_KEYS, DAY_LABELS } from '../../data/types';
import { shortDay } from '../../theme/dayLabels.ts';
import { rowsFor, useAppStore } from '../../state/AppStore';
import { useTheme } from '../../theme/ThemeProvider';
import { useAiPlan } from '../../ai/useAiPlan';
import { AiNotice } from '../../components/AiNotice';
import { ScreenBackground } from '../../components/ScreenAtmosphere';
import { radius, space } from '../../theme/tokens';

/** Lightweight weekly summary; real history comes with the backend. */
export default function ProgressScreen() {
  const { colors, fonts, family, radius: r } = useTheme();
  const insets = useSafeAreaInsets();
  const aurora = family === 'aurora';
  const { program, logs } = useAppStore();
  const { notice } = useAiPlan();

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
        This week
      </Text>

      {aurora ? (
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
      ) : (
      <View style={[styles.stats, { borderTopColor: colors.border }]}>
        <Stat value={String(sets)} label="sets logged" />
        <Stat value={volume.toLocaleString()} label="lb lifted" />
        <Stat value={String(Math.round(cardioKcal))} label="cardio kcal" />
      </View>
      )}

      <View>
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
      </View>


      <Text variant="small" color={colors.textMuted}>
        Check off sets on the Train tab and they add up here. Full history and personal records come once accounts are connected.
      </Text>
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
