import { View } from 'react-native';
import { Text } from '../../components/ui';
import { INVITE_HINT_OFF, INVITE_LABEL, INVITE_SUB, INVITE_TITLE } from '../../legal/text';
import { useTheme } from '../../theme/ThemeProvider';
import { TextField } from '../ui/Field';
import { FooterHint, OnbScreen } from '../ui/OnbScreen';
import { OnbSub, OnbTitle } from '../ui/OnbText';
import { PrimaryCta } from '../ui/PrimaryCta';
import { Wordmark } from '../ui/Wordmark';

/** Screen 5b. Client-side format check only (no account lookup). No back: DOB is locked. */
export function InviteParentScreen(p: { email: string; onChange: (v: string) => void; valid: boolean; busy?: boolean; message?: string | null; onSend: () => void }) {
  const { colors } = useTheme();
  return (
    <OnbScreen
      footer={
        <>
          <PrimaryCta label="Send invite" disabled={!p.valid} busy={p.busy} onPress={p.onSend} />
          {!p.valid ? <FooterHint>{INVITE_HINT_OFF}</FooterHint> : null}
        </>
      }
    >
      <Wordmark />
      <View style={{ gap: 10 }}>
        <OnbTitle>{INVITE_TITLE}</OnbTitle>
        <OnbSub>{INVITE_SUB}</OnbSub>
      </View>
      <TextField
        label={INVITE_LABEL}
        placeholder="Email address"
        value={p.email}
        onChangeText={p.onChange}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="email-address"
        autoComplete="off"
        textContentType="none"
        maxLength={254}
        returnKeyType="send"
        onSubmitEditing={() => p.valid && p.onSend()}
      />
      {p.message ? (
        <Text variant="small" color={colors.danger} accessibilityLiveRegion="polite">
          {p.message}
        </Text>
      ) : null}
    </OnbScreen>
  );
}
