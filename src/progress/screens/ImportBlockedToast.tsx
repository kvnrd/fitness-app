import { Pressable, View } from 'react-native';
import { Text } from '../../components/ui';
import { useTheme } from '../../theme/ThemeProvider';
import { IMPORT_BLOCKED, importAddedToast } from '../phase5bCopy.ts';

export function ImportBlockedToast({ onDismiss }: { onDismiss?: () => void }) {
  const { colors, fonts, radius } = useTheme();
  return (
    <Pressable
      onPress={onDismiss}
      accessibilityRole="alert"
      accessibilityLabel={IMPORT_BLOCKED}
      style={{
        padding: 14,
        borderRadius: radius.hero ?? 20,
        backgroundColor: colors.surfaceRaised ?? colors.surface,
        borderWidth: 1,
        borderColor: colors.danger,
      }}
    >
      <Text color={colors.danger} style={{ fontFamily: fonts.bodySemi, fontSize: 16 }}>
        {IMPORT_BLOCKED}
      </Text>
    </Pressable>
  );
}

export function ImportAddedToast({ count, onDismiss }: { count: number; onDismiss?: () => void }) {
  const { colors, fonts, radius } = useTheme();
  const label = importAddedToast(count);
  return (
    <Pressable
      onPress={onDismiss}
      accessibilityRole="alert"
      accessibilityLabel={label}
      style={{
        padding: 14,
        borderRadius: radius.hero ?? 20,
        backgroundColor: colors.surfaceRaised ?? colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
      }}
    >
      <Text color={colors.text} style={{ fontFamily: fonts.bodySemi, fontSize: 16 }}>
        {label}
      </Text>
    </Pressable>
  );
}
