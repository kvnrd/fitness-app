import { View } from 'react-native';
import { Text } from '../../components/ui';
import { HEALTH_REASK_BODY, HEALTH_REASK_CONFIRM, HEALTH_REASK_TITLE, HEALTH_REASK_TURN_OFF, HEALTH_TEXT } from '../../legal/text';
import { FooterHint, OnbScreen } from '../../onboarding/ui/OnbScreen';
import { OnbSub, OnbTitle } from '../../onboarding/ui/OnbText';
import { PrimaryCta } from '../../onboarding/ui/PrimaryCta';
import { SecondaryButton } from '../../onboarding/ui/SecondaryButton';
import { useTheme } from '../../theme/ThemeProvider';

export function HealthReaskScreen({
  onConfirm,
  onTurnOff,
  onBack,
  busy,
  message,
}: {
  onConfirm: () => void;
  onTurnOff: () => void;
  onBack?: () => void;
  busy?: boolean;
  message?: string | null;
}) {
  const { colors, fonts } = useTheme();
  return (
    <OnbScreen
      onBack={onBack}
      contentGap={20}
      footer={
        <>
          <PrimaryCta label={HEALTH_REASK_CONFIRM} onPress={onConfirm} busy={busy} />
          <SecondaryButton label={HEALTH_REASK_TURN_OFF} onPress={onTurnOff} disabled={busy} />
          {message ? <FooterHint>{message}</FooterHint> : null}
        </>
      }
    >
      <View style={{ gap: 8 }}>
        <OnbTitle>{HEALTH_REASK_TITLE}</OnbTitle>
        <OnbSub>{HEALTH_REASK_BODY}</OnbSub>
      </View>
      <Text color={colors.textSecondary} style={{ fontFamily: fonts.body, fontSize: 16, lineHeight: 24 }}>
        {HEALTH_TEXT}
      </Text>
    </OnbScreen>
  );
}
