import { Pressable } from 'react-native';
import { AI_PLAN_PAUSED_ADULT, AI_PLAN_PAUSED_TEEN } from '../legal/text';
import { useTheme } from '../theme/ThemeProvider';
import { Text } from './ui';

/** Shown when the health-screen re-screen is overdue. AI pauses; the saved plan stays visible. */
export function HealthScreenPausedBanner({
  teen = false,
  onUpdate,
}: {
  teen?: boolean;
  onUpdate?: () => void;
}) {
  const { colors, fonts } = useTheme();
  const label = teen ? AI_PLAN_PAUSED_TEEN : AI_PLAN_PAUSED_ADULT;
  return (
    <Pressable
      onPress={onUpdate}
      accessibilityRole={onUpdate ? 'button' : 'text'}
      accessibilityLabel={label}
      style={{
        borderWidth: 1,
        borderColor: colors.borderStrong,
        backgroundColor: colors.surfaceSunken,
        borderRadius: 16,
        paddingVertical: 14,
        paddingHorizontal: 16,
      }}
    >
      <Text color={colors.text} style={{ fontFamily: fonts.bodyMedium, fontSize: 16, lineHeight: 24 }}>
        {label}
      </Text>
    </Pressable>
  );
}
