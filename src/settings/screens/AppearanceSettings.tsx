import { Ionicons } from '@expo/vector-icons';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenBackground } from '../../components/ScreenAtmosphere';
import { Text } from '../../components/ui';
import { AuroraPalettePicker } from '../AuroraPalettePicker';
import { useTheme } from '../../theme/ThemeProvider';
import { type ThemeMode, minControlSize, space } from '../../theme/tokens';

const MODE_OPTIONS: { mode: ThemeMode; label: string }[] = [
  { mode: 'system', label: 'System' },
  { mode: 'dark', label: 'Dark' },
  { mode: 'light', label: 'Light' },
];

function Segment<T extends string>({
  options,
  value,
  onChange,
  aurora,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  aurora: boolean;
}) {
  const { colors, radius, fonts } = useTheme();
  return (
    <View
      style={[
        styles.seg,
        {
          backgroundColor: aurora ? colors.glass : 'transparent',
          borderColor: aurora ? colors.glassBorder : 'transparent',
          borderWidth: aurora ? StyleSheet.hairlineWidth : 0,
          borderRadius: aurora ? 26 : 0,
          gap: aurora ? 4 : 8,
          padding: aurora ? 4 : 0,
        },
      ]}
    >
      {options.map((o) => {
        const on = o.value === value;
        return (
          <Pressable
            key={o.value}
            onPress={() => onChange(o.value)}
            accessibilityRole="button"
            accessibilityState={{ selected: on }}
            accessibilityLabel={o.label}
            style={[
              styles.segItem,
              {
                minHeight: minControlSize,
                borderRadius: 22,
                backgroundColor: on ? (aurora ? colors.tabOn : colors.accent) : aurora ? 'transparent' : colors.surface,
                borderWidth: on || aurora ? 0 : 1,
                borderColor: colors.borderStrong,
              },
            ]}
          >
            <Text variant="small" color={on ? (aurora ? colors.tabOnText : colors.accentText) : colors.text} style={{ fontFamily: fonts.bodySemi }}>
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function AppearanceSettingsScreen({ onBack }: { onBack: () => void }) {
  const insets = useSafeAreaInsets();
  const {
    colors,
    mode,
    setMode,
    schemeOverride,
    fonts,
  } = useTheme();
  // Aurora is the only theme offered here (Kevin, 2026-11-19: "remove the Theme option").
  const aurora = true;
  const modeShown = schemeOverride ?? mode;

  return (
    <ScreenBackground>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + space.sm, paddingBottom: insets.bottom + 48 }]}
      >
        <View style={styles.top}>
          <Pressable
            onPress={onBack}
            accessibilityRole="button"
            accessibilityLabel="Back to Profile"
            style={[
              styles.back,
              {
                backgroundColor: aurora ? colors.glass : colors.surface,
                borderColor: aurora ? colors.glassBorder : colors.border,
                borderRadius: 22,
              },
            ]}
          >
            <Ionicons name="chevron-back" size={22} color={colors.text} />
          </Pressable>
          <Text variant="small" style={{ fontFamily: fonts.bodySemi }}>
            Profile
          </Text>
        </View>

        <Text variant="title" accessibilityRole="header">
          Appearance
        </Text>

        <Text variant="label" color={colors.textSecondary} style={styles.sectionLabel}>
          Mode
        </Text>
        <Segment
          aurora={aurora}
          value={modeShown}
          onChange={setMode}
          options={MODE_OPTIONS.map((o) => ({ value: o.mode, label: o.label }))}
        />

        <AuroraPalettePicker />
      </ScrollView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 20, gap: 0, maxWidth: 640, width: '100%', alignSelf: 'center' },
  top: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  back: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderWidth: StyleSheet.hairlineWidth },
  sectionLabel: { marginTop: 16, marginBottom: 8 },
  seg: { flexDirection: 'row', alignItems: 'center' },
  segItem: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
