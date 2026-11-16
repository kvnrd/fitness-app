import { Ionicons } from '@expo/vector-icons';
import { Pressable, ScrollView, Switch, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenBackground } from '../../components/ScreenAtmosphere';
import { Text } from '../../components/ui';
import { useTheme } from '../../theme/ThemeProvider';
import { space } from '../../theme/tokens';
import { NOTIFICATIONS_LOCK_SCREEN_NOTE } from '../../legal/text';

export type NotificationPrefs = {
  workoutReminders: boolean;
  planReady: boolean;
  messages: boolean;
};

function ToggleRow({
  label,
  sub,
  value,
  onValue,
}: {
  label: string;
  sub?: string;
  value: boolean;
  onValue: (v: boolean) => void;
}) {
  const { colors, fonts } = useTheme();
  return (
    <View style={{ paddingVertical: 14, gap: 2, flexDirection: 'row', alignItems: 'center', borderTopWidth: 1, borderTopColor: colors.border }}>
      <View style={{ flex: 1, gap: 2 }}>
        <Text color={colors.text} style={{ fontFamily: fonts.bodySemi, fontSize: 16, lineHeight: 24 }}>
          {label}
        </Text>
        {sub ? (
          <Text color={colors.textSecondary} style={{ fontFamily: fonts.body, fontSize: 14, lineHeight: 20 }}>
            {sub}
          </Text>
        ) : null}
      </View>
      <Switch value={value} onValueChange={onValue} accessibilityLabel={label} />
    </View>
  );
}

export function NotificationsSettingsScreen({
  prefs,
  onChange,
  onBack,
  isMinor = false,
}: {
  prefs: NotificationPrefs;
  onChange: (next: NotificationPrefs) => void;
  onBack?: () => void;
  isMinor?: boolean;
}) {
  const { colors, fonts } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <ScreenBackground>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + space.md, paddingHorizontal: 24, paddingBottom: 48, gap: 20 }}>
        <Pressable onPress={onBack} accessibilityRole="button" accessibilityLabel="Back" style={{ alignSelf: 'flex-start', paddingVertical: 4 }}>
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </Pressable>
        <Text variant="hero" accessibilityRole="header">
          Notifications
        </Text>
        <Text color={colors.textSecondary} style={{ fontFamily: fonts.body, fontSize: 16, lineHeight: 24 }}>
          These stay on this device for now. Push notification preferences will be saved to your account before launch.
        </Text>
        <View>
          <ToggleRow
            label="Workout reminders"
            sub="A nudge on days you planned to train."
            value={prefs.workoutReminders}
            onValue={(v) => onChange({ ...prefs, workoutReminders: v })}
          />
          <ToggleRow
            label="Plan ready"
            sub="When a new or updated AI plan is ready to review."
            value={prefs.planReady}
            onValue={(v) => onChange({ ...prefs, planReady: v })}
          />
          <ToggleRow
            label="Messages"
            sub="When a parent or coach sends you a message."
            value={prefs.messages}
            onValue={(v) => onChange({ ...prefs, messages: v })}
          />
        </View>
        {isMinor ? (
          <Text color={colors.textSecondary} style={{ fontFamily: fonts.body, fontSize: 14, lineHeight: 20 }}>
            {NOTIFICATIONS_LOCK_SCREEN_NOTE}
          </Text>
        ) : null}
      </ScrollView>
    </ScreenBackground>
  );
}
