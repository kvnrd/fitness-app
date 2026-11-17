import { View } from 'react-native';
import { Text } from '../../components/ui';
import { INVITE_SENT_BODY_AFTER_EMAIL, INVITE_SENT_BODY_BEFORE_EMAIL, INVITE_SENT_NOTE, INVITE_SENT_TITLE } from '../../legal/text';
import { useTheme } from '../../theme/ThemeProvider';
import { AuthProviderButtons } from '../ui/AuthProviderButtons';
import { OnbScreen } from '../ui/OnbScreen';
import { OnbTitle, TermsFooterLine } from '../ui/OnbText';
import { Wordmark } from '../ui/Wordmark';

/** Screen 5c. Back returns to Invite (fix the email). Apple/Google start OAuth from here; email goes to Create. */
export function InviteSentScreen(p: {
  email: string;
  showApple: boolean;
  showGoogle: boolean;
  onApple: () => void;
  onGoogle: () => void;
  onEmail: () => void;
  onBack: () => void;
  onTerms: () => void;
  onPrivacy: () => void;
  busy?: boolean;
  message?: string | null;
}) {
  const { colors, fonts } = useTheme();
  return (
    <OnbScreen onBack={p.onBack} footer={<TermsFooterLine onTerms={p.onTerms} onPrivacy={p.onPrivacy} />} contentGap={24}>
      <Wordmark />
      <View style={{ gap: 14 }}>
        <OnbTitle>{INVITE_SENT_TITLE}</OnbTitle>
        <Text color={colors.textSecondary}>
          {INVITE_SENT_BODY_BEFORE_EMAIL}
          <Text color={colors.text} style={{ fontFamily: fonts.bodyBold }}>
            {p.email}
          </Text>
          {INVITE_SENT_BODY_AFTER_EMAIL}
        </Text>
        <Text color={colors.textSecondary}>{INVITE_SENT_NOTE}</Text>
      </View>
      <AuthProviderButtons showApple={p.showApple} showGoogle={p.showGoogle} onApple={p.onApple} onGoogle={p.onGoogle} onEmail={p.onEmail} disabled={p.busy} />
      {p.message ? (
        <Text variant="small" color={colors.danger} accessibilityLiveRegion="polite">
          {p.message}
        </Text>
      ) : null}
    </OnbScreen>
  );
}
