import { Ionicons } from '@expo/vector-icons';
import { ReactNode, useState } from 'react';
import { TextInput, TextInputProps, View } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { Text } from '../../components/ui';

/** Field label: Inter 700 12/16, 0.08em uppercase. Danger colour on error, accent ink on focus. */
export function FieldLabel({ children, state = 'idle' }: { children: string; state?: 'idle' | 'focus' | 'error' }) {
  const { colors, fonts } = useTheme();
  const color = state === 'error' ? colors.danger : state === 'focus' ? colors.accentInk : colors.textMuted;
  return (
    <Text accessible={false} color={color} style={{ fontFamily: fonts.bodyBold, fontSize: 12, lineHeight: 16, letterSpacing: 0.96, textTransform: 'uppercase' }}>
      {children}
    </Text>
  );
}

type Props = Omit<TextInputProps, 'style'> & {
  label: string;
  error?: string | null;
  /** Content on the right inside the field (e.g. show/hide). */
  right?: ReactNode;
  helper?: string;
};

/** Labelled text field (52px, radius 12, sunken). Error state: danger border + icon message. */
export function TextField({ label, error, right, helper, onFocus, onBlur, ...rest }: Props) {
  const { colors, fonts } = useTheme();
  const [focused, setFocused] = useState(false);
  const state = error ? 'error' : focused ? 'focus' : 'idle';
  const filled = !!rest.value;
  return (
    <View style={{ gap: 8 }}>
      <FieldLabel state={state}>{label}</FieldLabel>
      <View
        style={[
          { flexDirection: 'row', alignItems: 'center', gap: 10, height: 52, paddingHorizontal: 14, borderRadius: 12, backgroundColor: colors.surfaceSunken, borderWidth: 1, borderColor: filled ? colors.borderStrong : colors.border },
          state === 'focus' && { borderWidth: 1.5, borderColor: colors.accentLine, backgroundColor: colors.surface },
          state === 'error' && { borderWidth: 1.5, borderColor: colors.danger },
        ]}
      >
        <TextInput
          accessibilityLabel={label}
          placeholderTextColor={colors.placeholder}
          selectionColor={colors.accentLine}
          {...rest}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          style={[{ flex: 1, height: 52, color: colors.text, fontFamily: fonts.bodyMedium, fontSize: 16 }, { outlineStyle: 'none' } as object]}
        />
        {right}
      </View>
      {error ? (
        <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }} accessibilityLiveRegion="polite">
          <Ionicons name="alert-circle-outline" size={14} color={colors.danger} />
          <Text color={colors.danger} style={{ flex: 1, fontFamily: fonts.bodyMedium, fontSize: 14, lineHeight: 20 }}>
            {error}
          </Text>
        </View>
      ) : helper ? (
        <Text color={colors.textMuted} style={{ fontFamily: fonts.bodyMedium, fontSize: 12, lineHeight: 16 }}>
          {helper}
        </Text>
      ) : null}
    </View>
  );
}
