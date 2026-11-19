import { View, useWindowDimensions } from 'react-native';
import Svg, { Circle, Defs, Line, LinearGradient, RadialGradient, Rect, Stop } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenBackground } from '../../components/ScreenAtmosphere';
import { Text } from '../../components/ui';
import { useTheme } from '../../theme/ThemeProvider';
import { PrimaryCta } from '../ui/PrimaryCta';
import { SecondaryButton } from '../ui/SecondaryButton';
import { TermsFooterLine } from '../ui/OnbText';
import { Wordmark } from '../ui/Wordmark';

/** Abstract kinetic hero: track rings + accent arcs + speed streaks on a dark plate (same in both modes). */
function HeroArt({ width, height }: { width: number; height: number }) {
  const { colors } = useTheme();
  const cx = width * 0.72;
  const cy = height * 0.3;
  return (
    <Svg width={width} height={height}>
      <Defs>
        <RadialGradient id="plate" cx="72%" cy="28%" rx="110%" ry="80%">
          <Stop offset="0" stopColor="#2B2C31" />
          <Stop offset="0.46" stopColor="#141518" />
          <Stop offset="1" stopColor="#070708" />
        </RadialGradient>
        <LinearGradient id="fade" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#070708" stopOpacity="0.55" />
          <Stop offset="0.22" stopColor="#070708" stopOpacity="0" />
          <Stop offset="0.45" stopColor="#070708" stopOpacity="0" />
          <Stop offset="0.8" stopColor="#070708" stopOpacity="0.88" />
          <Stop offset="1" stopColor="#070708" stopOpacity="1" />
        </LinearGradient>
      </Defs>
      <Rect width={width} height={height} fill="url(#plate)" />
      {[0.5, 0.7, 0.9, 1.1, 1.3].map((k, i) => (
        <Circle key={k} cx={cx} cy={cy} r={width * k * 0.5} stroke="#FFFFFF" strokeOpacity={0.09 - i * 0.012} strokeWidth={1} fill="none" />
      ))}
      <Circle cx={cx} cy={cy} r={width * 0.4} stroke={colors.accent} strokeWidth={3} fill="none" strokeDasharray={`${width * 0.55} ${width * 3}`} strokeDashoffset={-width * 0.9} />
      <Circle cx={cx} cy={cy} r={width * 0.55} stroke={colors.accent} strokeOpacity={0.55} strokeWidth={2} fill="none" strokeDasharray={`${width * 0.4} ${width * 4}`} strokeDashoffset={-width * 1.5} />
      <Line x1={-10} y1={height * 0.3} x2={width * 0.6} y2={height * 0.18} stroke="#FFFFFF" strokeOpacity={0.14} strokeWidth={2} />
      <Line x1={20} y1={height * 0.33} x2={width * 0.5} y2={height * 0.23} stroke={colors.accent} strokeOpacity={0.85} strokeWidth={2} />
      <Line x1={60} y1={height * 0.4} x2={width * 0.45} y2={height * 0.33} stroke={colors.accent} strokeOpacity={0.55} strokeWidth={2} />
      <Rect width={width} height={height} fill="url(#fade)" />
    </Svg>
  );
}

/** Screen 1. Presentational: callbacks only. Terms/Privacy link out (privacy to /legal/privacy, terms is a TODO page). */
export function WelcomeScreen({ onCreate, onSignIn, onTerms, onPrivacy }: { onCreate: () => void; onSignIn: () => void; onTerms: () => void; onPrivacy: () => void }) {
  const { colors, fonts, resolvedScheme } = useTheme();
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const dark = resolvedScheme === 'dark';
  const heroH = dark ? height : Math.round(height * 0.715);
  const top = Math.max(insets.top, 24);
  const bottom = Math.max(insets.bottom, 12);

  const copy = (
    <View style={{ gap: 14 }}>
      {/* The hero plate is dark in both modes; a light-mode accent (e.g. Grove's dark green) is unreadable on it. */}
      <Text variant="label" color={dark ? colors.accent : '#B4B7BC'} style={{ textTransform: 'uppercase', letterSpacing: 0.96, fontFamily: fonts.bodyBold }}>
        01 / 03 · Your program
      </Text>
      <Text accessibilityRole="header" color="#F4F5F6" style={{ fontFamily: fonts.displayHeavy, fontSize: 64, lineHeight: 58, textTransform: 'uppercase', letterSpacing: -0.6 }}>
        {'Every set\ncounts'}
        <Text color={colors.accent} style={{ fontFamily: fonts.displayHeavy, fontSize: 64 }}>
          .
        </Text>
      </Text>
      <Text color="#B4B7BC" style={{ maxWidth: 300 }}>
        Your coach’s plan, your numbers, every session logged in one place.
      </Text>
      <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <View style={{ width: 22, height: 6, borderRadius: 3, backgroundColor: colors.accent }} />
        <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.28)' }} />
        <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.28)' }} />
      </View>
    </View>
  );

  const actions = (
    <View style={{ gap: 12 }}>
      <PrimaryCta label="Create account" onPress={onCreate} />
      <SecondaryButton
        label="I already have an account"
        onPress={onSignIn}
        style={dark ? { backgroundColor: 'rgba(255,255,255,0.06)', borderColor: 'rgba(255,255,255,0.20)', minHeight: 52 } : undefined}
      />
    </View>
  );

  return (
    <ScreenBackground>
      <View style={{ position: 'absolute', left: 0, right: 0, top: 0, height: heroH, overflow: 'hidden', borderBottomLeftRadius: dark ? 0 : 32, borderBottomRightRadius: dark ? 0 : 32 }}>
        <HeroArt width={width} height={heroH} />
      </View>
      {dark ? (
        <View style={{ flex: 1, paddingTop: top, paddingHorizontal: 24, paddingBottom: bottom, justifyContent: 'space-between' }}>
          <Wordmark color="#F4F5F6" />
          <View style={{ gap: 28 }}>
            {copy}
            {actions}
            <TermsFooterLine onTerms={onTerms} onPrivacy={onPrivacy} />
          </View>
        </View>
      ) : (
        <View style={{ flex: 1, paddingTop: top, paddingHorizontal: 24, paddingBottom: bottom }}>
          {/* Light mode: the headline's light text must sit on the dark hero plate, so pin it inside the hero's height
              instead of letting it float down onto the light page (it was unreadable on taller phones). */}
          <View style={{ height: heroH - top, justifyContent: 'space-between', paddingBottom: 32 }}>
            <Wordmark color="#F4F5F6" />
            {copy}
          </View>
          <View style={{ flex: 1, justifyContent: 'flex-end', gap: 20, paddingTop: 20 }}>
            {actions}
            <TermsFooterLine onTerms={onTerms} onPrivacy={onPrivacy} />
          </View>
        </View>
      )}
    </ScreenBackground>
  );
}
