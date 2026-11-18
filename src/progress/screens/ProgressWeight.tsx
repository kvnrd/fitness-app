import { useState } from 'react';
import { Pressable, View } from 'react-native';
import Svg, { Circle, Defs, Line, LinearGradient, Path, Stop, Text as SvgText } from 'react-native-svg';
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
  /** Sample or live trend values, oldest first. */
  points?: readonly number[];
  goalValue?: number;
  range?: { lo: number; hi: number };
  yLabels?: readonly string[];
  xLabels?: readonly string[];
  selectedIndex?: number;
};

/** Preview series matching the Phase 5 teen-weight mockup (40-day Sam trend). */
export const PREVIEW_WEIGHT_TREND: number[] = Array.from(
  { length: 40 },
  (_, i) => 146 - 3.4 * (i / 39) ** 0.9 + 0.22 * Math.sin(i / 3),
);

export const PREVIEW_WEIGHT_CHART = {
  points: PREVIEW_WEIGHT_TREND,
  goalValue: 138,
  range: { lo: 134, hi: 150 },
  yLabels: ['150', '142', '134'],
  xLabels: ['Aug 16', 'Sep 15', 'Oct 15', 'Nov 14'],
  selectedIndex: 31,
} as const;

function WeightTrendChart({
  points,
  lo,
  hi,
  goal,
  yLabels,
  xLabels,
  selectedIndex,
}: {
  points: readonly number[];
  lo: number;
  hi: number;
  goal?: number;
  yLabels?: readonly string[];
  xLabels?: readonly string[];
  selectedIndex?: number;
}) {
  const { colors, fonts, radius } = useTheme();
  const [width, setWidth] = useState(0);
  const chartH = 132;
  const gutter = 36;
  const pad = 12;
  const innerW = Math.max(0, width - pad * 2);
  const plotW = Math.max(0, innerW - gutter);
  const span = hi - lo || 1;
  const n = points.length;
  const X = (i: number) => (n <= 1 ? plotW / 2 : (i * plotW) / (n - 1));
  const Y = (v: number) => chartH - 8 - ((v - lo) / span) * (chartH - 16);
  const d = n
    ? points.map((v, i) => `${i === 0 ? 'M' : 'L'}${X(i).toFixed(1)},${Y(v).toFixed(1)}`).join(' ')
    : '';
  const area = d ? `${d} L${X(n - 1).toFixed(1)},${chartH} L${X(0).toFixed(1)},${chartH} Z` : '';
  const gridY = [8, chartH / 2, chartH - 8];
  const line = colors.accent;
  return (
    <View
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
      style={{
        borderRadius: radius.hero ?? 24,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.surface,
        paddingHorizontal: pad,
        paddingTop: pad,
        paddingBottom: xLabels?.length ? 8 : pad,
        overflow: 'hidden',
      }}
    >
      {width > 0 && d ? (
        <>
          <Svg width={innerW} height={chartH} style={{ overflow: 'visible' }}>
            <Defs>
              <LinearGradient id="weight-trend-area" x1="0" y1="0" x2="0" y2="1">
                <Stop offset={0} stopColor={line} stopOpacity={0.3} />
                <Stop offset={1} stopColor={line} stopOpacity={0} />
              </LinearGradient>
            </Defs>
            {gridY.map((y) => (
              <Line key={y} x1={0} x2={plotW} y1={y} y2={y} stroke={colors.border} strokeWidth={1} />
            ))}
            {yLabels?.length
              ? gridY.map((y, i) =>
                  yLabels[i] ? (
                    <SvgText
                      key={`yl-${i}`}
                      x={innerW}
                      y={y + 4}
                      textAnchor="end"
                      fill={colors.textMuted}
                      fontSize={12}
                      fontFamily={fonts.bodyMedium}
                    >
                      {yLabels[i]}
                    </SvgText>
                  ) : null,
                )
              : null}
            <Path d={area} fill="url(#weight-trend-area)" />
            {goal != null ? (
              <>
                <Line
                  x1={0}
                  x2={plotW}
                  y1={Y(goal)}
                  y2={Y(goal)}
                  stroke={colors.textMuted}
                  strokeWidth={1.5}
                  strokeDasharray="6 5"
                />
                <SvgText
                  x={4}
                  y={Y(goal) - 6}
                  fill={colors.textMuted}
                  fontSize={12}
                  fontFamily={fonts.bodySemi}
                >
                  {`Goal ${goal}`}
                </SvgText>
              </>
            ) : null}
            <Path d={d} fill="none" stroke={line} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
            {selectedIndex != null && points[selectedIndex] != null ? (
              <>
                <Line
                  x1={X(selectedIndex)}
                  x2={X(selectedIndex)}
                  y1={0}
                  y2={chartH}
                  stroke={colors.textMuted}
                  strokeWidth={1}
                  strokeDasharray="2 3"
                />
                <Circle
                  cx={X(selectedIndex)}
                  cy={Y(points[selectedIndex])}
                  r={7}
                  fill={colors.bg}
                  stroke={line}
                  strokeWidth={3}
                />
              </>
            ) : null}
          </Svg>
          {xLabels?.length ? (
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 6, paddingRight: gutter }}>
              {xLabels.map((label) => (
                <Text key={label} color={colors.textMuted} style={{ fontFamily: fonts.bodyMedium, fontSize: 12 }}>
                  {label}
                </Text>
              ))}
            </View>
          ) : null}
        </>
      ) : (
        <View style={{ height: chartH }} />
      )}
    </View>
  );
}

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
      {model.points && model.points.length > 1 ? (
        <WeightTrendChart
          points={model.points}
          lo={model.range?.lo ?? Math.min(...model.points)}
          hi={model.range?.hi ?? Math.max(...model.points)}
          goal={model.goalValue}
          yLabels={model.yLabels}
          xLabels={model.xLabels}
          selectedIndex={model.selectedIndex}
        />
      ) : (
        <View
          style={{
            height: 180,
            borderRadius: radius.hero ?? 24,
            borderWidth: 1,
            borderColor: colors.border,
            backgroundColor: colors.surface,
          }}
        />
      )}
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
