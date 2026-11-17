import { ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import { Text } from '../../components/ui';
import { OnbTitle } from '../../onboarding/ui/OnbText';
import { ScreenBackground } from '../../components/ScreenAtmosphere';
import { useTheme } from '../../theme/ThemeProvider';
import { TabChrome } from './TabChrome';
import { Ionicons } from '@expo/vector-icons';

function Group({ title, children }: { title: string; children: ReactNode }) {
  const { colors, fonts } = useTheme();
  return (
    <View style={{ gap: 4 }}>
      <Text color={colors.textMuted} style={{ fontFamily: fonts.bodyBold, fontSize: 12, letterSpacing: 1, textTransform: 'uppercase', paddingHorizontal: 4 }}>
        {title}
      </Text>
      <View style={{ borderRadius: 16, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, overflow: 'hidden' }}>{children}</View>
    </View>
  );
}

function Row({
  label,
  value,
  sub,
  onPress,
  danger,
  right,
}: {
  label: string;
  value?: string;
  sub?: string;
  onPress?: () => void;
  danger?: boolean;
  right?: ReactNode;
}) {
  const { colors, fonts } = useTheme();
  const inner = (
    <View style={{ paddingVertical: 14, paddingHorizontal: 16, gap: 2, flexDirection: 'row', alignItems: 'center' }}>
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
      {right ?? (
        value ? (
          <Text color={colors.textMuted} style={{ fontFamily: fonts.bodyMedium, fontSize: 14 }}>
            {value}
          </Text>
        ) : (
          <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
        )
      )}
    </View>
  );
  if (!onPress) return inner;
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={sub ? `${label}, ${value ?? ''}, ${sub}` : `${label}${value ? `, ${value}` : ''}`}>
      {inner}
    </Pressable>
  );
}

export function ProfileScreen({
  name = 'Alex',
  roleLabel = 'Athlete · AI plan',
  showWeight = false,
  weightLabel,
  weightSub,
  notice = 'footer',
  onPlan,
  onWeight,
  onSignOut,
  onDelete,
  teen = false,
  onPrivacy,
  onNotifications,
}: {
  teen?: boolean;
  name?: string;
  roleLabel?: string;
  showWeight?: boolean;
  weightLabel?: string;
  weightSub?: string;
  notice?: 'banner' | 'footer' | null;
  onPlan?: () => void;
  onWeight?: () => void;
  onSignOut?: () => void;
  onDelete?: () => void;
  onPrivacy?: () => void;
  onNotifications?: () => void;
}) {
  const { colors, fonts } = useTheme();
  const initial = name.trim().slice(0, 1).toUpperCase() || 'A';
  return (
    <ScreenBackground>
      <TabChrome active="profile" notice={notice}>
        <View style={{ paddingHorizontal: 24, paddingTop: 8, gap: 20 }}>
          <OnbTitle>Profile</OnbTitle>
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
                {initial}
              </Text>
            </View>
            <View style={{ gap: 4 }}>
              <Text color={colors.text} style={{ fontFamily: fonts.displayBold, fontSize: 32, lineHeight: 32, textTransform: 'uppercase' }}>
                {name}
              </Text>
              <Text color={colors.textSecondary} style={{ fontFamily: fonts.bodyMedium, fontSize: 14, lineHeight: 20 }}>
                {roleLabel}
              </Text>
            </View>
          </View>
          <Group title="Training">
            <Row label="Plan" value="AI plan" onPress={onPlan} />
            {showWeight ? <Row label="Body weight" value={weightLabel ?? '—'} sub={weightSub} onPress={onWeight} /> : null}
          </Group>
          <Group title="Units">
            <Row label="Weight" value="lb" />
            <Row label="Distance" value="mi" sub="Pace, speed and distance in Progress. Rowing splits stay per 500 m." />
          </Group>
          <Group title="Privacy & sharing">
            <Row label="Share workouts and PRs" sub={teen ? 'A coach never sees your health-screen answers.' : 'A coach sees your health-screen answers only if you choose to share them.'} value="On" onPress={onPrivacy} />
          </Group>
          <Group title="App">
            <Row label="Appearance" value="Champagne · System" />
            <Row label="Apple Health" value="Off" />
            <Row label="Notifications" value="On" onPress={onNotifications} />
          </Group>
          <Group title="Account">
            <Row label="Sign out" onPress={onSignOut} />
            <Row label="Delete account" danger onPress={onDelete} />
          </Group>
        </View>
      </TabChrome>
    </ScreenBackground>
  );
}
