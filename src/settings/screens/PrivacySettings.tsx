import { Ionicons } from '@expo/vector-icons';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenBackground } from '../../components/ScreenAtmosphere';
import { Text } from '../../components/ui';
import { useTheme } from '../../theme/ThemeProvider';
import { space } from '../../theme/tokens';
import {
  HEALTH_POLICY_LINK_LABEL,
  PRIVACY_COACHING_LABEL,
  PRIVACY_COACHING_SUB,
  PRIVACY_DELETE_ACCOUNT_LABEL,
  PRIVACY_DELETE_ACCOUNT_SUB,
  PRIVACY_DELETE_HEALTH_LABEL,
  PRIVACY_DELETE_HEALTH_SUB,
  PRIVACY_DOWNLOAD_LABEL,
  PRIVACY_DOWNLOAD_SUB,
  PRIVACY_RIGHTS_PLACEHOLDER_NOTE,
  PRIVACY_RIGHTS_ROW_LABEL,
  PRIVACY_RIGHTS_ROW_SUB,
  PRIVACY_SETTINGS_INTRO,
  PRIVACY_SETTINGS_REASK_BODY,
  PRIVACY_SETTINGS_REASK_TITLE,
} from '../../legal/text';

function Row({
  label,
  value,
  sub,
  onPress,
  danger,
}: {
  label: string;
  value?: string;
  sub?: string;
  onPress?: () => void;
  danger?: boolean;
}) {
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
      ) : null}
      {onPress ? <Ionicons name="chevron-forward" size={16} color={colors.textMuted} /> : null}
    </View>
  );
  if (!onPress) return inner;
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label}>
      {inner}
    </Pressable>
  );
}

export function PrivacySettingsScreen({
  healthOn,
  aiOn,
  coachOn,
  reaskDue,
  onBack,
  onManageChoices,
  onReask,
  onPrivacyPolicy,
  onHealthPolicy,
  onTerms,
  onRights,
  onExport,
  onDeleteHealth,
  onDeleteAccount,
  onCoaching,
}: {
  healthOn: boolean;
  aiOn: boolean;
  coachOn: boolean;
  reaskDue?: boolean;
  onBack?: () => void;
  onManageChoices: () => void;
  onReask?: () => void;
  onPrivacyPolicy: () => void;
  onHealthPolicy: () => void;
  onTerms: () => void;
  onRights?: () => void;
  onExport: () => void;
  onDeleteHealth?: () => void;
  onDeleteAccount: () => void;
  onCoaching?: () => void;
}) {
  const { colors, fonts } = useTheme();
  const insets = useSafeAreaInsets();
  const onOff = (v: boolean) => (v ? 'On' : 'Off');
  return (
    <ScreenBackground>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + space.md, paddingHorizontal: 24, paddingBottom: 48, gap: 20 }}>
        <Pressable onPress={onBack} accessibilityRole="button" accessibilityLabel="Back" style={{ alignSelf: 'flex-start', paddingVertical: 4 }}>
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </Pressable>
        <Text variant="hero" accessibilityRole="header">
          Privacy
        </Text>
        <Text color={colors.textSecondary} style={{ fontFamily: fonts.body, fontSize: 16, lineHeight: 24 }}>
          {PRIVACY_SETTINGS_INTRO}
        </Text>

        {reaskDue ? (
          <Pressable
            onPress={onReask}
            accessibilityRole="button"
            accessibilityLabel="Confirm Health data"
            style={{ borderWidth: 1, borderColor: colors.borderStrong, backgroundColor: colors.surfaceSunken, padding: 16, gap: 8 }}
          >
            <Text color={colors.text} style={{ fontFamily: fonts.bodySemi, fontSize: 16, lineHeight: 24 }}>
              {PRIVACY_SETTINGS_REASK_TITLE}
            </Text>
            <Text color={colors.textSecondary} style={{ fontFamily: fonts.body, fontSize: 14, lineHeight: 20 }}>
              {PRIVACY_SETTINGS_REASK_BODY}
            </Text>
          </Pressable>
        ) : null}

        <View>
          <Text color={colors.textMuted} style={{ fontFamily: fonts.bodyBold, fontSize: 12, letterSpacing: 1, textTransform: 'uppercase' }}>
            Your choices
          </Text>
          <Row label="Health data" value={onOff(healthOn)} onPress={onManageChoices} />
          <Row label="AI planning" value={onOff(aiOn)} onPress={onManageChoices} />
          <Row label="Sharing with my coach" value={onOff(coachOn)} onPress={onManageChoices} />
        </View>

        <View>
          <Text color={colors.textMuted} style={{ fontFamily: fonts.bodyBold, fontSize: 12, letterSpacing: 1, textTransform: 'uppercase' }}>
            Your rights
          </Text>
          <Text color={colors.textMuted} style={{ fontFamily: fonts.body, fontSize: 13, lineHeight: 18, paddingTop: 8 }}>
            {PRIVACY_RIGHTS_PLACEHOLDER_NOTE}
          </Text>
          <Row label={PRIVACY_RIGHTS_ROW_LABEL} sub={PRIVACY_RIGHTS_ROW_SUB} onPress={onRights} />
          <Row label={PRIVACY_DOWNLOAD_LABEL} sub={PRIVACY_DOWNLOAD_SUB} onPress={onExport} />
          <Row label={PRIVACY_DELETE_HEALTH_LABEL} sub={PRIVACY_DELETE_HEALTH_SUB} danger={false} onPress={onDeleteHealth} />
          <Row label={PRIVACY_DELETE_ACCOUNT_LABEL} sub={PRIVACY_DELETE_ACCOUNT_SUB} danger onPress={onDeleteAccount} />
        </View>

        <View>
          <Text color={colors.textMuted} style={{ fontFamily: fonts.bodyBold, fontSize: 12, letterSpacing: 1, textTransform: 'uppercase' }}>
            Coaching
          </Text>
          <Row label={PRIVACY_COACHING_LABEL} sub={PRIVACY_COACHING_SUB} onPress={onCoaching} />
        </View>

        <View>
          <Text color={colors.textMuted} style={{ fontFamily: fonts.bodyBold, fontSize: 12, letterSpacing: 1, textTransform: 'uppercase' }}>
            Documents
          </Text>
          <Row label="Privacy Policy" onPress={onPrivacyPolicy} />
          <Row label={HEALTH_POLICY_LINK_LABEL} onPress={onHealthPolicy} />
          <Row label="Terms of Service" onPress={onTerms} />
        </View>
      </ScrollView>
    </ScreenBackground>
  );
}
