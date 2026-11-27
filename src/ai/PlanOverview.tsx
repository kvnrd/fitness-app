import { View } from 'react-native';
import { Text } from '../components/ui';
import { useTheme } from '../theme/ThemeProvider';

/** Heading approved by Kevin on 2026-11-27 (not from Counsel's string tables). */
export const PLAN_OVERVIEW_HEADING = 'Plan overview';

/** The AI's 3–5 sentence summary of how the week is structured. Renders nothing when there's no overview. */
export function PlanOverview({ text }: { text?: string | null }) {
  const { colors, fonts } = useTheme();
  const body = text?.trim();
  if (!body) return null;
  return (
    <View style={{ borderRadius: 20, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, padding: 16, gap: 6 }}>
      <Text accessibilityRole="header" color={colors.textMuted} style={{ fontFamily: fonts.bodyBold, fontSize: 12, letterSpacing: 1.2, textTransform: 'uppercase' }}>
        {PLAN_OVERVIEW_HEADING}
      </Text>
      <Text color={colors.text} style={{ fontFamily: fonts.bodyMedium, fontSize: 15, lineHeight: 22 }}>
        {body}
      </Text>
    </View>
  );
}
