import { View } from 'react-native';
import { Text } from '../../components/ui';
import {
  HEALTH_REASK_BODY,
  HEALTH_REASK_BODY_TEEN,
  HEALTH_REASK_CONFIRM,
  HEALTH_REASK_TITLE,
  HEALTH_REASK_TURN_OFF,
  HEALTH_REASK_WAITING,
  HEALTH_TEXT_WITH_AI,
} from '../../legal/text';
import { FooterHint, OnbScreen } from '../../onboarding/ui/OnbScreen';
import { OnbSub, OnbTitle } from '../../onboarding/ui/OnbText';
import { PrimaryCta } from '../../onboarding/ui/PrimaryCta';
import { SecondaryButton } from '../../onboarding/ui/SecondaryButton';
import { useTheme } from '../../theme/ThemeProvider';

export type HealthReaskVariant = 'adult' | 'teen' | 'waiting_parent';

export function HealthReaskScreen({
  variant = 'adult',
  onConfirm,
  onTurnOff,
  onBack,
  busy,
  message,
}: {
  variant?: HealthReaskVariant;
  onConfirm: () => void;
  onTurnOff: () => void;
  onBack?: () => void;
  busy?: boolean;
  message?: string | null;
}) {
  const { colors, fonts } = useTheme();
  const waiting = variant === 'waiting_parent';
  const body = waiting ? HEALTH_REASK_WAITING : variant === 'teen' ? HEALTH_REASK_BODY_TEEN : HEALTH_REASK_BODY;
  return (
    <OnbScreen
      onBack={onBack}
      contentGap={20}
      footer={
        waiting ? (
          message ? <FooterHint>{message}</FooterHint> : null
        ) : (
          <>
            <PrimaryCta label={HEALTH_REASK_CONFIRM} onPress={onConfirm} busy={busy} />
            <SecondaryButton label={HEALTH_REASK_TURN_OFF} onPress={onTurnOff} disabled={busy} />
            {message ? <FooterHint>{message}</FooterHint> : null}
          </>
        )
      }
    >
      <View style={{ gap: 8 }}>
        <OnbTitle>{HEALTH_REASK_TITLE}</OnbTitle>
        <OnbSub>{body}</OnbSub>
      </View>
      {waiting ? null : (
        <Text color={colors.textSecondary} style={{ fontFamily: fonts.body, fontSize: 16, lineHeight: 24 }}>
          {HEALTH_TEXT_WITH_AI}
        </Text>
      )}
    </OnbScreen>
  );
}
