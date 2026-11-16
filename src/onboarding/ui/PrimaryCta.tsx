import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { useTheme } from '../../theme/ThemeProvider';
import { Text } from '../../components/ui';

/**
 * The one primary action: accent pill, Barlow Condensed 700 uppercase, round arrow chip on the right.
 * Disabled = sunken raised pill with muted label (the reason goes in the footer hint under it).
 */
export function PrimaryCta({
  label,
  onPress,
  disabled = false,
  busy = false,
  arrow = true,
}: {
  label: string;
  onPress?: () => void;
  disabled?: boolean;
  busy?: boolean;
  arrow?: boolean;
}) {
  const { colors, fonts } = useTheme();
  const off = disabled || busy;
  const metal = colors.accentMetal ?? [colors.accent, colors.accent, colors.accent];
  return (
    <Pressable
      onPress={off ? undefined : onPress}
      disabled={off}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: off, busy }}
      style={({ pressed }) => [
        {
          height: 56,
          borderRadius: 999,
          overflow: 'hidden',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: disabled ? 'center' : 'space-between',
          paddingLeft: 24,
          paddingRight: 8,
        },
        disabled
          ? { backgroundColor: colors.surfaceRaised, borderWidth: 1, borderColor: colors.border }
          : { shadowColor: colors.accent, shadowOpacity: 0.35, shadowRadius: 14, shadowOffset: { width: 0, height: 4 } },
        pressed && !off && { opacity: 0.85 },
      ]}
    >
      {!disabled ? (
        <Svg style={StyleSheet.absoluteFill} width="100%" height="100%" preserveAspectRatio="none">
          <Defs>
            <LinearGradient id="cta" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor={metal[0]} />
              <Stop offset="0.5" stopColor={metal[1]} />
              <Stop offset="1" stopColor={metal[2]} />
            </LinearGradient>
          </Defs>
          <Rect x="0" y="0" width="100%" height="100%" fill="url(#cta)" />
        </Svg>
      ) : null}
      <Text
        importantForAccessibility="no"
        color={disabled ? colors.textMuted : colors.accentText}
        style={{ fontFamily: fonts.displayBold, fontSize: 16, lineHeight: 24, letterSpacing: 1.28, textTransform: 'uppercase' }}
      >
        {label}
      </Text>
      {!disabled && arrow ? (
        <View style={{ width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.16)' }}>
          {busy ? <ActivityIndicator color={colors.accentText} /> : <Ionicons name="arrow-forward" size={20} color={colors.accentText} />}
        </View>
      ) : null}
    </Pressable>
  );
}
