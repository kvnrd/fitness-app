import { Ionicons } from '@expo/vector-icons';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Chip, SectionHeader, Text } from '../../components/ui';
import { DAY_KEYS, DAY_LABELS } from '../../data/types';
import { rowsFor, useAppStore } from '../../state/AppStore';
import { useTheme } from '../../theme/ThemeProvider';
import { ScreenBackground } from '../../components/ScreenAtmosphere';
import { ThemeMode, radius, space } from '../../theme/tokens';

/** Lightweight weekly summary; real history comes with the backend. */
export default function ProgressScreen() {
  const { colors, fonts } = useTheme();
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
    <ScreenBackground>
    <ScrollView
      style={{ flex: 1, backgroundColor: 'transparent' }}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + space.lg }]}
    >
      <Text variant="hero" accessibilityRole="header">
        This week
      </Text>

      <View style={[styles.stats, { borderTopColor: colors.border }]}>
        <Stat value={String(sets)} label="sets logged" />
        <Stat value={volume.toLocaleString()} label="lb lifted" />
        <Stat value={String(Math.round(cardioKcal))} label="cardio kcal" />
      </View>

      <View>
        <SectionHeader title="Sets by day" />
        <View style={styles.chart}>
          {perDay.map(({ d, daySets }) => (
            <View key={d} style={styles.barCol} accessibilityLabel={`${DAY_LABELS[d].long}: ${daySets} sets`}>
              <View style={[styles.barTrack, { backgroundColor: colors.surfaceSunken }]}>
                <View style={[styles.bar, { height: `${(daySets / max) * 100}%`, backgroundColor: colors.accent }]} />
              </View>
              <Text style={{ fontFamily: fonts.displayBold, fontSize: 16 }} color={colors.textMuted}>
                {DAY_LABELS[d].short[0]}
              </Text>
            </View>
          ))}
        </View>
      </View>

      <Appearance />

      <Text variant="small" color={colors.textMuted}>
        Check off sets on the Train tab and they add up here. Full history and personal records come once accounts are connected.
      </Text>
    </ScrollView>
    </ScreenBackground>
  );
}

const MODE_OPTIONS: { mode: ThemeMode; label: string }[] = [
  { mode: 'system', label: 'System' },
  { mode: 'dark', label: 'Dark' },
  { mode: 'light', label: 'Light' },
];

/** Compact theme controls: mode and one of the preset accents. */
function Appearance() {
  const { colors, mode, setMode, accent, setAccent, accents, resolvedScheme } = useTheme();
  const current = accents.find((a) => a.key === accent);
  return (
    <View style={{ gap: space.md }}>
      <SectionHeader title="Appearance" />
      <View style={styles.optionRow}>
        {MODE_OPTIONS.map((o) => (
          <Chip key={o.mode} label={o.label} active={mode === o.mode} onPress={() => setMode(o.mode)} />
        ))}
      </View>
      <View style={styles.optionRow}>
        {accents.map((a) => {
          const roles = a.modes[resolvedScheme];
          const selected = a.key === accent;
          return (
            <Pressable
              key={a.key}
              onPress={() => setAccent(a.key)}
              accessibilityRole="button"
              accessibilityLabel={`${a.name} accent`}
              accessibilityState={{ selected }}
              hitSlop={4}
              style={[styles.swatchRing, { borderColor: selected ? colors.text : 'transparent' }]}
            >
              <View style={[styles.swatch, { backgroundColor: roles.accent, borderColor: colors.borderStrong }]}>
                {selected ? <Ionicons name="checkmark" size={18} color={roles.accentText} /> : null}
              </View>
            </Pressable>
          );
        })}
      </View>
      <Text variant="small" color={colors.textSecondary}>
        {current?.name}
      </Text>
    </View>
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
