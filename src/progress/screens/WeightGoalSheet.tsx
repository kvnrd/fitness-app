import { Pressable, View } from 'react-native';
import { Text } from '../../components/ui';
import { useTheme } from '../../theme/ThemeProvider';
import { minControlSize } from '../../theme/tokens';
import { SheetCard, EqualActions } from './sheet.tsx';
import {
  CANCEL,
  GOAL_DIRECTIONS,
  SAVE_GOAL,
  type GoalDirection,
} from '../teenWeightCopy.ts';

export function WeightGoalSheet({
  direction,
  targetLabel,
  paceLabel,
  dateLabel,
  onDirection,
  onCancel,
  onSave,
}: {
  direction: GoalDirection;
  targetLabel: string;
  paceLabel: string;
  dateLabel?: string;
  onDirection?: (d: GoalDirection) => void;
  onCancel: () => void;
  onSave: () => void;
}) {
  const { colors, fonts, radius } = useTheme();
  return (
    <SheetCard>
      <Text variant="title" accessibilityRole="header">Weight goal</Text>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {GOAL_DIRECTIONS.map((d) => {
          const on = d === direction;
          return (
            <Pressable
              key={d}
              onPress={() => onDirection?.(d)}
              accessibilityRole="button"
              accessibilityState={{ selected: on }}
              accessibilityLabel={d}
              style={{
                flex: 1,
                minHeight: minControlSize,
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: radius.pill,
                borderWidth: 1,
                borderColor: on ? colors.accentInk : colors.border,
                backgroundColor: on ? colors.surfaceSunken : 'transparent',
              }}
            >
              <Text color={colors.text} style={{ fontFamily: fonts.bodySemi, fontSize: 14 }}>{d}</Text>
            </Pressable>
          );
        })}
      </View>
      <Text color={colors.text} style={{ fontFamily: fonts.body, fontSize: 16 }}>{targetLabel}</Text>
      <Text color={colors.textSecondary} style={{ fontFamily: fonts.body, fontSize: 14 }}>{paceLabel}</Text>
      {dateLabel ? <Text color={colors.textMuted} style={{ fontFamily: fonts.body, fontSize: 14 }}>{dateLabel}</Text> : null}
      <EqualActions left={CANCEL} right={SAVE_GOAL} onLeft={onCancel} onRight={onSave} />
    </SheetCard>
  );
}
