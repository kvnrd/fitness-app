import { ReactNode, useContext } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenBackground } from '../../components/ScreenAtmosphere';
import { Text } from '../../components/ui';
import { useTheme } from '../../theme/ThemeProvider';
import { BackButton } from './BackButton';
import { FullHeightContext } from './previewMode';

/**
 * Onboarding screen shell: opaque canvas + ScreenAtmosphere glow, safe areas, optional back button row,
 * scrolling content (24px gutters), and a sticky bottom area for the CTA (+ FooterHint) on a frosted band.
 * No `onBack` = no back button (dead ends, locked DOB flow).
 */
export function OnbScreen({
  children,
  footer,
  onBack,
  onSkip,
  skipLabel = 'Skip',
  headerRight,
  contentGap = 24,
  centerContent = false,
}: {
  children: ReactNode;
  footer?: ReactNode;
  onBack?: () => void;
  /** Header "SKIP" (setup steps). */
  onSkip?: () => void;
  skipLabel?: string;
  /** Non-interactive header label (e.g. "2 of 2", "Preview", "Cancel"). */
  headerRight?: ReactNode;
  contentGap?: number;
  centerContent?: boolean;
}) {
  const { colors, fonts, resolvedScheme } = useTheme();
  const full = useContext(FullHeightContext);
  const insets = useSafeAreaInsets();
  const top = Math.max(insets.top, Platform.OS === 'web' ? 24 : 12);
  const bottom = Math.max(insets.bottom, 12);
  const band = resolvedScheme === 'dark' ? 'rgba(12,12,14,0.86)' : 'rgba(233,234,236,0.9)';
  return (
    <ScreenBackground>
      <KeyboardAvoidingView style={full ? undefined : { flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View nativeID={full ? 'preview-full' : undefined} style={full ? { paddingTop: top } : { flex: 1, paddingTop: top }}>
          {onBack || onSkip || headerRight ? (
            <View style={{ paddingHorizontal: 24, paddingTop: 4, paddingBottom: 4, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 44 }}>
              {onBack ? <BackButton onPress={onBack} /> : <View />}
              {onSkip ? (
                <Pressable onPress={onSkip} accessibilityRole="button" accessibilityLabel={skipLabel} hitSlop={12}>
                  <Text color={colors.textMuted} style={{ fontFamily: fonts.bodyBold, fontSize: 14, letterSpacing: 1.1, textTransform: 'uppercase' }} importantForAccessibility="no">
                    {skipLabel}
                  </Text>
                </Pressable>
              ) : headerRight ? (
                headerRight
              ) : null}
            </View>
          ) : null}
          {full ? (
            <View style={{ paddingHorizontal: 24, paddingTop: onBack || onSkip || headerRight ? 20 : 8, paddingBottom: 24, gap: contentGap }}>{children}</View>
          ) : (
            <ScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, paddingTop: onBack || onSkip || headerRight ? 20 : 8, paddingBottom: 24, gap: contentGap, justifyContent: centerContent ? 'center' : 'flex-start' }}
            >
              {children}
            </ScrollView>
          )}
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
