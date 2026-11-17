import { Ionicons } from '@expo/vector-icons';
import { useMemo, useRef } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenBackground } from '../../components/ScreenAtmosphere';
import { Text } from '../../components/ui';
import { AURORA_PRESET_HUE, AURORA_PRESET_SWATCHES, AURORA_UNREVIEWED_NOTE, auroraPaletteFor } from '../../theme/auroraPalettes.ts';
import { contrastRatio, generateAuroraPalette } from '../../theme/auroraGen.ts';
import { useTheme } from '../../theme/ThemeProvider';
import {
  type AccentKey,
  type AuroraPreset,
  type ColorScheme,
  type ThemeFamily,
  type ThemeMode,
  minControlSize,
  space,
} from '../../theme/tokens';

const MODE_OPTIONS: { mode: ThemeMode; label: string }[] = [
  { mode: 'system', label: 'System' },
  { mode: 'dark', label: 'Dark' },
  { mode: 'light', label: 'Light' },
];

const FAMILY_OPTIONS: { family: ThemeFamily; label: string }[] = [
  { family: 'aurora', label: 'Aurora' },
  { family: 'v2', label: 'Classic v2' },
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

function HueWheel({ hue, onChange, label }: { hue: number; onChange: (h: number) => void; label: string }) {
  const { colors, fonts, type } = useTheme();
  const size = 184;
  const inner = 34;
  const R = size / 2 - 14;
  const rad = ((hue % 360) * Math.PI) / 180;
  const kx = size / 2 + R * Math.sin(rad) - 22;
  const ky = size / 2 - R * Math.cos(rad) - 22;
  const box = useRef<{ x: number; y: number; w: number; h: number } | null>(null);

  const apply = (lx: number, ly: number) => {
    const b = box.current;
    if (!b) return;
    const cx = b.w / 2;
    const cy = b.h / 2;
    const dx = lx - cx;
    const dy = ly - cy;
    let deg = (Math.atan2(dx, -dy) * 180) / Math.PI;
    if (deg < 0) deg += 360;
    onChange(Math.round(deg) % 360);
  };

  const stops = Array.from({ length: 25 }, (_, i) => {
    const a = i * 15;
    return `oklch(0.76 0.15 ${a}) ${a}deg`;
  }).join(',');

  return (
    <View style={{ width: size, height: size, flexShrink: 0 }}>
      <View
        style={{ width: size, height: size }}
        onLayout={(e) => {
          const { width, height } = e.nativeEvent.layout;
          box.current = { x: 0, y: 0, w: width, h: height };
        }}
        onStartShouldSetResponder={() => true}
        onMoveShouldSetResponder={() => true}
        onResponderGrant={(e) => apply(e.nativeEvent.locationX, e.nativeEvent.locationY)}
        onResponderMove={(e) => apply(e.nativeEvent.locationX, e.nativeEvent.locationY)}
        accessibilityRole="adjustable"
        accessibilityLabel="Custom hue"
        accessibilityValue={{ min: 0, max: 359, now: hue, text: `${hue} degrees` }}
      >
        <View
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: size / 2,
            backgroundImage: Platform.OS === 'web' ? `conic-gradient(${stops})` : undefined,
            backgroundColor: colors.surfaceRaised,
          }}
        />
        <View
          style={{
            position: 'absolute',
            top: inner,
            left: inner,
            right: inner,
            bottom: inner,
            borderRadius: (size - inner * 2) / 2,
            backgroundColor: colors.surfaceRaised,
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: colors.glassBorder,
            alignItems: 'center',
            justifyContent: 'center',
          }}
          pointerEvents="none"
        >
          <Text style={[type.title, { color: colors.text, textAlign: 'center' }]}>{hue}°</Text>
          <Text variant="label" color={colors.textSecondary}>
            {label}
          </Text>
        </View>
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            left: kx,
            top: ky,
            width: 44,
            height: 44,
            borderRadius: 22,
            backgroundColor: colors.accent,
            borderWidth: 4,
            borderColor: '#FFFFFF',
          }}
        />
      </View>
    </View>
  );
}

