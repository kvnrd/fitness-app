import { View } from 'react-native';
import { Text } from '../../components/ui';
import { PARENT_HELP_BULLETS, PARENT_HELP_SUB, PARENT_HELP_TITLE } from '../../legal/text';
import { useTheme } from '../../theme/ThemeProvider';
import { OnbScreen } from '../ui/OnbScreen';
import { OnbSub, OnbTitle } from '../ui/OnbText';
import { PrimaryCta } from '../ui/PrimaryCta';
import { Wordmark } from '../ui/Wordmark';

/** Screen 5a. No back button: the date of birth is locked once submitted. */
export function ParentHelpScreen({ onInvite }: { onInvite: () => void }) {
  const { colors } = useTheme();
  return (
    <OnbScreen footer={<PrimaryCta label="Invite a parent" onPress={onInvite} />}>
      <Wordmark />
      <View style={{ gap: 10 }}>
        <OnbTitle>{PARENT_HELP_TITLE}</OnbTitle>
        <OnbSub>{PARENT_HELP_SUB}</OnbSub>
      </View>
      <View style={{ gap: 16, paddingTop: 4 }}>
        {PARENT_HELP_BULLETS.map((b) => (
          <View key={b} style={{ flexDirection: 'row', gap: 14, alignItems: 'flex-start' }}>
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: colors.accent, marginTop: 9 }} />
            <Text style={{ flex: 1 }}>{b}</Text>
          </View>
        ))}
      </View>
    </OnbScreen>
  );
}
