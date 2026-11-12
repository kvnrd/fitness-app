import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SectionHeader, Text } from '../../components/ui';
import { DAY_KEYS, DAY_LABELS } from '../../data/types';
import { rowsFor, useAppStore } from '../../state/AppStore';
import { colors, fonts, radius, space } from '../../theme/tokens';

/** Lightweight weekly summary; real history comes with the backend. */
export default function ProgressScreen() {
  const insets = useSafeAreaInsets();
  const { program, logs } = useAppStore();

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
    <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + space.lg }]}>
      <Text variant="hero" accessibilityRole="header">
        This week
      </Text>

      <View style={styles.stats}>
        <Stat value={String(sets)} label="sets logged" />
        <Stat value={volume.toLocaleString()} label="lb lifted" />
        <Stat value={String(Math.round(cardioKcal))} label="cardio kcal" />
      </View>

      <View>
        <SectionHeader title="Sets by day" />
        <View style={styles.chart}>
          {perDay.map(({ d, daySets }) => (
            <View key={d} style={styles.barCol} accessibilityLabel={`${DAY_LABELS[d].long}: ${daySets} sets`}>
              <View style={styles.barTrack}>
                <View style={[styles.bar, { height: `${(daySets / max) * 100}%` }]} />
              </View>
              <Text style={{ fontFamily: fonts.display, fontSize: 16 }} color={colors.textMuted}>
                {DAY_LABELS[d].short[0]}
              </Text>
            </View>
          ))}
        </View>
      </View>

      <Text variant="small" color={colors.textMuted}>
        Check off sets on the Train tab and they add up here. Full history and personal records come once accounts are connected.
      </Text>
    </ScrollView>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={{ fontFamily: fonts.displayBlack, fontSize: 44, lineHeight: 44 }}>{value}</Text>
      <Text variant="small" color={colors.textSecondary}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: space.lg, paddingBottom: space.xxl, gap: space.xl, maxWidth: 640, width: '100%', alignSelf: 'center' },
  stats: { flexDirection: 'row', borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border, paddingTop: space.md },
  stat: { flex: 1, gap: 2 },
  chart: { flexDirection: 'row', height: 140, gap: space.sm, alignItems: 'flex-end' },
  barCol: { flex: 1, alignItems: 'center', gap: 8, height: '100%' },
  barTrack: { flex: 1, width: '100%', justifyContent: 'flex-end', backgroundColor: colors.surfaceSunken, borderRadius: radius.sm, overflow: 'hidden' },
  bar: { width: '100%', backgroundColor: colors.text, minHeight: 2 },
});