function GradientSwatch({
  metal,
  selected,
  label,
  onPress,
  checkDark,
}: {
  metal: readonly [string, string, string];
  selected: boolean;
  label: string;
  onPress: () => void;
  checkDark?: boolean;
}) {
  const { colors, fonts } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${label} palette`}
      accessibilityState={{ selected }}
      style={{ alignItems: 'center', gap: 4, width: 60, minHeight: minControlSize }}
    >
      <View
        style={{
          width: 48,
          height: 48,
          borderRadius: 24,
          overflow: 'hidden',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: selected ? `0 0 0 3px ${colors.bg}, 0 0 0 5px ${colors.text}` : undefined,
          borderWidth: selected ? 2 : 0,
          borderColor: selected ? colors.text : 'transparent',
        }}
      >
        <View
          style={{
            ...StyleSheet.absoluteFill,
            backgroundImage: `linear-gradient(135deg, ${metal[0]}, ${metal[1]}, ${metal[2]})`,
            backgroundColor: metal[1],
          }}
        />
        {selected ? <Ionicons name="checkmark" size={24} color={checkDark ? '#000000' : colors.accentText} /> : null}
      </View>
      <Text variant="label" color={selected ? colors.text : colors.textSecondary} style={{ fontFamily: selected ? fonts.bodySemi : fonts.body }}>
        {label}
      </Text>
    </Pressable>
  );
}

export function AppearanceSettingsScreen({ onBack }: { onBack: () => void }) {
  const insets = useSafeAreaInsets();
  const {
    colors,
    family,
    setFamily,
    mode,
    setMode,
    resolvedScheme,
    auroraPreset,
    setAuroraPreset,
    customHue,
    setCustomHue,
    accent,
    setAccent,
    accents,
    radius,
    fonts,
  } = useTheme();
  const aurora = family === 'aurora';

  const wheelHue = auroraPreset === 'custom' ? customHue : AURORA_PRESET_HUE[auroraPreset];
  const wheelLabel =
    auroraPreset === 'custom' ? 'Custom hue' : auroraPreset === 'grove' ? 'Grove hue' : auroraPreset === 'berry' ? 'Berry hue' : auroraPreset === 'chrome' ? 'Chrome hue' : 'Midnight hue';

  const scores = useMemo(() => {
    if (auroraPreset === 'custom') {
      const g = generateAuroraPalette(customHue, resolvedScheme);
      return { Text: g.scores.text, Secondary: g.scores.mut, Accent: g.scores.ink, Button: g.scores.cta };
    }
    const p = auroraPaletteFor(auroraPreset, resolvedScheme, customHue);
    return {
      Text: contrastRatio(p.text, p.bg),
      Secondary: contrastRatio(p.textSecondary, p.bg),
      Accent: contrastRatio(p.accentInk, p.bg),
      Button: contrastRatio(p.accent, p.accentText),
    };
  }, [auroraPreset, customHue, resolvedScheme]);

  const unreviewedKey = colors.unreviewed ? (resolvedScheme === 'light' && auroraPreset === 'berry' ? 'berry-light' : resolvedScheme === 'light' && auroraPreset === 'chrome' ? 'chrome-light' : null) : null;

  const pickPreset = (key: AuroraPreset) => {
    setAuroraPreset(key);
    if (mode !== 'system') {
      if (key === 'midnight') setMode('dark');
      if (key === 'grove') setMode('light');
    }
  };

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
          value={mode}
          onChange={setMode}
          options={MODE_OPTIONS.map((o) => ({ value: o.mode, label: o.label }))}
        />

        <Text variant="label" color={colors.textSecondary} style={styles.sectionLabel}>
          Theme
        </Text>
        <Segment
          aurora={aurora}
          value={family}
          onChange={setFamily}
          options={FAMILY_OPTIONS.map((o) => ({ value: o.family, label: o.label }))}
        />

        {aurora ? (
          <>
            <Text variant="bodyStrong" style={{ marginTop: 20, marginBottom: 8 }}>
              Palette
            </Text>
            <View style={styles.presets}>
              {AURORA_PRESET_SWATCHES.map((s) => (
                <GradientSwatch
                  key={s.key}
                  metal={s.metal}
                  label={s.name}
                  selected={auroraPreset === s.key}
                  onPress={() => pickPreset(s.key)}
                  checkDark={s.key === 'midnight' || s.key === 'berry' || s.key === 'chrome'}
                />
              ))}
              <Pressable
                onPress={() => pickPreset('custom')}
                accessibilityRole="button"
                accessibilityLabel="Custom palette"
                accessibilityState={{ selected: auroraPreset === 'custom' }}
                style={{ alignItems: 'center', gap: 4, width: 60, minHeight: minControlSize }}
              >
                <View
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 24,
                    overflow: 'hidden',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderWidth: auroraPreset === 'custom' ? 2 : 0,
                    borderColor: colors.text,
                    backgroundImage: `conic-gradient(${Array.from({ length: 25 }, (_, i) => `oklch(0.76 0.15 ${i * 15}) ${i * 15}deg`).join(',')})`,
                    backgroundColor: colors.accent,
                  }}
                >
                  <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: colors.bg }} />
                </View>
                <Text variant="label" color={auroraPreset === 'custom' ? colors.text : colors.textSecondary}>
                  Custom
                </Text>
              </Pressable>
            </View>

            <View
              style={{
                marginTop: 16,
                borderRadius: radius.hero,
                padding: 16,
                backgroundColor: colors.glass,
                borderWidth: StyleSheet.hairlineWidth,
                borderColor: colors.glassBorder,
              }}
            >
              <View style={{ flexDirection: 'row', gap: 16, alignItems: 'center' }}>
                <HueWheel hue={wheelHue} label={wheelLabel} onChange={setCustomHue} />
                <View style={{ flex: 1, gap: 8 }}>
                  <Text variant="bodyStrong">Contrast</Text>
                  {(['Text', 'Secondary', 'Accent', 'Button'] as const).map((k) => (
                    <View key={k} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <Text variant="label" color={colors.textSecondary}>
                        {k}
                      </Text>
                      <Text variant="small" style={{ fontFamily: fonts.bodySemi }}>
                        {scores[k].toFixed(1)}  ✓
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
              <Text variant="label" color={colors.textSecondary} style={{ marginTop: 12 }}>
                Drag the hue to make a Custom palette. Lightness adjusts itself so text stays AA.
              </Text>
            </View>

            {unreviewedKey ? (
              <Text variant="small" color={colors.textSecondary} style={{ marginTop: 12 }}>
                {AURORA_UNREVIEWED_NOTE[unreviewedKey]}
              </Text>
            ) : null}
          </>
        ) : (
          <>
            <Text variant="bodyStrong" style={{ marginTop: 20, marginBottom: 12 }}>
              Accent
            </Text>
            <View style={styles.presets}>
              {accents.map((a) => {
                const roles = a.modes[resolvedScheme];
                const selected = a.key === accent;
                return (
                  <Pressable
                    key={a.key}
                    onPress={() => setAccent(a.key as AccentKey)}
                    accessibilityRole="button"
                    accessibilityLabel={`${a.name} accent`}
                    accessibilityState={{ selected }}
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 22,
                      backgroundColor: roles.accent,
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderWidth: selected ? 2 : 1,
                      borderColor: selected ? colors.text : colors.borderStrong,
                    }}
                  >
                    {selected ? <Ionicons name="checkmark" size={22} color={roles.accentText} /> : null}
                  </Pressable>
                );
              })}
            </View>
            <Text variant="small" style={{ marginTop: 12 }}>
              <Text variant="small" style={{ fontFamily: fonts.bodySemi }}>
                {accents.find((a) => a.key === accent)?.name}
              </Text>
              <Text variant="small" color={colors.textSecondary}>
                {' '}
                · default. Volt, Orange, Blue, Red, Cyan and Mono also pass AA in both modes.
              </Text>
            </Text>
            <ClassicPreview scheme={resolvedScheme} />
          </>
        )}
      </ScrollView>
    </ScreenBackground>
  );
}

function ClassicPreview({ scheme }: { scheme: ColorScheme }) {
  const { colors, fonts, type } = useTheme();
  const name = scheme === 'dark' ? 'Carbon' : 'Concrete';
  return (
    <View
      style={{
        marginTop: 20,
        padding: 20,
        borderRadius: 16,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        gap: 8,
      }}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Text variant="label" style={{ fontFamily: fonts.bodySemi }}>
          Preview · {name}
        </Text>
        <Text variant="label" color={colors.textSecondary}>
          3 of 10 sets logged
        </Text>
      </View>
      <Text style={[type.stamp, { color: colors.text }]}>Wednesday</Text>
      <Text variant="title">Upper Push</Text>
      <View style={{ height: 6, borderRadius: 3, backgroundColor: colors.border, marginTop: 8 }}>
        <View style={{ width: '30%', height: 6, borderRadius: 3, backgroundColor: colors.accentLine }} />
      </View>
      <View
        style={{
          height: 56,
          borderRadius: 28,
          backgroundColor: colors.accent,
          alignItems: 'center',
          justifyContent: 'center',
          marginTop: 8,
        }}
      >
        <Text variant="bodyStrong" color={colors.accentText}>
          Continue workout
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 20, gap: 0, maxWidth: 640, width: '100%', alignSelf: 'center' },
  top: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  back: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderWidth: StyleSheet.hairlineWidth },
  sectionLabel: { marginTop: 16, marginBottom: 8 },
  seg: { flexDirection: 'row', alignItems: 'center' },
  segItem: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  presets: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
});
