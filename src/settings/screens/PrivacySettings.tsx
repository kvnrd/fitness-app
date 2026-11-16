import { Ionicons } from '@expo/vector-icons';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenBackground } from '../../components/ScreenAtmosphere';
import { Text } from '../../components/ui';
import { useTheme } from '../../theme/ThemeProvider';
import { space } from '../../theme/tokens';

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
  onExport,
  onDelete,
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
  onExport: () => void;
  onDelete: () => void;
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
          Turn Health data, AI planning, or coach sharing off here. These choices are yours; there is no “accept all.”
        </Text>

        {reaskDue ? (
          <Pressable
            onPress={onReask}
            accessibilityRole="button"
            accessibilityLabel="Confirm Health data"
            style={{ borderWidth: 1, borderColor: colors.borderStrong, backgroundColor: colors.surfaceSunken, padding: 16, gap: 8 }}
          >
            <Text color={colors.text} style={{ fontFamily: fonts.bodySemi, fontSize: 16, lineHeight: 24 }}>
              Confirm Health data
            </Text>
            <Text color={colors.textSecondary} style={{ fontFamily: fonts.body, fontSize: 14, lineHeight: 20 }}>
              It’s been 12 months. Health data does not turn off on its own. Confirm it’s still okay, or turn it off.
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
          <Row label="Download my data" sub="We’ll email a copy. This will be available before launch." onPress={onExport} />
          <Row label="Delete my data" sub="Account deletion will be available before launch." danger onPress={onDelete} />
        </View>

        <View>
          <Text color={colors.textMuted} style={{ fontFamily: fonts.bodyBold, fontSize: 12, letterSpacing: 1, textTransform: 'uppercase' }}>
            Documents
          </Text>
          <Row label="Privacy Policy" onPress={onPrivacyPolicy} />
          <Row label="Health data privacy" onPress={onHealthPolicy} />
          <Row label="Terms of Service" onPress={onTerms} />
        </View>
      </ScrollView>
    </ScreenBackground>
  );
}
