import { View } from 'react-native';
import { Text } from '../../components/ui';
import { useTheme } from '../../theme/ThemeProvider';
import type { WeightSurfaceState } from '../weightGate.ts';

/** Profile Body section. Omitted entirely when weight is gated (25b / 26). */
export function ProfileBodySection({
  surface,
  trendLabel,
  unit,
  goalLabel,
  accessibilityLabel,
}: {
  surface: WeightSurfaceState;
  trendLabel?: string;
  unit?: string;
  goalLabel?: string;
  accessibilityLabel?: string;
}) {
  const { colors, fonts, radius } = useTheme();
  if (!surface.showProfileBody) return null;
  return (
    <View
      accessibilityLabel={accessibilityLabel}
      style={{
        backgroundColor: colors.glass ?? colors.surface,
        borderColor: colors.glassBorder ?? colors.border,
        borderWidth: 1,
        borderRadius: radius.hero ?? 24,
        padding: 16,
        gap: 8,
      }}
    >
      <Text color={colors.textMuted} style={{ fontFamily: fonts.bodyBold, fontSize: 12, letterSpacing: 1, textTransform: 'uppercase' }}>
        Body
      </Text>
      {trendLabel ? (
        <Text color={colors.text} style={{ fontFamily: fonts.bodySemi, fontSize: 20 }}>{trendLabel} {unit}</Text>
      ) : null}
      {surface.showGoal && goalLabel ? (
        <Text color={colors.textSecondary} style={{ fontFamily: fonts.body, fontSize: 14 }}>{goalLabel}</Text>
      ) : null}
    </View>
  );
}
