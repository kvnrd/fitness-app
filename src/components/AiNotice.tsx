import { View } from 'react-native';
import { AI_PLAN_NOTICE } from '../ai/notice';
import { useTheme } from '../theme/ThemeProvider';
import { radius, space } from '../theme/tokens';
import { Text } from './ui';

/** Counsel's plan-screen notice. Shown on every screen that shows an AI-made plan. Wording is fixed. */
export function AiNotice() {
  const { colors } = useTheme();
  return (
    <View
      accessibilityRole="text"
      style={{ borderWidth: 1, borderColor: colors.border, borderRadius: radius.input, padding: space.md }}
    >
      <Text variant="small" color={colors.textSecondary}>
        {AI_PLAN_NOTICE}
      </Text>
    </View>
  );
}
