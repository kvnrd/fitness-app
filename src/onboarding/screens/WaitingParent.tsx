import { View } from 'react-native';
import { Text } from '../../components/ui';
import { PENDING_BODY, PENDING_TITLE } from '../../legal/text';
import { useTheme } from '../../theme/ThemeProvider';
import { inviteStatusText } from '../routing';
import { TextField } from '../ui/Field';
import { OnbScreen } from '../ui/OnbScreen';
import { LinkButton } from '../ui/OnbText';
import { PrimaryCta } from '../ui/PrimaryCta';
import { SecondaryButton } from '../ui/SecondaryButton';
import { Wordmark } from '../ui/Wordmark';

export type WaitingProps = {
  inviteStatus: string | null;
  /** Parent email typed to fix or resend the invite (memory only; the server answers the same way every time). */
  email: string;
  onEmail: (v: string) => void;
  emailValid: boolean;
  /** The invite form is open (always open when there is no usable invite). */
  showInvite: boolean;
  onToggleInvite: () => void;
  onResend: () => void;
  resendNote?: string | null;
  busy?: boolean;
  onSetupStyle: () => void;
  onCheckAgain: () => void;
  onSignOut: () => void;
  /** Counsel: "Your parent has until [date] to approve." Null if created_at is unknown. */
  deadlineText?: string | null;
};

/** Pending 16-17. Body is Counsel's pending copy VERBATIM (PENDING_BODY); the title is UI chrome. [ATTORNEY] */
export function WaitingParentScreen(p: WaitingProps) {
  const { colors, fonts } = useTheme();
  return (
    <OnbScreen
      footer={
        <>
          <PrimaryCta label="Set up training style" onPress={p.onSetupStyle} />
          <SecondaryButton label="Check again" onPress={p.onCheckAgain} disabled={p.busy} />
        </>
      }
    >
      <Wordmark />
      <Text accessibilityRole="header" color={colors.text} style={{ fontFamily: fonts.displayHeavy, fontSize: 42, lineHeight: 42, textTransform: 'uppercase', letterSpacing: -0.2 }}>
        {PENDING_TITLE}
      </Text>
      <View style={{ borderRadius: 20, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, padding: 20 }}>
        <Text color={colors.text} style={{ fontFamily: fonts.body, fontSize: 18, lineHeight: 26 }}>
          {PENDING_BODY}
        </Text>
      </View>
      {p.deadlineText ? (
        <Text color={colors.text} style={{ fontFamily: fonts.bodyMedium, fontSize: 16, lineHeight: 22 }}>
          {p.deadlineText}
        </Text>
      ) : null}
      <Text accessibilityLiveRegion="polite" color={colors.textSecondary} style={{ fontFamily: fonts.bodyMedium, fontSize: 14, lineHeight: 20 }}>
        {inviteStatusText(p.inviteStatus)}
      </Text>
      {p.showInvite ? (
        <View style={{ gap: 12 }}>
          <TextField
            label="Parent or guardian email"
            placeholder="Email address"
            value={p.email}
            onChangeText={p.onEmail}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            autoComplete="off"
            textContentType="none"
            maxLength={254}
            returnKeyType="send"
            onSubmitEditing={() => p.emailValid && p.onResend()}
            helper="We use it only to send the invite."
          />
          <SecondaryButton label="Send invite" onPress={p.onResend} disabled={!p.emailValid || p.busy} />
          {p.resendNote ? (
            <Text accessibilityLiveRegion="polite" variant="small" color={colors.textSecondary}>
              {p.resendNote}
            </Text>
          ) : null}
        </View>
      ) : (
        <LinkButton onPress={p.onToggleInvite}>Wrong email? Fix it and resend</LinkButton>
      )}
      <LinkButton onPress={p.onSignOut}>Sign out</LinkButton>
    </OnbScreen>
  );
}
