import { Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '../../components/ui';
import { OnbTitle } from '../../onboarding/ui/OnbText';
import { PrimaryCta } from '../../onboarding/ui/PrimaryCta';
import { ScreenBackground } from '../../components/ScreenAtmosphere';
import { useTheme } from '../../theme/ThemeProvider';
import { TabChrome } from './TabChrome';
import { HealthScreenPausedBanner } from '../../components/HealthScreenPausedBanner';

export function HomeAiScreen({
  teen = false,
  planTitle = 'Hybrid Strength',
  weekLabel = 'Week 3 of 8 · Thursday changed',
  showWeight = false,
  weightLabel,
  notice = 'footer',
  onOpenPlan,
  onBuildPlan,
  hasPlan = true,
  healthScreenPaused = false,
}: {
  teen?: boolean;
  planTitle?: string;
  weekLabel?: string;
  showWeight?: boolean;
  weightLabel?: string;
  notice?: 'banner' | 'footer' | null;
  onOpenPlan?: () => void;
  onBuildPlan?: () => void;
  hasPlan?: boolean;
  healthScreenPaused?: boolean;
}) {
  const { colors, fonts } = useTheme();
  return (
    <ScreenBackground>
      <TabChrome active="home" notice={hasPlan ? notice : null}>
        <View style={{ paddingHorizontal: 24, paddingTop: 8, gap: 20 }}>
          <OnbTitle>Home</OnbTitle>
          {healthScreenPaused ? <HealthScreenPausedBanner teen={teen} /> : null}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text color={colors.accentInk} style={{ fontFamily: fonts.bodyBold, fontSize: 12, letterSpacing: 1.2, textTransform: 'uppercase' }}>
              {hasPlan ? `AI plan · ${planTitle}` : 'Your plan'}
            </Text>
          </View>
          {showWeight && !teen && weightLabel ? (
            <View
              style={{
                padding: 16,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: colors.border,
                backgroundColor: colors.surface,
              }}
            >
              <Text color={colors.textMuted} style={{ fontFamily: fonts.bodyBold, fontSize: 12, letterSpacing: 1, textTransform: 'uppercase' }}>
                Body weight
              </Text>
              <Text color={colors.text} style={{ fontFamily: fonts.displayHeavy, fontSize: 32, lineHeight: 36 }}>
                {weightLabel}
              </Text>
            </View>
          ) : null}
          {hasPlan ? (
            <Pressable
              onPress={onOpenPlan}
              accessibilityRole="button"
              accessibilityLabel={`${planTitle}. ${weekLabel}`}
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
                    AI plan · {planTitle}
                  </Text>
                  <Text color={colors.text} style={{ fontFamily: fonts.bodyBold, fontSize: 16, lineHeight: 24 }}>
                    {weekLabel}
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
              <PrimaryCta label="Build an AI plan" onPress={onBuildPlan ?? (() => {})} arrow />
            </View>
          )}
        </View>
      </TabChrome>
    </ScreenBackground>
  );
}
