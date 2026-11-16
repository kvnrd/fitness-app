import { View } from 'react-native';
import { AiNotice } from '../../components/AiNotice';
import { Text } from '../../components/ui';
import { InfoNote } from '../../onboarding/ui/InfoNote';
import { OnbScreen } from '../../onboarding/ui/OnbScreen';
import { OnbTitle } from '../../onboarding/ui/OnbText';
import { PrimaryCta } from '../../onboarding/ui/PrimaryCta';
import { useTheme } from '../../theme/ThemeProvider';
import type { AiPlan } from '../aiPlan';

export function AiPreviewScreen({
  title,
  weeks = 8,
  currentWeek = 1,
  plan,
  injuryLabel,
  swapNote,
  restNote,
  onBack,
  onStart,
  busy,
}: {
  title: string;
  weeks?: number;
  currentWeek?: number;
  plan: AiPlan;
  injuryLabel?: string | null;
  swapNote?: string;
  restNote?: string;
  onBack?: () => void;
  onStart: () => void;
  busy?: boolean;
}) {
  const { colors, fonts } = useTheme();
  const days = plan.days.filter((d) => !d.rest);
  const restDays = plan.days.filter((d) => d.rest);
  const rest =
    restNote ??
    (restDays.length
      ? `${restDays.map((d) => d.day[0].toUpperCase() + d.day.slice(1)).join(', ')} · rest or easy walk`
      : null);
  return (
    <OnbScreen
      contentGap={20}
      onBack={onBack}
      headerRight={
        <Text color={colors.textMuted} style={{ fontFamily: fonts.bodyBold, fontSize: 14, letterSpacing: 1.1, textTransform: 'uppercase' }}>
          Preview
        </Text>
      }
      footer={
        <>
          <AiNotice />
          <PrimaryCta label="Start this plan" onPress={onStart} busy={busy} />
        </>
      }
    >
      <View style={{ gap: 8 }}>
        <Text color={colors.accentInk} style={{ fontFamily: fonts.bodyBold, fontSize: 12, letterSpacing: 1.2, textTransform: 'uppercase' }}>
          AI plan · preview
        </Text>
        <OnbTitle>{title}</OnbTitle>
      </View>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {Array.from({ length: weeks }, (_, i) => {
          const w = i + 1;
          const on = w === currentWeek;
          const special = w === 4 ? 'Deload' : w === 8 ? 'Test' : '';
          return (
            <View key={w} style={{ flex: 1, alignItems: 'center', gap: 4 }}>
              <View
                style={{
                  width: '100%',
                  height: 40,
                  borderRadius: 8,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: on ? colors.accentSoft : w === 4 || w === 8 ? colors.surfaceRaised : 'transparent',
                  borderWidth: on ? 0 : 1,
                  borderColor: colors.borderStrong,
                }}
              >
                <Text color={on ? colors.accentInk : colors.textSecondary} style={{ fontFamily: fonts.displayBold, fontSize: 16 }}>
                  W{w}
                </Text>
              </View>
              <Text color={colors.textMuted} style={{ fontFamily: fonts.bodySemi, fontSize: 12, height: 16 }}>
                {special}
              </Text>
            </View>
          );
        })}
      </View>
      <View style={{ borderRadius: 16, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, overflow: 'hidden' }}>
        {days.map((d) => (
          <View
            key={d.day}
            style={{ flexDirection: 'row', paddingVertical: 14, paddingHorizontal: 16, borderTopWidth: 1, borderTopColor: colors.border, gap: 8, alignItems: 'flex-start' }}
          >
            <Text color={colors.textMuted} style={{ fontFamily: fonts.displayBold, fontSize: 20, lineHeight: 24, width: 44, textTransform: 'uppercase' }}>
              {d.day.slice(0, 3)}
            </Text>
            <View style={{ flex: 1, gap: 2 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <Text color={colors.text} style={{ fontFamily: fonts.bodyBold, fontSize: 16, lineHeight: 24 }}>
                  {d.title}
                </Text>
                {injuryLabel && d.exercises.some((e) => /swap|step-up|box squat|knee/i.test(`${e.name} ${e.notes}`)) ? (
                  <View style={{ paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, borderWidth: 1, borderColor: colors.accentLine }}>
                    <Text color={colors.accentInk} style={{ fontFamily: fonts.bodyBold, fontSize: 10, letterSpacing: 0.6, textTransform: 'uppercase' }}>
                      {injuryLabel} category
                    </Text>
                  </View>
                ) : null}
              </View>
              <Text color={colors.textSecondary} style={{ fontFamily: fonts.bodyMedium, fontSize: 14, lineHeight: 20 }}>
                {d.rest ? 'Rest' : `${d.exercises.length} exercises · ${d.duration_min} min`}
              </Text>
            </View>
          </View>
        ))}
      </View>
      {rest ? (
        <Text color={colors.textMuted} style={{ fontFamily: fonts.bodyMedium, fontSize: 14, lineHeight: 20 }}>
          {rest}
        </Text>
      ) : null}
      {injuryLabel && (swapNote || plan.swaps.length > 0) ? (
        <InfoNote>
          {swapNote ??
            `Swaps from your ${injuryLabel.toLowerCase()} category. ${plan.swaps.map((s) => `${s.instead} replaces ${s.avoid}.`).join(' ')} We only used the category — not notes — to make these swaps. This isn’t a rehab plan.`}
        </InfoNote>
      ) : null}
    </OnbScreen>
  );
}
