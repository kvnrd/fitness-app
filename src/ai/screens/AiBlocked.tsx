import { View } from 'react-native';
import { Text } from '../../components/ui';
import { OnbScreen } from '../../onboarding/ui/OnbScreen';
import { OnbSub, OnbTitle } from '../../onboarding/ui/OnbText';
import { PrimaryCta } from '../../onboarding/ui/PrimaryCta';
import { SecondaryButton } from '../../onboarding/ui/SecondaryButton';
import { useTheme } from '../../theme/ThemeProvider';
import { Ionicons } from '@expo/vector-icons';

const TITLE = "We couldn’t use this plan";
const SUB = 'Nothing was saved.';
const BODY =
  'The draft didn’t pass our safety checks, so it was discarded. You can generate again, or change your goal and try once more. If this keeps happening, skip AI planning and use free logging, or train with a coach.';
const NOTE =
  'Plans are checked so they aren’t used as medical advice or to push unsafe body or exercise messaging. This isn’t a judgment of you.';

export function AiBlockedScreen({
  onGenerateAgain,
  onChangeGoal,
  busy,
}: {
  onGenerateAgain: () => void;
  onChangeGoal: () => void;
  busy?: boolean;
}) {
  const { colors, fonts } = useTheme();
  return (
    <OnbScreen
      contentGap={20}
      footer={
        <>
          <PrimaryCta label="Generate again" onPress={onGenerateAgain} busy={busy} />
          <SecondaryButton label="Change goal" onPress={onChangeGoal} />
        </>
      }
    >
      <View style={{ gap: 8 }}>
        <OnbTitle>{TITLE}</OnbTitle>
        <OnbSub>{SUB}</OnbSub>
      </View>
      <Text color={colors.text} style={{ fontFamily: fonts.body, fontSize: 16, lineHeight: 24 }}>
        {BODY}
      </Text>
      <View
        style={{
          flexDirection: 'row',
          gap: 10,
          padding: 12,
          borderRadius: 14,
          backgroundColor: colors.surfaceSunken,
          alignItems: 'flex-start',
        }}
      >
        <Ionicons name="information-circle-outline" size={18} color={colors.accentInk} style={{ marginTop: 1 }} />
        <Text color={colors.textSecondary} style={{ flex: 1, fontFamily: fonts.bodyMedium, fontSize: 12, lineHeight: 16 }}>
          {NOTE}
        </Text>
      </View>
    </OnbScreen>
  );
}
