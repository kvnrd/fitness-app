import { router } from 'expo-router';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { healthScreenAiPaused, showHomeWeight } from '../../ai/flow';
import { useAiPlan } from '../../ai/useAiPlan';
import { AiNotice } from '../../components/AiNotice';
import { HealthScreenPausedBanner } from '../../components/HealthScreenPausedBanner';
import { ScreenBackground } from '../../components/ScreenAtmosphere';
import { Button, Text } from '../../components/ui';
import { useSession } from '../../auth/SessionProvider';
import { useTheme } from '../../theme/ThemeProvider';
import { space } from '../../theme/tokens';

export default function HomeScreen() {
  const { onboarding, profile } = useSession();
  const { start, notice, state } = useAiPlan();
  const insets = useSafeAreaInsets();
  const { colors, fonts } = useTheme();
  const teen = !!onboarding?.is_minor;
  const hasPlan = !!state?.planAccepted;
  const first = profile?.display_name?.trim().split(/\s+/)[0];

  return (
    <ScreenBackground>
      <ScrollView
        style={{ flex: 1, backgroundColor: 'transparent' }}
        contentContainerStyle={{ paddingTop: insets.top + space.md, paddingHorizontal: 24, paddingBottom: 48, gap: 20 }}
      >
        <Text variant="hero" accessibilityRole="header">
          Home
        </Text>
        {state && healthScreenAiPaused(state) ? (
          <HealthScreenPausedBanner teen={teen} onUpdate={() => router.push('/ai/health')} />
        ) : null}
        {hasPlan && notice === 'banner' ? <AiNotice /> : null}
        {showHomeWeight(teen) && !hasPlan ? (
          <Text color={colors.textMuted} style={{ fontFamily: fonts.bodyMedium, fontSize: 14 }}>
            Body weight lives in Profile after you turn Health data on.
          </Text>
        ) : null}
        {hasPlan ? (
          <Pressable
            onPress={() => router.push('/(tabs)/train')}
            accessibilityRole="button"
            accessibilityLabel="Open your AI plan"
            style={{
              padding: 16,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: colors.border,
              backgroundColor: colors.surface,
              gap: 12,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  backgroundColor: colors.surfaceSunken,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name="sparkles" size={20} color={colors.accentInk} />
              </View>
              <View style={{ flex: 1 }}>
                <Text color={colors.textMuted} style={{ fontFamily: fonts.bodyBold, fontSize: 12, letterSpacing: 0.8, textTransform: 'uppercase' }}>
                  AI plan{first ? ` · ${first}` : ''}
                </Text>
                <Text color={colors.text} style={{ fontFamily: fonts.bodyBold, fontSize: 16, lineHeight: 24 }}>
                  Your current plan
                </Text>
              </View>
            </View>
          </Pressable>
        ) : (
          <View
            style={{
              padding: 16,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: colors.border,
              backgroundColor: colors.surface,
              gap: 12,
            }}
          >
            <Text color={colors.text} style={{ fontFamily: fonts.body, fontSize: 16, lineHeight: 24 }}>
              Build an AI plan from a short quiz after the health screen. You can still log workouts without one.
            </Text>
            <Button label="Build an AI plan" onPress={start} />
          </View>
        )}
        {hasPlan && notice === 'footer' ? <AiNotice variant="footer" /> : null}
      </ScrollView>
    </ScreenBackground>
  );
}
