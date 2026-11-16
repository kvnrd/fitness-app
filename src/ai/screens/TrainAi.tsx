import { View } from 'react-native';
import { Text } from '../../components/ui';
import { OnbTitle } from '../../onboarding/ui/OnbText';
import { PrimaryCta } from '../../onboarding/ui/PrimaryCta';
import { ScreenBackground } from '../../components/ScreenAtmosphere';
import { useTheme } from '../../theme/ThemeProvider';
import { TabChrome } from './TabChrome';

/** Presentational Train (AI) state for previews — Week 3 Upper Push, knee-category badge. */
export function TrainAiScreen({
  dateLabel = 'Saturday · November 14',
  sessionTitle = 'Upper Push',
  sessionMeta = 'Bench, overhead press, weighted dips.',
  weekLabel = 'Today · Week 3 of 8',
  injuryLabel = 'Knee',
  exercises = '06',
  minutes = '50',
  rpe = '8',
  notice = 'footer',
  onBegin,
}: {
  dateLabel?: string;
  sessionTitle?: string;
  sessionMeta?: string;
  weekLabel?: string;
  injuryLabel?: string | null;
  exercises?: string;
  minutes?: string;
  rpe?: string;
  notice?: 'banner' | 'footer' | null;
  onBegin?: () => void;
}) {
  const { colors, fonts } = useTheme();
  const stat = (n: string, l: string) => (
    <View style={{ flex: 1, padding: 12, borderRadius: 12, backgroundColor: colors.surfaceSunken, gap: 4 }}>
      <Text color={colors.text} style={{ fontFamily: fonts.displayBold, fontSize: 32, lineHeight: 32 }}>
        {n}
      </Text>
      <Text color={colors.textMuted} style={{ fontFamily: fonts.bodyBold, fontSize: 12, letterSpacing: 0.8, textTransform: 'uppercase' }}>
        {l}
      </Text>
    </View>
  );
  return (
    <ScreenBackground>
      <TabChrome active="train" notice={notice}>
        <View style={{ paddingHorizontal: 24, paddingTop: 8, gap: 20 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <View style={{ gap: 8, flex: 1 }}>
              <Text color={colors.textMuted} style={{ fontFamily: fonts.bodyBold, fontSize: 12, letterSpacing: 0.8, textTransform: 'uppercase' }}>
                {dateLabel}
              </Text>
              <OnbTitle>Your plan</OnbTitle>
            </View>
            <View style={{ paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, borderWidth: 1, borderColor: colors.borderStrong }}>
              <Text color={colors.textSecondary} style={{ fontFamily: fonts.bodyBold, fontSize: 12, letterSpacing: 0.8, textTransform: 'uppercase' }}>
                AI plan
              </Text>
            </View>
          </View>
          <View
            style={{
              padding: 20,
              borderRadius: 20,
              borderWidth: 1,
              borderColor: colors.border,
              backgroundColor: colors.surface,
              gap: 16,
            }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text color={colors.accentInk} style={{ fontFamily: fonts.bodyBold, fontSize: 12, letterSpacing: 0.8, textTransform: 'uppercase' }}>
                {weekLabel}
              </Text>
              {injuryLabel ? (
                <View style={{ paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, borderWidth: 1, borderColor: colors.accentLine }}>
                  <Text color={colors.accentInk} style={{ fontFamily: fonts.bodyBold, fontSize: 12, letterSpacing: 0.6, textTransform: 'uppercase' }}>
                    {injuryLabel} category
                  </Text>
                </View>
              ) : null}
            </View>
            <View style={{ gap: 8 }}>
              <OnbTitle>{sessionTitle}</OnbTitle>
              <Text color={colors.textSecondary} style={{ fontFamily: fonts.bodyMedium, fontSize: 14, lineHeight: 20 }}>
                {sessionMeta}
              </Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {stat(exercises, 'Exercises')}
              {stat(minutes, 'Minutes')}
              {stat(rpe, 'RPE')}
            </View>
            <PrimaryCta label="Begin session" onPress={onBegin ?? (() => {})} />
          </View>
        </View>
      </TabChrome>
    </ScreenBackground>
  );
}
