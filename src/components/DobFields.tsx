import { TextInput, View } from 'react-native';
import { DateParts } from '../auth/onboarding';
import { useTheme } from '../theme/ThemeProvider';
import { radius, space } from '../theme/tokens';

/**
 * Neutral date-of-birth entry (Counsel Q3): empty by default (no preset date), no age hint, no
 * minimum-age text anywhere near it.
 */
export function DobFields({ value, onChange }: { value: DateParts; onChange: (v: DateParts) => void }) {
  const { colors, fonts } = useTheme();
  const field = {
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radius.input,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    color: colors.text,
    fontFamily: fonts.body,
    fontSize: 16,
    textAlign: 'center',
  } as const;
  const digits = (v: string, n: number) => v.replace(/\D/g, '').slice(0, n);
  return (
    <View style={{ flexDirection: 'row', gap: space.sm }}>
      <TextInput
        value={value.month}
        onChangeText={(v) => onChange({ ...value, month: digits(v, 2) })}
        placeholder="MM"
        placeholderTextColor={colors.textMuted}
        keyboardType="number-pad"
        maxLength={2}
        autoComplete="off"
        style={[field, { flex: 1 }]}
        accessibilityLabel="Birth month"
      />
      <TextInput
        value={value.day}
        onChangeText={(v) => onChange({ ...value, day: digits(v, 2) })}
        placeholder="DD"
        placeholderTextColor={colors.textMuted}
        keyboardType="number-pad"
        maxLength={2}
        autoComplete="off"
        style={[field, { flex: 1 }]}
        accessibilityLabel="Birth day"
      />
      <TextInput
        value={value.year}
        onChangeText={(v) => onChange({ ...value, year: digits(v, 4) })}
        placeholder="YYYY"
        placeholderTextColor={colors.textMuted}
        keyboardType="number-pad"
        maxLength={4}
        autoComplete="off"
        style={[field, { flex: 2 }]}
        accessibilityLabel="Birth year"
      />
    </View>
  );
}
