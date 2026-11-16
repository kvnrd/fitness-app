import { ReactNode } from 'react';
import { Pressable, TextStyle } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { Text } from '../../components/ui';

/** Headline: Barlow Condensed 800, 48/46, uppercase. */
export function OnbTitle({ children, color }: { children: string; color?: string }) {
  const { colors, fonts } = useTheme();
  return (
    <Text accessibilityRole="header" color={color ?? colors.text} style={{ fontFamily: fonts.displayHeavy, fontSize: 48, lineHeight: 46, textTransform: 'uppercase', letterSpacing: -0.2 }}>
      {children}
    </Text>
  );
}

/** Subtitle / body: Inter 400 16/24, secondary text. */
export function OnbSub({ children, style }: { children: ReactNode; style?: TextStyle }) {
  const { colors } = useTheme();
  return (
    <Text color={colors.textSecondary} style={style}>
      {children}
    </Text>
  );
}

/** Inline link text: accent ink, bold, underlined. Use inside a <Text>. */
export function InlineLink({ children, onPress }: { children: string; onPress: () => void }) {
  const { colors, fonts } = useTheme();
  return (
    <Text
      accessibilityRole="link"
      onPress={onPress}
      color={colors.accentInk}
      style={{ fontFamily: fonts.bodyBold, textDecorationLine: 'underline' }}
    >
      {children}
    </Text>
  );
}

/** Stand-alone text button with link styling. */
export function LinkButton({ children, onPress, disabled }: { children: string; onPress: () => void; disabled?: boolean }) {
  const { colors, fonts } = useTheme();
  return (
    <Pressable onPress={onPress} disabled={disabled} accessibilityRole="link" hitSlop={8} style={disabled && { opacity: 0.5 }}>
      <Text variant="small" color={colors.accentInk} style={{ fontFamily: fonts.bodyBold, textDecorationLine: 'underline' }}>
        {children}
      </Text>
    </Pressable>
  );
}

/** Centered footer line: "By continuing you agree to our Terms and Privacy Policy." */
export function TermsFooterLine({ onTerms, onPrivacy }: { onTerms: () => void; onPrivacy: () => void }) {
  const { colors } = useTheme();
  return (
    <Text variant="label" color={colors.textMuted} style={{ textAlign: 'center', fontSize: 12, lineHeight: 16 }}>
      {'By continuing you agree to our '}
      <InlineLink onPress={onTerms}>Terms</InlineLink>
      {' and '}
      <InlineLink onPress={onPrivacy}>Privacy Policy</InlineLink>
      {'.'}
    </Text>
  );
}
