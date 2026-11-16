import { View } from 'react-native';
import { Text } from '../../components/ui';
import { useTheme } from '../../theme/ThemeProvider';
import { AuthProviderButtons } from '../ui/AuthProviderButtons';
import { InfoNote } from '../ui/InfoNote';
import { InlineLink, OnbSub, OnbTitle, TermsFooterLine } from '../ui/OnbText';
import { OnbScreen } from '../ui/OnbScreen';
import { Wordmark } from '../ui/Wordmark';

/** Screen 2. Picking a method only stores the choice; OAuth starts after the date of birth. */
export function MethodScreen(p: {
  showApple: boolean;
  showGoogle: boolean;
  onApple: () => void;
  onGoogle: () => void;
  onEmail: () => void;
  onBack: () => void;
  onSignIn: () => void;
  onTerms: () => void;
  onPrivacy: () => void;
}) {
  const { colors } = useTheme();
  return (
    <OnbScreen
      onBack={p.onBack}
      footer={
        <View style={{ gap: 14 }}>
          <Text variant="small" color={colors.textSecondary} style={{ textAlign: 'center', fontSize: 14 }}>
            {'Already have an account? '}
            <InlineLink onPress={p.onSignIn}>Sign in</InlineLink>
          </Text>
          <TermsFooterLine onTerms={p.onTerms} onPrivacy={p.onPrivacy} />
        </View>
      }
      contentGap={28}
    >
      <Wordmark />
      <View style={{ gap: 10 }}>
        <OnbTitle>{'Create your account'}</OnbTitle>
        <OnbSub>Save your program, sync your logs and pick up on any device.</OnbSub>
      </View>
      <AuthProviderButtons showApple={p.showApple} showGoogle={p.showGoogle} onApple={p.onApple} onGoogle={p.onGoogle} onEmail={p.onEmail} />
      <InfoNote>We never post anything. Apple can hide your email with a private relay address.</InfoNote>
    </OnbScreen>
  );
}
