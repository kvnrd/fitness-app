import { useRef } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { Text } from '../../components/ui';
import { useTheme } from '../../theme/ThemeProvider';

/**
 * Six digit boxes backed by ONE invisible text input, so paste, SMS/email autofill (oneTimeCode) and the
 * number pad all work. Digits only; extra characters are dropped.
 */
export function CodeBoxes({ value, onChange, length = 6, autoFocus = false }: { value: string; onChange: (v: string) => void; length?: number; autoFocus?: boolean }) {
  const { colors, fonts } = useTheme();
  const ref = useRef<React.ComponentRef<typeof TextInput>>(null);
  const active = Math.min(value.length, length - 1);
  const box = (i: number) => {
    const filled = i < value.length;
    const focus = i === active && value.length < length;
    return (
      <View
        key={i}
        style={[
          { width: 48, height: 60, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surfaceSunken },
          filled && { borderColor: colors.borderStrong, backgroundColor: colors.surface },
          focus && { borderWidth: 1.5, borderColor: colors.accentLine, backgroundColor: colors.surface },
        ]}
      >
        <Text importantForAccessibility="no" style={{ fontFamily: fonts.displayBold, fontSize: 32, lineHeight: 36, fontVariant: ['tabular-nums'] }}>
          {value[i] ?? ''}
        </Text>
      </View>
    );
  };
  const half = length / 2;
  return (
    <Pressable onPress={() => ref.current?.focus()} accessible={false}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <View style={{ flexDirection: 'row', gap: 8 }}>{Array.from({ length: half }, (_, i) => box(i))}</View>
        <View style={{ flexDirection: 'row', gap: 8 }}>{Array.from({ length: half }, (_, i) => box(i + half))}</View>
      </View>
      <TextInput
        ref={ref}
        value={value}
        onChangeText={(v) => onChange(v.replace(/\D/g, '').slice(0, length))}
        keyboardType="number-pad"
        inputMode="numeric"
        textContentType="oneTimeCode"
        autoComplete="one-time-code"
        maxLength={length * 2}
        autoFocus={autoFocus}
        caretHidden
        accessibilityLabel={`${length}-digit code`}
        style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, opacity: 0.02, color: 'transparent' }}
      />
    </Pressable>
  );
}
