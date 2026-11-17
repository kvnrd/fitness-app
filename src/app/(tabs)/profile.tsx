import { router } from 'expo-router';
import { Alert, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { showTeenProfileWeight } from '../../ai/flow';
import { useAiPlan } from '../../ai/useAiPlan';
import { AiNotice } from '../../components/AiNotice';
import { ScreenBackground } from '../../components/ScreenAtmosphere';
import { Text } from '../../components/ui';
import { loadConsents } from '../../auth/consents';
import { useSession } from '../../auth/SessionProvider';
import { deviceSetupStore } from '../../onboarding/deviceStorage';
import { useTheme } from '../../theme/ThemeProvider';
import { space } from '../../theme/tokens';

function Row({ label, value, sub, onPress, danger }: { label: string; value?: string; sub?: string; onPress?: () => void; danger?: boolean }) {
  const { colors, fonts } = useTheme();
  const inner = (
    <View style={{ paddingVertical: 14, gap: 2, flexDirection: 'row', alignItems: 'center', borderTopWidth: 1, borderTopColor: colors.border }}>
      <View style={{ flex: 1, gap: 2 }}>
        <Text color={danger ? colors.danger : colors.text} style={{ fontFamily: fonts.bodySemi, fontSize: 16, lineHeight: 24 }}>
          {label}
        </Text>
        {sub ? (
          <Text color={colors.textSecondary} style={{ fontFamily: fonts.body, fontSize: 14, lineHeight: 20 }}>
            {sub}
          </Text>
        ) : null}
      </View>
      {value ? (
        <Text color={colors.textMuted} style={{ fontFamily: fonts.bodyMedium, fontSize: 14 }}>
          {value}
        </Text>
      ) : onPress ? (
        <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
      ) : null}
    </View>
  );
  if (!onPress) return inner;
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label}>
      {inner}
    </Pressable>
  );
}

export default function ProfileTab() {
  const { colors, fonts, family, auroraPreset, accent, accents, mode } = useTheme();
  const insets = useSafeAreaInsets();
  const { profile, onboarding, signOut, user, isConfigured, isSignedIn, isVerifiedCoach } = useSession();
  const accentName = accents.find((a) => a.key === accent)?.name ?? 'Champagne';
  const modeLabel = mode === 'system' ? 'System' : mode === 'light' ? 'Light' : 'Dark';
  const presetLabel = auroraPreset.charAt(0).toUpperCase() + auroraPreset.slice(1);

  const { state, notice } = useAiPlan();
  const teen = !!onboarding?.is_minor;
  const [healthSelf, setHealthSelf] = useState(false);
  const [healthParent, setHealthParent] = useState(false);
  const [hasTarget, setHasTarget] = useState(false);
  const [weightLabel, setWeightLabel] = useState<string | undefined>();

  useEffect(() => {
    if (!user) return;
    void loadConsents(user.id).then((r) => {
      if (r.ok) {
        setHealthSelf(r.state.health_data.self);
        setHealthParent(r.state.health_data.parent);
      }
    });
    void deviceSetupStore.loadWeightGoal(user.id).then((w) => {
      setHasTarget(!!w && w.target != null);
      if (w && w.current != null) setWeightLabel(`${w.current} ${w.unit}`);
    }).catch(() => {});
  }, [user]);

  const showWeight = teen
    ? showTeenProfileWeight({ isMinor: true, healthSelf, healthParent, hasTarget })
    : healthSelf;
  const name = profile?.display_name?.trim() || 'You';

  return (
    <ScreenBackground>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + space.md, paddingHorizontal: 24, paddingBottom: 48, gap: 20 }}>
        <Text variant="hero" accessibilityRole="header">
          Profile
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
          <View
            style={{
              width: 64,
              height: 64,
              borderRadius: 32,
              backgroundColor: colors.surfaceSunken,
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 1,
              borderColor: colors.borderStrong,
            }}
          >
            <Text color={colors.text} style={{ fontFamily: fonts.displayBold, fontSize: 28 }}>
              {name.slice(0, 1).toUpperCase()}
            </Text>
          </View>
          <View style={{ gap: 4 }}>
            <Text color={colors.text} style={{ fontFamily: fonts.displayBold, fontSize: 32, lineHeight: 32, textTransform: 'uppercase' }}>
              {name}
            </Text>
            <Text color={colors.textSecondary} style={{ fontFamily: fonts.bodyMedium, fontSize: 14 }}>
              {teen ? 'Athlete' : 'Athlete'}
              {state?.planAccepted ? ' · AI plan' : ''}
            </Text>
          </View>
        </View>

        <View>
          <Text color={colors.textMuted} style={{ fontFamily: fonts.bodyBold, fontSize: 12, letterSpacing: 1, textTransform: 'uppercase' }}>
            Training
          </Text>
          <Row label="Plan" value={state?.planAccepted ? 'AI plan' : 'Free logging'} onPress={state?.planAccepted ? () => router.push('/(tabs)/train') : undefined} />
          {showWeight ? (
            <Row
              label="Body weight"
              value={weightLabel ?? 'Add'}
              sub={teen ? 'No goal or target. Hidden on Home. You and your parent both turned Health data on.' : undefined}
            />
          ) : null}
        </View>

        {isConfigured && isSignedIn ? (
          <>
            <View>
              <Text color={colors.textMuted} style={{ fontFamily: fonts.bodyBold, fontSize: 12, letterSpacing: 1, textTransform: 'uppercase' }}>
                Settings
              </Text>
              <Row
                label="Appearance"
                value={family === 'aurora' ? `Aurora · ${auroraPreset[0].toUpperCase()}${auroraPreset.slice(1)}` : `${accentName} · ${modeLabel}`}
                onPress={() => router.push('/settings/appearance')}
              />
              {isVerifiedCoach && family === 'aurora' ? (
                <Row label="Studio" sub="Coach tools" onPress={() => router.push('/(tabs)/studio')} />
              ) : null}
              <Row label="Notifications" onPress={() => router.push('/settings/notifications')} />
              <Row label="Privacy" sub="Health data, AI, coach sharing, and your rights" onPress={() => router.push('/settings/privacy')} />
              <Row label="Your choices" value="Consent" onPress={() => router.push('/consent')} />
              <Row label="Terms" value="Terms of Service" onPress={() => router.push('/legal/terms')} />
              <Row label="Privacy" value="Privacy Policy" onPress={() => router.push('/legal/privacy')} />
              <Row label="Health data privacy" value="Policy" onPress={() => router.push('/legal/health-privacy')} />
              {profile && !profile.is_minor ? (
                <Row label="Link requests" value="Parent or guardian" onPress={() => router.push('/parent-link')} />
              ) : null}
            </View>
            <View>
              <Text color={colors.textMuted} style={{ fontFamily: fonts.bodyBold, fontSize: 12, letterSpacing: 1, textTransform: 'uppercase' }}>
                Account
              </Text>
              <Row label="Sign out" onPress={() => void signOut()} />
              <Row
                label="Delete account"
                danger
                onPress={() => Alert.alert('Delete account', 'Account deletion will be available before launch.')}
              />
            </View>
          </>
        ) : null}
        {notice === 'footer' ? <AiNotice variant="footer" /> : null}
      </ScrollView>
    </ScreenBackground>
  );
}
