import { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenBackground } from '../../components/ScreenAtmosphere';
import { Text } from '../../components/ui';
import { useTheme } from '../../theme/ThemeProvider';
import { BackButton } from './BackButton';

/**
 * Onboarding screen shell: opaque canvas + ScreenAtmosphere glow, safe areas, optional back button row,
 * scrolling content (24px gutters), and a sticky bottom area for the CTA (+ FooterHint) on a frosted band.
 * No `onBack` = no back button (dead ends, locked DOB flow).
 */
export function OnbScreen({
  children,
  footer,
  onBack,
  contentGap = 24,
  centerContent = false,
}: {
  children: ReactNode;
  footer?: ReactNode;
  onBack?: () => void;
  contentGap?: number;
  centerContent?: boolean;
}) {
  const { colors, resolvedScheme } = useTheme();
  const insets = useSafeAreaInsets();
  const top = Math.max(insets.top, Platform.OS === 'web' ? 24 : 12);
  const bottom = Math.max(insets.bottom, 12);
  const band = resolvedScheme === 'dark' ? 'rgba(12,12,14,0.86)' : 'rgba(233,234,236,0.9)';
  return (
    <ScreenBackground>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={{ flex: 1, paddingTop: top }}>
          {onBack ? (
            <View style={{ paddingHorizontal: 24, paddingTop: 4, paddingBottom: 4 }}>
              <BackButton onPress={onBack} />
            </View>
          ) : null}
          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, paddingTop: onBack ? 20 : 8, paddingBottom: 24, gap: contentGap, justifyContent: centerContent ? 'center' : 'flex-start' }}
          >
            {children}
          </ScrollView>
          {footer ? (
            <View style={{ backgroundColor: band, paddingTop: 8, paddingHorizontal: 24, paddingBottom: bottom, gap: 12, borderTopWidth: 0 }}>{footer}</View>
          ) : null}
        </View>
      </KeyboardAvoidingView>
    </ScreenBackground>
  );
}

/** Small centered hint under a (disabled) CTA: says what is missing. */
export function FooterHint({ children }: { children: string }) {
  const { colors } = useTheme();
  return (
    <Text variant="label" color={colors.textMuted} style={{ textAlign: 'center', fontSize: 12, lineHeight: 16 }} accessibilityLiveRegion="polite">
      {children}
    </Text>
  );
}
