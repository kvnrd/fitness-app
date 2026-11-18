import { View } from 'react-native';
import { Text } from '../../components/ui';
import { useTheme } from '../../theme/ThemeProvider';
import {
  TURNED_18_BODY,
  TURNED_18_LEARN_MORE,
  TURNED_18_NOT_NOW,
  TURNED_18_TITLE,
} from '../phase5bCopy.ts';
import { EqualActions } from './sheet.tsx';

export function Turned18Card({ onNotNow, onLearnMore }: { onNotNow: () => void; onLearnMore: () => void }) {
  const { colors, fonts, radius } = useTheme();
  return (
    <View
      accessibilityRole="summary"
      accessibilityLabel={TURNED_18_TITLE}
      style={{
        backgroundColor: colors.glass ?? colors.surface,
        borderColor: colors.glassBorder ?? colors.border,
        borderWidth: 1,
        borderRadius: radius.hero ?? 24,
        padding: 16,
        gap: 12,
      }}
    >
      <Text color={colors.text} style={{ fontFamily: fonts.bodySemi, fontSize: 16, lineHeight: 22 }}>
        {TURNED_18_TITLE}
      </Text>
      <Text color={colors.textSecondary} style={{ fontFamily: fonts.body, fontSize: 15, lineHeight: 22 }}>
        {TURNED_18_BODY}
      </Text>
      <EqualActions left={TURNED_18_NOT_NOW} right={TURNED_18_LEARN_MORE} onLeft={onNotNow} onRight={onLearnMore} />
    </View>
  );
}
