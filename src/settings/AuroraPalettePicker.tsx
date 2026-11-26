import { Ionicons } from '@expo/vector-icons';
import { useMemo, useRef } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { Text } from '../components/ui';
import { AURORA_PRESET_HUE, AURORA_PRESET_SWATCHES, AURORA_UNREVIEWED_NOTE, auroraPaletteFor } from '../theme/auroraPalettes.ts';
import { contrastRatio, generateAuroraPalette } from '../theme/auroraGen.ts';
import { useTheme } from '../theme/ThemeProvider';
import { type AuroraPreset, minControlSize } from '../theme/tokens';

/** Hue (0 = top, clockwise) -> a vivid #RRGGBB for the wheel. HSL with fixed saturation and lightness. */
function wheelColor(h: number): string {
  const s = 0.85;
  const l = 0.58;
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  const hex = (x: number) => Math.round(x * 255).toString(16).padStart(2, '0');
  return `#${hex(f(0))}${hex(f(8))}${hex(f(4))}`;
}

const RING_SEGMENTS = 120;

/**
 * A full hue ring drawn with SVG, so it renders on iOS and Android as well as web (the old CSS
 * conic-gradient only worked on web). Hue 0 is at the top and runs clockwise, matching HueWheel's drag math.
 */
function HueRing({ size, thickness }: { size: number; thickness: number }) {
  const c = size / 2;
  const ro = c;
  const ri = c - thickness;
  const step = 360 / RING_SEGMENTS;
  const pt = (r: number, deg: number) => {
    const t = (deg * Math.PI) / 180;
    return `${(c + r * Math.sin(t)).toFixed(2)} ${(c - r * Math.cos(t)).toFixed(2)}`;
  };
  return (
    <Svg width={size} height={size} pointerEvents="none">
      {Array.from({ length: RING_SEGMENTS }, (_, i) => {
        const a0 = i * step;
        const a1 = a0 + step + 0.6; // slight overlap hides seams between segments
        const d = `M ${pt(ro, a0)} A ${ro} ${ro} 0 0 1 ${pt(ro, a1)} L ${pt(ri, a1)} A ${ri} ${ri} 0 0 0 ${pt(ri, a0)} Z`;
        return <Path key={i} d={d} fill={wheelColor(a0 + step / 2)} />;
      })}
    </Svg>
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
        <View style={{ position: 'absolute', top: 0, left: 0 }} pointerEvents="none">
          <HueRing size={size} thickness={inner} />
        </View>
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
            backgroundColor: wheelColor(hue),
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

/**
 * Aurora palette presets plus the custom hue wheel, with live contrast scores. Changes apply to the whole app
 * immediately. Used by Settings › Appearance and Setup › Make it yours, so both look and behave the same.
 */
export function AuroraPalettePicker() {
  const { colors, setMode, resolvedScheme, auroraPreset, setAuroraPreset, customHue, setCustomHue, radius, fonts } = useTheme();

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
    // Midnight and Grove are the dark and light halves of one palette, so picking one must also pick its
    // scheme. Without this, on "system" mode with a light device, tapping Midnight changed nothing.
    if (key === 'midnight') setMode('dark');
    if (key === 'grove') setMode('light');
  };

  return (
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
                    backgroundColor: colors.bg,
                  }}
                >
                  <View style={{ position: 'absolute', top: 0, left: 0 }} pointerEvents="none">
                    <HueRing size={48} thickness={14} />
                  </View>
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
  );
}

const styles = StyleSheet.create({
  presets: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
});
