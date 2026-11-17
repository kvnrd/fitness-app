import { Ionicons } from '@expo/vector-icons';
import { Pressable, View } from 'react-native';
import { Text } from '../../components/ui';
import { useTheme } from '../../theme/ThemeProvider';
import { minControlSize } from '../../theme/tokens';
import {
  heaviestLiftEstLine,
  mostRepsToastLine,
  PR_TOAST_MULTI,
  PR_TOAST_NEW,
  prA11yHeaviestAndE1rm,
  prA11yMostReps,
  prA11ySingle,
  prDeltaOverBest,
} from '../phase5bCopy.ts';
import type { E1rmEstimate } from '../e1rm.ts';

export type PrToastModel =
  | {
      kind: 'heaviest_lift';
      exercise: string;
      load: string;
      unit: string;
      reps: number;
      delta: string;
      prevLoad: string;
      prevReps: number;
    }
  | {
      kind: 'heaviest_and_e1rm';
      exercise: string;
      load: string;
      unit: string;
      reps: number;
      e1rm: E1rmEstimate;
      e1rmDisplay: string;
    }
  | {
      kind: 'most_reps';
      exercise: string;
      load: string;
      unit: string;
      reps: number;
      plus: number;
    }
  | {
      kind: 'multi';
      n: number;
      exercise: string;
      load: string;
      unit: string;
      reps: number;
      line: string;
      accessibilityLabel: string;
    };

export function prToastCopy(model: PrToastModel): { title: string; meta: string; line: string; accessibilityLabel: string } {
  if (model.kind === 'heaviest_lift') {
    return {
      title: PR_TOAST_NEW(model.exercise),
      meta: `${model.load} ${model.unit} × ${model.reps}`,
      line: prDeltaOverBest(model.delta, model.unit, model.prevLoad, model.prevReps),
      accessibilityLabel: prA11ySingle(model.exercise, model.load, model.unit, model.reps),
    };
  }
  if (model.kind === 'heaviest_and_e1rm') {
    return {
      title: PR_TOAST_MULTI(2, model.exercise),
      meta: `${model.load} ${model.unit} × ${model.reps}`,
      line: heaviestLiftEstLine(model.e1rmDisplay, model.unit),
      accessibilityLabel: prA11yHeaviestAndE1rm(model.exercise, model.load, model.unit, model.reps, model.e1rmDisplay),
    };
  }
  if (model.kind === 'most_reps') {
    return {
      title: PR_TOAST_NEW(model.exercise),
      meta: `${model.load} ${model.unit} × ${model.reps}`,
      line: mostRepsToastLine(model.load, model.unit, model.plus),
      accessibilityLabel: prA11yMostReps(model.exercise, model.reps, model.load, model.unit, model.plus),
    };
  }
  return {
    title: PR_TOAST_MULTI(model.n, model.exercise),
    meta: `${model.load} ${model.unit} × ${model.reps}`,
    line: model.line,
    accessibilityLabel: model.accessibilityLabel,
  };
}

export function PrToast({ model, onPress }: { model: PrToastModel; onPress?: () => void }) {
  const { colors, fonts, radius } = useTheme();
  const copy = prToastCopy(model);
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={copy.accessibilityLabel}
      style={{
        minHeight: minControlSize,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        padding: 14,
        borderRadius: radius.hero ?? 20,
        backgroundColor: colors.surfaceRaised ?? colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
      }}
    >
      <Ionicons name="trophy" size={22} color={colors.accentInk} />
      <View style={{ flex: 1, gap: 2 }}>
        <Text color={colors.text} style={{ fontFamily: fonts.bodySemi, fontSize: 16, lineHeight: 22 }}>
          {copy.title}
        </Text>
        <Text color={colors.textSecondary} style={{ fontFamily: fonts.body, fontSize: 14, lineHeight: 20 }}>
          {copy.meta}
        </Text>
        <Text color={colors.textMuted} style={{ fontFamily: fonts.body, fontSize: 14, lineHeight: 20 }}>
          {copy.line}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
    </Pressable>
  );
}
