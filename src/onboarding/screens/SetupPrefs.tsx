import { Ionicons } from '@expo/vector-icons';
import { Pressable, View } from 'react-native';
import { Text } from '../../components/ui';
import { useTheme } from '../../theme/ThemeProvider';
import { AuroraPalettePicker } from '../../settings/AuroraPalettePicker';
import { type Distance, type Prefs, type Units } from '../prefs';
import { FooterHint, OnbScreen } from '../ui/OnbScreen';
import { OnbSub, OnbTitle } from '../ui/OnbText';
import { Caption } from '../ui/Pills';
import { PrimaryCta } from '../ui/PrimaryCta';
import { StepHeader } from '../ui/StepHeader';


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

/** Setup · Step 8 of 8: units, the Aurora palette picker (same as Settings › Appearance), and the "Health data stays off" note. */
export function PrefsScreen(p: PrefsProps) {
  const { colors, fonts } = useTheme();
  return (
    <OnbScreen
      onBack={p.onBack}
      onSkip={p.onSkip}
      footer={
        <>
          <PrimaryCta label={p.ctaLabel ?? 'Start training'} busy={p.busy} onPress={p.onFinish} />
          <FooterHint>Skip uses lb and mi</FooterHint>
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
      {/* Same palette picker as Settings › Appearance (Kevin, 2026-11-19); changes apply to the app as you tap. */}
      <View>
        <AuroraPalettePicker />
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
