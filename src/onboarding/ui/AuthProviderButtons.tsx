import { Ionicons } from '@expo/vector-icons';
import { Pressable, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { Text } from '../../components/ui';
import { useTheme } from '../../theme/ThemeProvider';
import { SecondaryButton } from './SecondaryButton';

function GoogleMark({ size = 18 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48">
      <Path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <Path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <Path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <Path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </Svg>
  );
}

type Props = {
  showApple: boolean;
  showGoogle: boolean;
  onApple: () => void;
  onGoogle: () => void;
  /** Adds an "or" divider and a "Continue with email" button (stacked layout only). */
  onEmail?: () => void;
  disabled?: boolean;
  /** stacked = full-width labelled buttons; row = equal icon-only buttons side by side (sign-in). */
  layout?: 'stacked' | 'row';
};

/**
 * Apple (white on dark, black on light: HIG) / Google (outlined, dark or light Google theme) / email (dark),
 * all the same 52px pill. Labels read "Continue with Apple" / "Continue with Google" (Apple 4.8 + Google branding).
 * TODO: Google asks for Roboto Medium on its button label; Inter Tight is used (adding Roboto = new dependency).
 */
export function AuthProviderButtons({ showApple, showGoogle, onApple, onGoogle, onEmail, disabled, layout = 'stacked' }: Props) {
  const { colors, fonts, resolvedScheme } = useTheme();
  const dark = resolvedScheme === 'dark';
  const apple = dark ? { bg: '#FFFFFF', fg: '#000000', bd: '#FFFFFF' } : { bg: '#000000', fg: '#FFFFFF', bd: '#000000' };
  const google = dark ? { bg: '#131314', fg: '#E3E3E3', bd: '#8E918F' } : { bg: '#FFFFFF', fg: '#1F1F1F', bd: '#747775' };

  const btn = (key: string, label: string, c: { bg: string; fg: string; bd: string }, icon: React.ReactNode, onPress: () => void) => (
    <Pressable
      key={key}
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled }}
      style={({ pressed }) => [
        { minHeight: 52, borderRadius: 999, borderWidth: 1, borderColor: c.bd, backgroundColor: c.bg, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingHorizontal: 20 },
        layout === 'row' && { flex: 1 },
        pressed && { opacity: 0.85 },
        disabled && { opacity: 0.5 },
      ]}
    >
      {icon}
      {layout === 'stacked' ? (
        <Text importantForAccessibility="no" color={c.fg} style={{ fontFamily: fonts.bodySemi, fontSize: 16, lineHeight: 24 }}>
          {label}
        </Text>
      ) : null}
    </Pressable>
  );

  const buttons = [
    showApple ? btn('apple', 'Continue with Apple', apple, <Ionicons name="logo-apple" size={layout === 'row' ? 22 : 18} color={apple.fg} />, onApple) : null,
    showGoogle ? btn('google', 'Continue with Google', google, <GoogleMark size={layout === 'row' ? 20 : 18} />, onGoogle) : null,
  ];

  if (layout === 'row') return <View style={{ flexDirection: 'row', gap: 12 }}>{buttons}</View>;
  return (
    <View style={{ gap: 12 }}>
      {buttons}
      {onEmail ? (
        <>
          {showApple || showGoogle ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
              <Text variant="label" color={colors.textMuted} style={{ textTransform: 'uppercase', letterSpacing: 0.96 }}>
                or
              </Text>
              <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
            </View>
          ) : null}
          <SecondaryButton label="Continue with email" onPress={onEmail} disabled={disabled} icon={<Ionicons name="mail-outline" size={18} color={colors.text} />} />
        </>
      ) : null}
    </View>
  );
}
