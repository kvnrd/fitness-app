import { Pressable, View } from 'react-native';
import { Text } from '../../components/ui';
import { HeroNumeral } from '../../components/HeroNumeral';
import { useTheme } from '../../theme/ThemeProvider';
import { minControlSize } from '../../theme/tokens';
import {
  GOAL_EDIT,
  TREND_WEIGHT_LABEL,
  WEIGHT_EMPTY_ALT,
  WEIGHT_EMPTY_BODY,
  WEIGHT_EMPTY_CTA,
  WEIGHT_EMPTY_TITLE,
  WEIGHT_GATE_TITLE,
  gatedWeightBody,
} from '../teenWeightCopy.ts';
import type { WeightSurfaceState } from '../weightGate.ts';
import { HealthPills } from './HealthPills';

export type WeightChartModel = {
  trendLabel: string;
  unit: string;
  changeLabel?: string;
  goalLabel?: string;
  goalSub?: string;
  accessibilityLabel?: string;
};

export function ProgressWeightScreen({
  surface,
  healthSelf,
  healthParent,
  model,
  onLog,
  onOpenGoal,
  onConnectHealth,
}: {
  surface: WeightSurfaceState;
  healthSelf: boolean;
  healthParent: boolean;
  model?: WeightChartModel | null;
  onLog?: () => void;
  onOpenGoal?: () => void;
  onConnectHealth?: () => void;
}) {
  const { colors, fonts, radius } = useTheme();
  const teenGated = surface.kind === 'gated_teen_off' || surface.kind === 'gated_parent_off';

  const ghost = (
    <View
      accessibilityRole="summary"
      style={{
        height: 180,
        borderRadius: radius.hero ?? 24,
        borderWidth: 1,
        borderColor: colors.border,
        borderStyle: 'dashed',
        backgroundColor: colors.surfaceSunken ?? colors.surface,
      }}
    />
  );

  if (teenGated) {
    return (
      <View style={{ gap: 16 }}>
        {ghost}
        <Text variant="title" accessibilityRole="header">{WEIGHT_GATE_TITLE}</Text>
        <Text color={colors.textSecondary} style={{ fontFamily: fonts.body, fontSize: 16, lineHeight: 24 }}>
          {gatedWeightBody(surface.kind === 'gated_parent_off' ? 'gated_parent_off' : 'gated_teen_off')}
        </Text>
        <HealthPills selfOn={healthSelf} parentOn={healthParent} />
      </View>
    );
  }

  if (!surface.showValues) return null;

  if (!model) {
    return (
      <View style={{ gap: 16 }}>
        {ghost}
        <Text variant="title" accessibilityRole="header">{WEIGHT_EMPTY_TITLE}</Text>
        <Text color={colors.textSecondary} style={{ fontFamily: fonts.body, fontSize: 14, lineHeight: 20 }}>
          {WEIGHT_EMPTY_BODY}
        </Text>
        {onLog ? (
          <Pressable onPress={onLog} accessibilityRole="button" accessibilityLabel={WEIGHT_EMPTY_CTA} style={{ minHeight: minControlSize, justifyContent: 'center' }}>
            <Text color={colors.accentInk} style={{ fontFamily: fonts.bodySemi, fontSize: 16 }}>{WEIGHT_EMPTY_CTA}</Text>
          </Pressable>
        ) : null}
        {onConnectHealth ? (
          <Pressable onPress={onConnectHealth} accessibilityRole="button" accessibilityLabel={WEIGHT_EMPTY_ALT} style={{ minHeight: minControlSize, justifyContent: 'center' }}>
            <Text color={colors.textSecondary} style={{ fontFamily: fonts.body, fontSize: 14 }}>{WEIGHT_EMPTY_ALT}</Text>
          </Pressable>
        ) : null}
      </View>
    );
  }

  return (
    <View style={{ gap: 16 }} accessibilityLabel={model.accessibilityLabel}>
      <Text variant="label" color={colors.textSecondary}>{TREND_WEIGHT_LABEL}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8 }}>
        <HeroNumeral variant="stamp">{model.trendLabel}</HeroNumeral>
        <Text variant="body" color={colors.textSecondary}>{model.unit}</Text>
      </View>
      {model.changeLabel ? (
        <Text color={colors.textSecondary} style={{ fontFamily: fonts.body, fontSize: 14 }}>{model.changeLabel}</Text>
      ) : null}
      <View
        style={{
          height: 180,
          borderRadius: radius.hero ?? 24,
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: colors.surface,
        }}
      />
      {surface.showGoal && model.goalLabel ? (
        <Pressable
          onPress={onOpenGoal}
          accessibilityRole="button"
          accessibilityLabel={model.goalLabel}
          style={{
            minHeight: minControlSize,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: colors.glass ?? colors.surface,
            borderColor: colors.glassBorder ?? colors.border,
            borderWidth: 1,
            borderRadius: radius.hero ?? 24,
            paddingHorizontal: 16,
            paddingVertical: 12,
          }}
        >
          <View style={{ flex: 1, gap: 2 }}>
            <Text color={colors.text} style={{ fontFamily: fonts.bodySemi, fontSize: 14 }}>{model.goalLabel}</Text>
            {model.goalSub ? (
              <Text color={colors.textMuted} style={{ fontFamily: fonts.body, fontSize: 12 }}>{model.goalSub}</Text>
            ) : null}
          </View>
          <Text color={colors.accentInk} style={{ fontFamily: fonts.bodySemi, fontSize: 14 }}>{GOAL_EDIT}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
