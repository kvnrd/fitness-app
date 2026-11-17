import { View } from 'react-native';
import { Text } from '../../components/ui';
import {
  CLEARANCE_FOOTER,
  CLEARANCE_HINT,
  CLEARANCE_SUB,
  CLEARANCE_TITLE,
  clearanceBody,
  CLEARANCE_ACK,
  parentClearanceAck,
} from '../healthScreen';
import { Checkbox } from '../../onboarding/ui/Checkbox';
import { FooterHint, OnbScreen } from '../../onboarding/ui/OnbScreen';
import { OnbSub, OnbTitle } from '../../onboarding/ui/OnbText';
import { PrimaryCta } from '../../onboarding/ui/PrimaryCta';
import { useTheme } from '../../theme/ThemeProvider';

export function HealthClearanceScreen({
  confirmed,
  onConfirmed,
  teenName,
  onBack,
  onContinue,
  busy,
  message,
}: {
  confirmed: boolean;
  onConfirmed: (v: boolean) => void;
  teenName?: string;
  onBack?: () => void;
  onContinue: () => void;
  busy?: boolean;
  message?: string | null;
}) {
  const { colors, fonts } = useTheme();
  const ack = teenName ? parentClearanceAck(teenName) : CLEARANCE_ACK;
  return (
    <OnbScreen
      contentGap={20}
      onBack={onBack}
      footer={
        <>
          <PrimaryCta label="Continue" onPress={onContinue} disabled={!confirmed} busy={busy} />
          {!confirmed ? <FooterHint>{CLEARANCE_HINT}</FooterHint> : null}
          {message ? <FooterHint>{message}</FooterHint> : null}
        </>
      }
    >
      <View style={{ gap: 8 }}>
        <OnbTitle>{CLEARANCE_TITLE}</OnbTitle>
        <OnbSub>{CLEARANCE_SUB}</OnbSub>
      </View>
      <Text color={colors.text} style={{ fontFamily: fonts.body, fontSize: 16, lineHeight: 24 }}>
        {clearanceBody(teenName)}
      </Text>
      <View
        style={{
          paddingVertical: 14,
          paddingHorizontal: 16,
          borderRadius: 12,
          backgroundColor: colors.surfaceSunken,
          borderWidth: 1,
          borderColor: colors.borderStrong,
        }}
      >
        <Checkbox checked={confirmed} onChange={onConfirmed} label={ack}>
          <Text color={colors.text} style={{ fontFamily: fonts.bodyMedium, fontSize: 16, lineHeight: 24 }}>
            {ack}
          </Text>
        </Checkbox>
      </View>
      <Text color={colors.textMuted} style={{ fontFamily: fonts.bodyMedium, fontSize: 12, lineHeight: 16 }}>
        {CLEARANCE_FOOTER}
      </Text>
    </OnbScreen>
  );
}
