import { Platform, StyleSheet, Text as RNText, type StyleProp, type TextStyle } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import type { TypeVariant } from '../theme/tokens';

/**
 * Gradient only on hero numerals (today's day name, rest-timer digits, Progress totals).
 * Falls back to solid type for Classic v2, or when there is no metal tuple.
 */
export function HeroNumeral({
  children,
  variant = 'stamp',
  style,
  accessibilityRole,
}: {
  children: string;
  variant?: TypeVariant;
  style?: StyleProp<TextStyle>;
  accessibilityRole?: 'header' | 'text';
}) {
  const { colors, family, type } = useTheme();
  const typo = type[variant];
  const metal = colors.accentMetal;
  const useGrad = family === 'aurora' && !!metal;

  if (!useGrad || !metal) {
    return (
      <RNText accessibilityRole={accessibilityRole} style={[typo, { color: colors.text }, style]}>
        {children}
      </RNText>
    );
  }

  if (Platform.OS === 'web') {
    return (
      <RNText
        accessibilityRole={accessibilityRole}
        style={[
          typo,
          style,
          {
            color: 'transparent',
            backgroundImage: `linear-gradient(135deg, ${metal[0]}, ${metal[1]}, ${metal[2]})`,
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          } as TextStyle,
        ]}
      >
        {children}
      </RNText>
    );
  }

  // Native: solid ink rather than invent a mask dependency. Gradient still shows on web / shots.
  return (
    <RNText accessibilityRole={accessibilityRole} style={[typo, { color: colors.accentInk }, style]}>
      {children}
    </RNText>
  );
}

export const heroNumeralStyles = StyleSheet.create({});
