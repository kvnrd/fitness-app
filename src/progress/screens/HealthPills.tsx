import { View } from 'react-native';
import { Text } from '../../components/ui';
import { useTheme } from '../../theme/ThemeProvider';
import { healthPills } from '../teenWeightCopy.ts';

export function HealthPills({ selfOn, parentOn }: { selfOn: boolean; parentOn: boolean }) {
  const { colors, fonts, radius } = useTheme();
  const pills = healthPills(selfOn, parentOn);
  const pill = (label: string) => (
    <View
      key={label}
      style={{
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: radius.pill,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.surfaceSunken ?? colors.surface,
      }}
    >
      <Text color={colors.textSecondary} style={{ fontFamily: fonts.bodyMedium, fontSize: 12, lineHeight: 16 }}>
        {label}
      </Text>
    </View>
  );
  return <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>{pill(pills.you)}{pill(pills.parent)}</View>;
}
