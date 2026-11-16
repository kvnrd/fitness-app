import { View } from 'react-native';
import { Text } from '../../components/ui';
import { useTheme } from '../../theme/ThemeProvider';
import { Checkbox } from './Checkbox';

/**
 * The visually distinct safety notice: Champagne (accent) left rule, stronger inset stroke on the checkbox,
 * full text always visible. [ATTORNEY] Counsel copy (phase3-review #2). The checkbox is the ONLY thing that
 * enables Continue / Confirm; its wording never agrees to anything else.
 */
export function RiskCard({ card, checked, onChange }: { card: { headingNotMedical: string; headingRisks: string; bodyNotMedical: string; bodyRisks: string; checkbox: string }; checked: boolean; onChange: (v: boolean) => void }) {
  const { colors, fonts } = useTheme();
  return (
    <View style={{ flexDirection: 'row', borderRadius: 20, overflow: 'hidden', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderStrong }}>
      <View style={{ width: 4, backgroundColor: colors.accentLine }} accessible={false} />
      <View style={{ flex: 1, padding: 18, gap: 14 }}>
        <Text accessibilityRole="header" color={colors.text} style={{ fontFamily: fonts.displayHeavy, fontSize: 32, lineHeight: 34, textTransform: 'uppercase' }}>
          {card.headingNotMedical}
        </Text>
        <Text color={colors.text} style={{ fontFamily: fonts.body, fontSize: 16, lineHeight: 24 }}>
          {card.bodyNotMedical}
        </Text>
        <Text accessibilityRole="header" color={colors.text} style={{ fontFamily: fonts.displayBold, fontSize: 20, lineHeight: 24, textTransform: 'uppercase' }}>
          {card.headingRisks}
        </Text>
        <Text color={colors.text} style={{ fontFamily: fonts.body, fontSize: 16, lineHeight: 24 }}>
          {card.bodyRisks}
        </Text>
        <View style={{ padding: 14, borderRadius: 12, borderWidth: 2, borderColor: checked ? colors.accentLine : colors.borderStrong, backgroundColor: colors.surfaceSunken }}>
          <Checkbox checked={checked} onChange={onChange} label={card.checkbox}>
            <Text color={colors.text} style={{ fontFamily: fonts.bodyMedium, fontSize: 16, lineHeight: 24 }}>
              {card.checkbox}
            </Text>
          </Checkbox>
        </View>
      </View>
    </View>
  );
}
