import { Ionicons } from '@expo/vector-icons';
import { Pressable, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { Text } from '../../components/ui';
import { useTheme } from '../../theme/ThemeProvider';
import { accents } from '../../theme/tokens';
import { ACCENT_ID_TO_KEY, ACCENT_IDS, type AccentId, type Distance, type Prefs, type Units, accentKeyFor } from '../prefs';
import { FooterHint, OnbScreen } from '../ui/OnbScreen';
import { OnbSub, OnbTitle } from '../ui/OnbText';
import { Caption } from '../ui/Pills';
import { PrimaryCta } from '../ui/PrimaryCta';
import { StepHeader } from '../ui/StepHeader';

const NAMES: Record<AccentId, string> = { champagne: 'Champagne', volt: 'Volt', signal_orange: 'Signal Orange', electric_blue: 'Electric Blue', hot_red: 'Hot Red', ice_cyan: 'Ice Cyan', mono: 'Mono' };

export type PrefsProps = {
  prefs: Prefs;
  onChange: (p: Prefs) => void;
  busy?: boolean;
  message?: string | null;
  /** "Start training" for adults and linked teens; pending teens return to Waiting, so the label differs. */
  ctaLabel?: string;
  onFinish: () => void;
  onSkip: () => void;
  onBack?: () => void;
};

function Seg<T extends string>({ options, value, onChange, label }: { options: readonly T[]; value: T; onChange: (v: T) => void; label: string }) {
  const { colors, fonts } = useTheme();
  return (
    <View accessibilityRole="radiogroup" accessibilityLabel={label} style={{ flex: 1, flexDirection: 'row', padding: 4, borderRadius: 999, backgroundColor: colors.surfaceSunken, gap: 4 }}>
      {options.map((o) => {
        const sel = o === value;
        return (
          <Pressable key={o} onPress={() => onChange(o)} accessibilityRole="radio" accessibilityLabel={o} accessibilityState={{ selected: sel }} style={{ flex: 1, height: 44, borderRadius: 999, alignItems: 'center', justifyContent: 'center', backgroundColor: sel ? colors.surfaceRaised : 'transparent', borderWidth: sel ? 1 : 0, borderColor: colors.border }}>
            <Text importantForAccessibility="no" color={sel ? colors.text : colors.textMuted} style={{ fontFamily: fonts.bodyBold, fontSize: 18 }}>{o}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/** Setup · Step 8 of 8: units, accent swatches (Champagne default) with a preview card, and the "Health data stays off" note. */
export function PrefsScreen(p: PrefsProps) {
  const { colors, fonts, resolvedScheme } = useTheme();
  const hexOf = (id: AccentId) => accents[ACCENT_ID_TO_KEY[id]].modes[resolvedScheme].accent;
  const selectedId = (ACCENT_IDS as string[]).includes(p.prefs.accent) ? (p.prefs.accent as AccentId) : null;
  const previewHex = selectedId ? hexOf(selectedId) : p.prefs.accent;
  const previewText = selectedId ? accents[ACCENT_ID_TO_KEY[selectedId]].modes[resolvedScheme].accentText : '#0D0E10';
  const name = selectedId ? NAMES[selectedId] : 'Custom';
  const key = selectedId ? accentKeyFor(selectedId) : null;
  void key;
  return (
    <OnbScreen
      onBack={p.onBack}
      onSkip={p.onSkip}
      footer={
        <>
          <PrimaryCta label={p.ctaLabel ?? 'Start training'} busy={p.busy} onPress={p.onFinish} />
          <FooterHint>Skip uses lb, mi and Champagne</FooterHint>
        </>
      }
    >
      <StepHeader eyebrow="Setup" current={8} />
      <View style={{ gap: 10 }}>
        <OnbTitle>Make it yours</OnbTitle>
        <OnbSub>Two quick choices. Change anytime.</OnbSub>
      </View>
      <View style={{ gap: 12 }}>
        <Caption>Units · weight and distance</Caption>
        <View style={{ flexDirection: 'row', gap: 16 }}>
          <Seg<Units> label="Weight units" options={['lb', 'kg']} value={p.prefs.units} onChange={(units) => p.onChange({ ...p.prefs, units })} />
          <Seg<Distance> label="Distance units" options={['mi', 'km']} value={p.prefs.distance} onChange={(distance) => p.onChange({ ...p.prefs, distance })} />
        </View>
      </View>
      <View style={{ gap: 14 }}>
        <Caption right={<Text color={colors.text} style={{ fontFamily: fonts.bodySemi, fontSize: 16 }}>{name}</Text>}>Accent · optional</Caption>
        <View accessibilityRole="radiogroup" accessibilityLabel="Accent colour" style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          {ACCENT_IDS.map((id) => {
            const sel = selectedId === id;
            const k = ACCENT_ID_TO_KEY[id];
            const metal = accents[k].modes[resolvedScheme].accentMetal;
            const hex = hexOf(id);
            return (
              <Pressable key={id} onPress={() => p.onChange({ ...p.prefs, accent: id })} accessibilityRole="radio" accessibilityLabel={NAMES[id]} accessibilityState={{ selected: sel }} hitSlop={4} style={{ width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', borderWidth: sel ? 2 : 0, borderColor: colors.text, padding: 0 }}>
                <View style={{ width: sel ? 32 : 40, height: sel ? 32 : 40, borderRadius: 20, overflow: 'hidden', backgroundColor: hex }}>
                  {metal ? (
                    <Svg width="100%" height="100%" preserveAspectRatio="none">
                      <Defs>
                        <LinearGradient id={`sw-${id}`} x1="0" y1="0" x2="1" y2="1">
                          <Stop offset="0" stopColor={metal[0]} />
                          <Stop offset="0.5" stopColor={metal[1]} />
                          <Stop offset="1" stopColor={metal[2]} />
                        </LinearGradient>
                      </Defs>
                      <Rect width="100%" height="100%" fill={`url(#sw-${id})`} />
                    </Svg>
                  ) : null}
                </View>
              </Pressable>
            );
          })}
        </View>
      </View>
      <View style={{ borderRadius: 20, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, padding: 18, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <View style={{ flex: 1, gap: 2 }}>
          <Text color={previewHex} style={{ fontFamily: fonts.bodyBold, fontSize: 12, letterSpacing: 0.96, textTransform: 'uppercase' }}>Preview</Text>
          <Text color={colors.text} style={{ fontFamily: fonts.displayHeavy, fontSize: 22, lineHeight: 26, textTransform: 'uppercase' }}>{`Upper Push · ${p.prefs.units === 'lb' ? '185 lb' : '84 kg'} × 8`}</Text>
        </View>
        <View style={{ width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: previewHex }}>
          <Ionicons name="checkmark" size={18} color={previewText} />
        </View>
      </View>
      <View style={{ borderRadius: 20, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, padding: 16, flexDirection: 'row', gap: 14 }}>
        <View style={{ width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceRaised }}>
          <Ionicons name="heart-outline" size={22} color={colors.accentInk} />
        </View>
        <View style={{ flex: 1, gap: 4 }}>
          <Text color={colors.text} style={{ fontFamily: fonts.bodyBold, fontSize: 16, lineHeight: 24 }}>Health data stays off</Text>
          <Text color={colors.textSecondary} style={{ fontFamily: fonts.bodyMedium, fontSize: 14, lineHeight: 20 }}>Connect Apple Health or Health Connect later in Profile. Nothing is read or shared until you turn it on.</Text>
        </View>
      </View>
      {p.message ? (
        <Text accessibilityLiveRegion="polite" variant="small" color={colors.danger}>
          {p.message}
        </Text>
      ) : null}
    </OnbScreen>
  );
}
