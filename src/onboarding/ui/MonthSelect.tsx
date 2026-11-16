import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { FlatList, Modal, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '../../components/ui';
import { useTheme } from '../../theme/ThemeProvider';

export const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'] as const;

/**
 * Month picker: a field-looking button that opens a plain list of month names in a bottom sheet.
 * No default month (placeholder "Month"); value is the month number as a string ('3') or ''.
 */
export function MonthSelect({ value, onChange }: { value: string; onChange: (month: string) => void }) {
  const { colors, fonts } = useTheme();
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState(false);
  const n = Number(value);
  const label = n >= 1 && n <= 12 ? MONTH_NAMES[n - 1] : null;
  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={label ? `Birth month, ${label}` : 'Birth month, not selected'}
        accessibilityHint="Opens a list of months"
        style={{ height: 52, borderRadius: 12, borderWidth: 1, borderColor: label ? colors.borderStrong : colors.border, backgroundColor: colors.surfaceSunken, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14 }}
      >
        <Text color={label ? colors.text : colors.placeholder} style={{ fontFamily: fonts.bodyMedium, fontSize: 16 }}>
          {label ?? 'Month'}
        </Text>
        <Ionicons name="chevron-down" size={18} color={colors.textMuted} />
      </Pressable>
      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' }} onPress={() => setOpen(false)} accessibilityLabel="Close month list" accessibilityRole="button" />
        <View style={{ backgroundColor: colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '70%', paddingBottom: insets.bottom + 8, borderWidth: 1, borderColor: colors.border }}>
          <Text variant="label" color={colors.textMuted} style={{ textTransform: 'uppercase', letterSpacing: 0.96, padding: 20, paddingBottom: 8 }}>
            Month
          </Text>
          <FlatList
            data={MONTH_NAMES as readonly string[]}
            keyExtractor={(m) => m}
            renderItem={({ item, index }) => {
              const selected = index + 1 === n;
              return (
                <Pressable
                  onPress={() => {
                    onChange(String(index + 1));
                    setOpen(false);
                  }}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                  style={({ pressed }) => [{ paddingVertical: 14, paddingHorizontal: 20, flexDirection: 'row', justifyContent: 'space-between' }, pressed && { backgroundColor: colors.surfaceRaised }]}
                >
                  <Text color={selected ? colors.accentInk : colors.text} style={{ fontFamily: selected ? fonts.bodySemi : fonts.body }}>
                    {item}
                  </Text>
                  {selected ? <Ionicons name="checkmark" size={20} color={colors.accentInk} /> : null}
                </Pressable>
              );
            }}
          />
        </View>
      </Modal>
    </>
  );
}
