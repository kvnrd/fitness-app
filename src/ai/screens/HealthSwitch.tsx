import { View } from 'react-native';
import { Text } from '../../components/ui';
import {
  HEALTH_SWITCH_BODY,
  HEALTH_SWITCH_CTA,
  HEALTH_SWITCH_DISMISS,
  HEALTH_SWITCH_SUB,
  HEALTH_SWITCH_TITLE,
  parentHealthSwitchBody,
  parentHealthSwitchSub,
} from '../healthScreen';
import { OnbScreen } from '../../onboarding/ui/OnbScreen';
import { OnbSub, OnbTitle } from '../../onboarding/ui/OnbText';
import { PrimaryCta } from '../../onboarding/ui/PrimaryCta';
import { SecondaryButton } from '../../onboarding/ui/SecondaryButton';
import { useTheme } from '../../theme/ThemeProvider';

export function HealthSwitchScreen({
  teenName,
  onTurnOn,
  onNotNow,
  onBack,
  busy,
  message,
}: {
  /** Set when the copy should name the teen (parent-together or the teen's own gate). */
  teenName?: string;
  onTurnOn: () => void;
  onNotNow: () => void;
  onBack?: () => void;
  busy?: boolean;
  message?: string | null;
}) {
  const { colors, fonts } = useTheme();
  return (
    <OnbScreen
      contentGap={20}
      onBack={onBack}
      footer={
        <>
          <PrimaryCta label={HEALTH_SWITCH_CTA} onPress={onTurnOn} busy={busy} />
          <SecondaryButton label={HEALTH_SWITCH_DISMISS} onPress={onNotNow} />
          {message ? (
            <Text color={colors.textMuted} style={{ fontFamily: fonts.bodyMedium, fontSize: 12, lineHeight: 16, textAlign: 'center' }}>
              {message}
            </Text>
          ) : null}
        </>
      }
    >
      <View style={{ gap: 8 }}>
        <OnbTitle>{HEALTH_SWITCH_TITLE}</OnbTitle>
        <OnbSub>{teenName ? parentHealthSwitchSub : HEALTH_SWITCH_SUB}</OnbSub>
      </View>
      <Text color={colors.text} style={{ fontFamily: fonts.body, fontSize: 16, lineHeight: 24 }}>
        {teenName ? parentHealthSwitchBody(teenName) : HEALTH_SWITCH_BODY}
      </Text>
    </OnbScreen>
  );
}
