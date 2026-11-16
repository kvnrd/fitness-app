import { Ionicons } from '@expo/vector-icons';
import { View } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { Text } from '../../components/ui';

/** Card with a shield icon and one plain sentence (privacy notes). `compact` = 12/16 (DOB note), default 14/20. */
export function InfoNote({ children, compact = false }: { children: string; compact?: boolean }) {
  const { colors, fonts } = useTheme();
  return (
    <View style={{ flexDirection: 'row', gap: 12, padding: 14, paddingHorizontal: 16, alignItems: 'flex-start', borderRadius: 16, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface }}>
      <Ionicons name="shield-checkmark-outline" size={20} color={colors.accentInk} style={{ marginTop: 1 }} />
      <Text color={colors.textSecondary} style={{ flex: 1, fontFamily: fonts.bodyMedium, fontSize: compact ? 12 : 14, lineHeight: compact ? 16 : 20 }}>
        {children}
      </Text>
    </View>
  );
}
