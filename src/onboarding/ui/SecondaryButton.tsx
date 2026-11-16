import { ReactNode } from 'react';
import { Pressable, StyleProp, ViewStyle } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { Text } from '../../components/ui';

/** Outlined pill (56px): "I already have an account", "Continue with email", "Open mail app". */
export function SecondaryButton({
  label,
  onPress,
  icon,
  disabled,
  style,
  labelColor,
}: {
  label: string;
  onPress?: () => void;
  icon?: ReactNode;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  labelColor?: string;
}) {
  const { colors, fonts } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled }}
      style={({ pressed }) => [
        {
          minHeight: 52,
          borderRadius: 999,
          borderWidth: 1,
          borderColor: colors.borderStrong,
          backgroundColor: colors.surfaceRaised,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 10,
          paddingHorizontal: 20,
        },
        pressed && { opacity: 0.8 },
        disabled && { opacity: 0.5 },
        style,
      ]}
    >
      {icon}
      <Text importantForAccessibility="no" color={labelColor ?? colors.text} style={{ fontFamily: fonts.bodySemi, fontSize: 16, lineHeight: 24 }}>
        {label}
      </Text>
    </Pressable>
  );
}
