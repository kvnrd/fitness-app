import { View } from 'react-native';
import { TextField, FieldLabel } from './Field';
import { MonthSelect } from './MonthSelect';
import type { DateParts } from '../dob';

/**
 * Neutral date-of-birth entry (Counsel Q3): Month / Day / Year all empty, no default date, no age hint.
 * Month is a list (not a wheel: a wheel defaults to today); day and year are numeric.
 * Replaces the old components/DobFields.
 */
export function DobEntry({ value, onChange }: { value: DateParts; onChange: (v: DateParts) => void }) {
  const digits = (v: string, n: number) => v.replace(/\D/g, '').slice(0, n);
  return (
    <View style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-end' }}>
      <View style={{ flex: 1.8, gap: 8 }}>
        <FieldLabel>Month</FieldLabel>
        <MonthSelect value={value.month} onChange={(month) => onChange({ ...value, month })} />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <TextField
          label="Day"
          placeholder="Day"
          value={value.day}
          onChangeText={(v) => onChange({ ...value, day: digits(v, 2) })}
          keyboardType="number-pad"
          maxLength={2}
          autoComplete="off"
          inputMode="numeric"
        />
      </View>
      <View style={{ flex: 1.3, minWidth: 0 }}>
        <TextField
          label="Year"
          placeholder="Year"
          value={value.year}
          onChangeText={(v) => onChange({ ...value, year: digits(v, 4) })}
          keyboardType="number-pad"
          maxLength={4}
          autoComplete="off"
          inputMode="numeric"
        />
      </View>
    </View>
  );
}
