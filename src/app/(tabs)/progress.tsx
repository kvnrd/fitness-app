import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Card, SectionLabel, Text } from '../../components/ui';
import { DAY_KEYS, DAY_LABELS } from '../../data/types';
import { rowsFor, useAppStore } from '../../state/AppStore';
import { colors, radius, space } from '../../theme/tokens';

/** Lightweight progress view for the MVP; real history comes with the backend. */
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
      <Text variant="title">Progress</Text>

      <View style={styles.stats}>
        <Stat label="Sets done" value={String(sets)} />
        <Stat label="Volume (lb)" value={volume.toLocaleString()} />
        <Stat label="Cardio kcal" value={String(Math.round(cardioKcal))} />
      </View>

      <Card>
        <SectionLabel>Sets this week</SectionLabel>
        <View style={styles.chart}>
          {perDay.map(({ d, daySets }) => (
            <View key={d} style={styles.barCol}>
              <View style={styles.barTrack}>
                <View style={[styles.bar, { height: `${(daySets / max) * 100}%` }]} />
              </View>
              <Text variant="label" color={colors.textMuted} style={{ letterSpacing: 0.4 }}>
                {DAY_LABELS[d].short[0]}
              </Text>
            </View>
          ))}
        </View>
      </Card>

      <Text variant="small" color={colors.textMuted}>
        Log sets on the Train tab to see them here. Full history and personal records arrive once accounts are connected.
      </Text>
    </ScrollView>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Card style={{ flex: 1, gap: 6 }}>
      <Text variant="metric">{value}</Text>
      <Text variant="small" color={colors.textMuted}>
        {label}
      </Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: space.lg, paddingBottom: space.xxl, gap: space.xl, maxWidth: 720, width: '100%', alignSelf: 'center' },
  stats: { flexDirection: 'row', gap: space.sm },
  chart: { flexDirection: 'row', height: 140, gap: space.sm, alignItems: 'flex-end' },
  barCol: { flex: 1, alignItems: 'center', gap: 8, height: '100%' },
  barTrack: { flex: 1, width: '100%', justifyContent: 'flex-end', backgroundColor: colors.surfaceSunken, borderRadius: radius.sm, overflow: 'hidden' },
  bar: { width: '100%', backgroundColor: colors.accent, borderRadius: radius.sm, minHeight: 2 },
});
