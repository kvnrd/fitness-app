import { Pressable, View } from 'react-native';
import { Text } from '../../components/ui';
import {
  HEALTH_SCREEN_HINT,
  HEALTH_SCREEN_SUB,
  HEALTH_SCREEN_TITLE,
  allAnswered,
  anyYes,
  healthQuestions,
  parentHealthScreenHint,
  parentHealthScreenSub,
  type HealthAnswers,
} from '../healthScreen';
import { FooterHint, OnbScreen } from '../../onboarding/ui/OnbScreen';
import { OnbSub, OnbTitle } from '../../onboarding/ui/OnbText';
import { PrimaryCta } from '../../onboarding/ui/PrimaryCta';
import { useTheme } from '../../theme/ThemeProvider';

function YesNo({
  value,
  question,
  onChange,
}: {
  value: boolean | null;
  question: string;
  onChange: (v: boolean) => void;
}) {
  const { colors, fonts } = useTheme();
  return (
    <View style={{ flexDirection: 'row', gap: 8, width: 132, flexShrink: 0 }}>
      {([false, true] as const).map((v) => {
        const on = value === v;
        return (
          <Pressable
            key={String(v)}
            onPress={() => onChange(v)}
            accessibilityRole="button"
            accessibilityLabel={`${v ? 'Yes' : 'No'}. ${question}`}
            accessibilityState={{ selected: on }}
            style={{
              flex: 1,
              height: 36,
              borderRadius: 10,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: on ? colors.accentSoft : 'transparent',
              borderWidth: on ? 1.5 : 1,
              borderColor: on ? colors.accentLine : colors.borderStrong,
            }}
          >
            <Text importantForAccessibility="no" color={colors.text} style={{ fontFamily: fonts.bodyBold, fontSize: 14, lineHeight: 20 }}>
              {v ? 'Yes' : 'No'}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function HealthScreen({
  answers,
  onAnswer,
  teenName,
  onBack,
  onContinue,
  busy,
  message,
}: {
  answers: HealthAnswers;
  onAnswer: (index: number, value: boolean) => void;
  /** Parent-together: the teen's first name. Omit for the adult / self screen. */
  teenName?: string;
  onBack?: () => void;
  onContinue: () => void;
  busy?: boolean;
  message?: string | null;
}) {
  const { colors, fonts } = useTheme();
  const questions = healthQuestions(teenName);
  const ready = allAnswered(answers);
  const yes = anyYes(answers);
  const cta = yes ? "See what's next" : 'Continue';
  return (
    <OnbScreen
      contentGap={16}
      onBack={onBack}
      footer={
        <>
          <PrimaryCta label={cta} onPress={onContinue} disabled={!ready} busy={busy} />
          {!ready ? <FooterHint>Answer every question to continue.</FooterHint> : null}
          {message ? <FooterHint>{message}</FooterHint> : null}
        </>
      }
    >
      <View style={{ gap: 8 }}>
        <OnbTitle>{HEALTH_SCREEN_TITLE}</OnbTitle>
        <OnbSub>{teenName ? parentHealthScreenSub(teenName) : HEALTH_SCREEN_SUB}</OnbSub>
      </View>
      <View style={{ gap: 8 }}>
        {questions.map((q, i) => (
          <View
            key={i}
            style={{
              paddingVertical: 14,
              paddingHorizontal: 16,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: colors.border,
              backgroundColor: colors.surface,
              flexDirection: 'row',
              gap: 12,
              alignItems: 'flex-start',
            }}
          >
            <Text style={{ flex: 1, fontFamily: fonts.body, fontSize: 14, lineHeight: 20 }} color={colors.text}>
              {q}
            </Text>
            <YesNo value={answers[i] ?? null} question={q} onChange={(v) => onAnswer(i, v)} />
          </View>
        ))}
      </View>
      <Text color={colors.textMuted} style={{ fontFamily: fonts.bodyMedium, fontSize: 12, lineHeight: 16 }}>
        {teenName ? parentHealthScreenHint(teenName) : HEALTH_SCREEN_HINT}
      </Text>
    </OnbScreen>
  );
}
