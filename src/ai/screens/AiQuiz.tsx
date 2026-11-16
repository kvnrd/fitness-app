import { Pressable, View } from 'react-native';
import { Text } from '../../components/ui';
import { InfoNote } from '../../onboarding/ui/InfoNote';
import { Caption, PillOption } from '../../onboarding/ui/Pills';
import { FooterHint, OnbScreen } from '../../onboarding/ui/OnbScreen';
import { OnbSub, OnbTitle } from '../../onboarding/ui/OnbText';
import { PrimaryCta } from '../../onboarding/ui/PrimaryCta';
import { useTheme } from '../../theme/ThemeProvider';
import {
  DAYS_PER_WEEK,
  EQUIPMENT_OPTIONS,
  EXPERIENCE_OPTIONS,
  INJURY_CHIPS,
  QUIZ_GENERATE,
  QUIZ_GOAL_CAP,
  QUIZ_INJURY_CAP,
  QUIZ_PRIVACY,
  QUIZ_SUB_ADULT,
  QUIZ_SUB_TEEN,
  QUIZ_TITLE,
  SESSION_MINUTES,
  quizComplete,
  quizGoals,
  type QuizState,
} from '../quiz';

function Wrap({ children }: { children: React.ReactNode }) {
  return <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>{children}</View>;
}

export function AiQuizScreen({
  state,
  onChange,
  teen,
  onBack,
  onGenerate,
  busy,
  message,
}: {
  state: QuizState;
  onChange: (s: QuizState) => void;
  teen: boolean;
  onBack?: () => void;
  onGenerate: () => void;
  busy?: boolean;
  message?: string | null;
}) {
  const { colors, fonts } = useTheme();
  const goals = quizGoals(teen);
  const ready = quizComplete(state);
  return (
    <OnbScreen
      contentGap={24}
      onBack={onBack}
      headerRight={
        <Text color={colors.textMuted} style={{ fontFamily: fonts.bodyBold, fontSize: 14, letterSpacing: 1.1, textTransform: 'uppercase' }}>
          2 of 2
        </Text>
      }
      footer={
        <>
          <PrimaryCta label={QUIZ_GENERATE} onPress={onGenerate} disabled={!ready} busy={busy} />
          {!ready ? <FooterHint>Answer each section to generate.</FooterHint> : null}
          {message ? <FooterHint>{message}</FooterHint> : null}
        </>
      }
    >
      <View style={{ gap: 8 }}>
        <OnbTitle>{QUIZ_TITLE}</OnbTitle>
        <OnbSub>{teen ? QUIZ_SUB_TEEN : QUIZ_SUB_ADULT}</OnbSub>
      </View>

      <View style={{ gap: 10 }}>
        <Caption right={<Text color={colors.textMuted} style={{ fontSize: 12 }}>{QUIZ_GOAL_CAP}</Text>}>
          Goal
        </Caption>
        <Wrap>
          {goals.map((g) => (
            <PillOption
              key={g.id}
              label={g.label}
              selected={state.goals.includes(g.id)}
              onPress={() => {
                const next = state.goals.includes(g.id)
                  ? state.goals.filter((id) => id !== g.id)
                  : state.goals.length >= 2
                    ? [...state.goals.slice(1), g.id]
                    : [...state.goals, g.id];
                onChange({ ...state, goals: next });
              }}
            />
          ))}
        </Wrap>
      </View>

      <View style={{ gap: 10 }}>
        <Caption>Experience</Caption>
        <View
          style={{
            flexDirection: 'row',
            borderRadius: 999,
            backgroundColor: colors.surfaceSunken,
            padding: 4,
          }}
        >
          {EXPERIENCE_OPTIONS.map((o) => {
            const on = state.experience === o.id;
            return (
              <Pressable
                key={o.id}
                onPress={() => onChange({ ...state, experience: o.id })}
                accessibilityRole="button"
                accessibilityState={{ selected: on }}
                accessibilityLabel={o.label}
                style={{
                  flex: 1,
                  height: 40,
                  borderRadius: 999,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: on ? colors.surface : 'transparent',
                }}
              >
                <Text color={on ? colors.text : colors.textMuted} style={{ fontFamily: on ? fonts.bodyBold : fonts.bodySemi, fontSize: 14 }}>
                  {o.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={{ gap: 10 }}>
        <Caption>Equipment</Caption>
        <Wrap>
          {EQUIPMENT_OPTIONS.map((o) => (
            <PillOption
              key={o.id}
              label={o.label}
              selected={state.equipment.includes(o.id)}
              onPress={() =>
                onChange({
                  ...state,
                  equipment: state.equipment.includes(o.id)
                    ? state.equipment.filter((id) => id !== o.id)
                    : [...state.equipment, o.id],
                })
              }
            />
          ))}
        </Wrap>
      </View>

      <View style={{ gap: 10 }}>
        <Caption>Days per week</Caption>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {DAYS_PER_WEEK.map((d) => {
            const on = state.daysPerWeek === d;
            return (
              <Pressable
                key={d}
                onPress={() => onChange({ ...state, daysPerWeek: d })}
                accessibilityRole="button"
                accessibilityState={{ selected: on }}
                accessibilityLabel={`${d} days per week`}
                style={{
                  flex: 1,
                  height: 48,
                  borderRadius: 12,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: on ? colors.accentSoft : 'transparent',
                  borderWidth: on ? 0 : 1,
                  borderColor: colors.borderStrong,
                }}
              >
                <Text
                  color={on ? colors.accentInk : colors.textSecondary}
                  style={{ fontFamily: fonts.displayBold, fontSize: 20, lineHeight: 24 }}
                >
                  {d}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={{ gap: 10 }}>
        <Caption>Session length</Caption>
        <Wrap>
          {SESSION_MINUTES.map((m) => (
            <PillOption
              key={m}
              label={`${m} min`}
              selected={state.sessionMinutes === m}
              onPress={() => onChange({ ...state, sessionMinutes: m })}
            />
          ))}
        </Wrap>
      </View>

      <View style={{ gap: 10 }}>
        <Caption right={<Text color={colors.textMuted} style={{ fontSize: 12 }}>{QUIZ_INJURY_CAP}</Text>}>
          Injury category
        </Caption>
        <Wrap>
          {INJURY_CHIPS.map((c) => (
            <PillOption
              key={c.id}
              label={c.label}
              selected={state.injury === c.id}
              onPress={() => onChange({ ...state, injury: c.id })}
            />
          ))}
        </Wrap>
      </View>

      <InfoNote compact>{QUIZ_PRIVACY}</InfoNote>
    </OnbScreen>
  );
}
