import { Pressable, View } from 'react-native';
import { Text } from '../../components/ui';
import { HeroNumeral } from '../../components/HeroNumeral';
import { useTheme } from '../../theme/ThemeProvider';
import { minControlSize } from '../../theme/tokens';
import {
  gatedWeightBody,
  HOME_WEIGHT_CARD_TITLE,
  HOME_WEIGHT_PROGRESS_LINK,
} from '../teenWeightCopy.ts';
import type { WeightSurfaceState } from '../weightGate.ts';
import { HealthPills } from './HealthPills';

export function HomeWeightCard({
  surface,
  healthSelf,
  healthParent,
  trendLabel,
  unit,
  goalLabel,
  accessibilityLabel,
  onOpenProgress,
}: {
  surface: WeightSurfaceState;
  healthSelf: boolean;
  healthParent: boolean;
  trendLabel?: string;
  unit?: string;
  goalLabel?: string;
  accessibilityLabel?: string;
  onOpenProgress?: () => void;
}) {
  const { colors, fonts, radius } = useTheme();
  const gated = surface.kind === 'gated_teen_off' || surface.kind === 'gated_parent_off';

  return (
    <View
      accessibilityRole="summary"
      accessibilityLabel={gated ? HOME_WEIGHT_CARD_TITLE : accessibilityLabel ?? HOME_WEIGHT_CARD_TITLE}
      style={{
        backgroundColor: colors.glass ?? colors.surface,
        borderColor: colors.glassBorder ?? colors.border,
        borderWidth: 1,
        borderRadius: radius.hero ?? 24,
        padding: 16,
        gap: 10,
      }}
    >
      <Text color={colors.text} style={{ fontFamily: fonts.bodySemi, fontSize: 16 }}>{HOME_WEIGHT_CARD_TITLE}</Text>
      {gated ? (
        <>
          <HealthPills selfOn={healthSelf} parentOn={healthParent} />
          <Text color={colors.textSecondary} style={{ fontFamily: fonts.body, fontSize: 15, lineHeight: 22 }}>
            {gatedWeightBody(surface.kind === 'gated_parent_off' ? 'gated_parent_off' : 'gated_teen_off')}
          </Text>
        </>
      ) : (
        <>
          {trendLabel ? (
            <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8 }}>
              <HeroNumeral variant="stamp">{trendLabel}</HeroNumeral>
              <Text variant="body" color={colors.textSecondary}>{unit}</Text>
            </View>
          ) : null}
          {surface.showGoal && goalLabel ? (
            <Text color={colors.textSecondary} style={{ fontFamily: fonts.body, fontSize: 14 }}>{goalLabel}</Text>
          ) : null}
          {onOpenProgress ? (
            <Pressable onPress={onOpenProgress} accessibilityRole="button" accessibilityLabel={HOME_WEIGHT_PROGRESS_LINK} style={{ minHeight: minControlSize, justifyContent: 'center' }}>
              <Text color={colors.accentInk} style={{ fontFamily: fonts.bodySemi, fontSize: 16 }}>{HOME_WEIGHT_PROGRESS_LINK}</Text>
            </Pressable>
          ) : null}
        </>
      )}
    </View>
  );
}
