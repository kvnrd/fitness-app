import { View } from 'react-native';
import { AI_PLAN_NOTICE } from '../ai/notice';
import { useTheme } from '../theme/ThemeProvider';
import { Text } from './ui';

/**
 * Counsel's plan-screen notice (Paper board 27 "Plan AI notice"): an "AI" tag in the accent ink, then the fixed sentence.
 * Shown on EVERY surface that shows an AI-made plan and never hidden (phase4-review #7); wording is fixed. [ATTORNEY]
 */
export function AiNotice() {
  const { colors, fonts } = useTheme();
  return (
    <View
      accessibilityRole="text"
      accessibilityLabel={AI_PLAN_NOTICE}
      style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start', borderWidth: 1, borderColor: colors.border, borderRadius: 16, paddingVertical: 14, paddingHorizontal: 16, backgroundColor: colors.surface }}
    >
      <Text importantForAccessibility="no" color={colors.accentInk} style={{ fontFamily: fonts.bodyBold, fontSize: 14, lineHeight: 22, letterSpacing: 0.5 }}>
        AI
      </Text>
      <Text importantForAccessibility="no" color={colors.textSecondary} style={{ flex: 1, fontFamily: fonts.body, fontSize: 16, lineHeight: 22 }}>
        {AI_PLAN_NOTICE}
      </Text>
    </View>
  );
}
