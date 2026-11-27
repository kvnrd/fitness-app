import { AURORA_TAB_BAR_RESERVE } from '../../components/AuroraTabBar';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { healthScreenAiPaused } from '../../ai/flow';
import { useAiPlan } from '../../ai/useAiPlan';
import { AiNotice } from '../../components/AiNotice';
import { HealthScreenPausedBanner } from '../../components/HealthScreenPausedBanner';
import { ScreenBackground } from '../../components/ScreenAtmosphere';
import { Button, Text } from '../../components/ui';
import { loadConsents } from '../../auth/consents';
import { useSession } from '../../auth/SessionProvider';
import { deviceSetupStore, turned18Store } from '../../onboarding/deviceStorage';
import { HomeWeightCard } from '../../progress/screens/HomeWeightCard';
import { Turned18Card } from '../../progress/screens/Turned18Card';
import { weightSurfaceState } from '../../progress/weightGate.ts';
import { useTheme } from '../../theme/ThemeProvider';
import { space } from '../../theme/tokens';
import { BUILD_PLAN_CTA, TRAINER_BADGE, TRAINER_INTRO } from '../../ai/trainer';

export default function HomeScreen() {
  const { onboarding, user } = useSession();
  const { start, notice, state } = useAiPlan();
  const insets = useSafeAreaInsets();
  const { colors, fonts } = useTheme();
  const teen = !!onboarding?.is_minor;
  const hasPlan = !!state?.planAccepted;
  const [healthSelf, setHealthSelf] = useState(false);
  const [healthParent, setHealthParent] = useState(false);
  const [trendLabel, setTrendLabel] = useState<string | undefined>();
  const [unit, setUnit] = useState<string | undefined>();
  const [goalLabel, setGoalLabel] = useState<string | undefined>();
  const [show18, setShow18] = useState(false);

  useEffect(() => {
    if (!user) return;
    void loadConsents(user.id).then((r) => {
      if (r.ok) {
        setHealthSelf(r.state.health_data.self);
        setHealthParent(r.state.health_data.parent);
      }
    });
    void deviceSetupStore.loadWeightGoal(user.id).then((w) => {
      if (w && w.current != null) {
        setTrendLabel(String(w.current));
        setUnit(w.unit);
      }
      if (w && w.target != null) setGoalLabel(`Goal · ${w.target} ${w.unit}`);
    }).catch(() => {});
    if (!teen) {
      void turned18Store.shouldShow(user.id, false).then(setShow18);
    }
  }, [user, teen]);

  const surface = weightSurfaceState({ isMinor: teen, healthSelf, healthParent });
  const showWeightCard = teen || surface.kind === 'open';

  return (
    <ScreenBackground>
      <ScrollView
        style={{ flex: 1, backgroundColor: 'transparent' }}
        contentContainerStyle={{ paddingTop: insets.top + space.md, paddingHorizontal: 24, paddingBottom: 48 + AURORA_TAB_BAR_RESERVE + insets.bottom, gap: 20 }}
      >
        <Text variant="hero" accessibilityRole="header">
          Home
        </Text>
        {state && healthScreenAiPaused(state) ? (
          <HealthScreenPausedBanner teen={teen} onUpdate={() => router.push('/ai/health')} />
        ) : null}
        {hasPlan && notice === 'banner' ? <AiNotice /> : null}
        {show18 && user ? (
          <Turned18Card
            onNotNow={() => {
              void turned18Store.record(user.id, 'not_now');
              setShow18(false);
            }}
            onLearnMore={() => {
              void turned18Store.record(user.id, 'learn_more');
              setShow18(false);
              router.push('/settings/photo-privacy');
            }}
          />
        ) : null}
        {showWeightCard ? (
          <HomeWeightCard
            surface={surface}
            healthSelf={healthSelf}
            healthParent={healthParent}
            trendLabel={surface.showValues ? trendLabel : undefined}
            unit={surface.showValues ? unit : undefined}
            goalLabel={surface.showGoal ? goalLabel : undefined}
            accessibilityLabel={surface.showValues && trendLabel ? `Trend weight ${trendLabel} ${unit}` : undefined}
            onOpenProgress={() => router.push('/(tabs)/progress')}
          />
        ) : null}
        {hasPlan ? (
          <Pressable
            onPress={() => router.push('/(tabs)/train')}
            accessibilityRole="button"
            accessibilityLabel="Open your plan"
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
                  {TRAINER_BADGE}
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
              {TRAINER_INTRO}
            </Text>
            <Button label={BUILD_PLAN_CTA} onPress={start} />
          </View>
        )}
        {hasPlan && notice === 'footer' ? <AiNotice variant="footer" /> : null}
      </ScrollView>
    </ScreenBackground>
  );
}
