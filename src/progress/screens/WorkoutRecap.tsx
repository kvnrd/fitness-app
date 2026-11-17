import { Pressable, ScrollView, View } from 'react-native';
import { ScreenBackground } from '../../components/ScreenAtmosphere';
import { HeroNumeral } from '../../components/HeroNumeral';
import { Text } from '../../components/ui';
import { useTheme } from '../../theme/ThemeProvider';
import { minControlSize, space } from '../../theme/tokens';
import {
  EST_1RM_LABEL,
  HEAVIEST_LIFT,
  RECAP_COMPLETE,
  RECAP_DONE,
  RECAP_EXERCISES,
  RECAP_NO_PRS,
  RECAP_PRS,
  RECAP_SAVED,
  RECAP_SETS,
  RECAP_TIME,
  RECAP_TOTAL_VOLUME,
  recapLastVolume,
  recapNewCount,
} from '../phase5bCopy.ts';
import type { RecapStreakLine } from '../workoutRecap.ts';

export type RecapPrRow = {
  exercise: string;
  detail: string;
  delta?: string;
};

export function WorkoutRecapScreen({
  dateLine,
  complete,
  volume,
  unit,
  lastWorkout,
  lastVolume,
  bodyweightRepsCopy,
  setsDone,
  setsTotal,
  exercisesDone,
  exercisesTotal,
  minutes,
  prs,
  streakLine,
  onDone,
}: {
  dateLine: string;
  complete: boolean;
  volume: string;
  unit: string;
  lastWorkout: string;
  lastVolume: string;
  bodyweightRepsCopy?: string | null;
  setsDone: number;
  setsTotal: number;
  exercisesDone: number;
  exercisesTotal: number;
  minutes: number;
  prs: readonly RecapPrRow[];
  streakLine: RecapStreakLine;
  onDone: () => void;
}) {
  const { colors, fonts, radius } = useTheme();
  return (
    <ScreenBackground>
      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 48, gap: 20 }}>
        <Text color={colors.textMuted} style={{ fontFamily: fonts.bodyMedium, fontSize: 14 }}>
          {dateLine}
        </Text>
        <Text variant="hero" accessibilityRole="header">
          {complete ? RECAP_COMPLETE : RECAP_SAVED}
        </Text>
        <View style={{ backgroundColor: colors.glass ?? colors.surface, borderColor: colors.glassBorder ?? colors.border, borderWidth: 1, borderRadius: radius.hero ?? 24, padding: 20, gap: 8 }}>
          <Text variant="label" color={colors.textSecondary}>{RECAP_TOTAL_VOLUME}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8 }}>
            <HeroNumeral variant="stamp">{volume}</HeroNumeral>
            <Text variant="body" color={colors.textSecondary}>{unit}</Text>
          </View>
          <Text color={colors.textMuted} style={{ fontFamily: fonts.body, fontSize: 14 }}>
            {recapLastVolume(lastWorkout, lastVolume, unit)}
          </Text>
          {bodyweightRepsCopy ? (
            <Text color={colors.textSecondary} style={{ fontFamily: fonts.body, fontSize: 14, lineHeight: 20 }}>
              {bodyweightRepsCopy}
            </Text>
          ) : null}
          <View style={{ flexDirection: 'row', gap: 16, paddingTop: 8 }}>
            <View style={{ flex: 1 }}>
              <Text color={colors.text} style={{ fontFamily: fonts.bodySemi, fontSize: 16 }}>{setsDone} / {setsTotal}</Text>
              <Text color={colors.textMuted}>{RECAP_SETS}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text color={colors.text} style={{ fontFamily: fonts.bodySemi, fontSize: 16 }}>{exercisesDone} / {exercisesTotal}</Text>
              <Text color={colors.textMuted}>{RECAP_EXERCISES}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text color={colors.text} style={{ fontFamily: fonts.bodySemi, fontSize: 16 }}>{minutes} min</Text>
              <Text color={colors.textMuted}>{RECAP_TIME}</Text>
            </View>
          </View>
        </View>

        <View style={{ gap: 8 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <Text color={colors.text} style={{ fontFamily: fonts.bodySemi, fontSize: 16 }}>{RECAP_PRS}</Text>
            {prs.length > 0 ? (
              <Text color={colors.textMuted}>{recapNewCount(prs.length)}</Text>
            ) : null}
          </View>
          {prs.length === 0 ? (
            <Text color={colors.textSecondary} style={{ fontFamily: fonts.body, fontSize: 15, lineHeight: 22 }}>
              {RECAP_NO_PRS}
            </Text>
          ) : (
            prs.map((pr) => (
              <View key={pr.exercise + pr.detail} style={{ paddingVertical: 8, borderTopWidth: 1, borderTopColor: colors.border, gap: 2 }}>
                <Text color={colors.text} style={{ fontFamily: fonts.bodySemi, fontSize: 16 }}>{pr.exercise}</Text>
                <Text color={colors.textSecondary} style={{ fontFamily: fonts.body, fontSize: 14 }}>{pr.detail}</Text>
                {pr.delta ? <Text color={colors.accentInk} style={{ fontFamily: fonts.bodyMedium, fontSize: 14 }}>{pr.delta}</Text> : null}
              </View>
            ))
          )}
        </View>

        {streakLine ? (
          <View style={{ gap: 4, paddingTop: 8 }}>
            <Text color={colors.text} style={{ fontFamily: fonts.bodySemi, fontSize: 16 }}>{streakLine.title}</Text>
            <Text color={colors.textSecondary} style={{ fontFamily: fonts.body, fontSize: 15, lineHeight: 22 }}>{streakLine.body}</Text>
          </View>
        ) : null}

        <Pressable
          onPress={onDone}
          accessibilityRole="button"
          accessibilityLabel={RECAP_DONE}
          style={{ minHeight: minControlSize, marginTop: space.md, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.accent, borderRadius: radius.input ?? 12 }}
        >
          <Text style={{ fontFamily: fonts.bodySemi, fontSize: 16, color: colors.accentInk }}>{RECAP_DONE}</Text>
        </Pressable>
      </ScrollView>
    </ScreenBackground>
  );
}

export { EST_1RM_LABEL, HEAVIEST_LIFT };
