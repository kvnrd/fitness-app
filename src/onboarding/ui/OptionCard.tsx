import { Ionicons } from '@expo/vector-icons';
import { ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import { Text } from '../../components/ui';
import { useTheme } from '../../theme/ThemeProvider';

/** Round selection mark: accent disc + check when selected, outlined ring otherwise. */
export function SelectMark({ selected, size = 24, square = false }: { selected: boolean; size?: number; square?: boolean }) {
  const { colors } = useTheme();
  const r = square ? 8 : size / 2;
  return (
    <View
      style={[
        { width: size, height: size, borderRadius: r, alignItems: 'center', justifyContent: 'center' },
        selected ? { backgroundColor: colors.accent } : { borderWidth: 1.5, borderColor: colors.borderStrong },
      ]}
    >
      {selected ? <Ionicons name="checkmark" size={Math.round(size * 0.62)} color={colors.accentText} /> : null}
    </View>
  );
}

/**
 * Selectable card used by Role, Style and the minor-safe Goal list. Selected = accent border + soft accent glow.
 * `display` titles are Barlow Condensed uppercase (role / style); `body` titles are Inter semibold (minor goals).
 */
export function OptionCard({
  title,
  description,
  selected,
  onPress,
  icon,
  badge,
  trailing,
  titleStyle = 'display',
  markLeft = false,
  children,
  accessibilityLabel,
}: {
  title: string;
  description?: string;
  selected: boolean;
  onPress: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
  badge?: ReactNode;
  trailing?: ReactNode;
  titleStyle?: 'display' | 'body';
  markLeft?: boolean;
  children?: ReactNode;
  accessibilityLabel?: string;
}) {
  const { colors, fonts } = useTheme();
  return (
    <View
      style={[
        { borderRadius: 20, borderWidth: 1, backgroundColor: colors.surface, borderColor: colors.border },
        selected && { borderWidth: 1.5, borderColor: colors.accentLine, shadowColor: colors.accent, shadowOpacity: 0.22, shadowRadius: 16, shadowOffset: { width: 0, height: 4 } },
      ]}
    >
      <Pressable
        onPress={onPress}
        accessibilityRole="radio"
        accessibilityLabel={accessibilityLabel ?? title}
        accessibilityState={{ selected }}
        style={({ pressed }) => [{ flexDirection: 'row', gap: 14, padding: 16, paddingRight: 16, alignItems: 'flex-start' }, pressed && { opacity: 0.85 }]}
      >
        {markLeft ? <SelectMark selected={selected} size={26} /> : null}
        {icon ? (
          <View style={{ width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceRaised }}>
            <Ionicons name={icon} size={22} color={selected ? colors.accentInk : colors.textSecondary} />
          </View>
        ) : null}
        <View style={{ flex: 1, gap: 4 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <Text
              color={colors.text}
              style={
                titleStyle === 'display'
                  ? { fontFamily: fonts.displayBold, fontSize: 20, lineHeight: 24, textTransform: 'uppercase', letterSpacing: 0.2 }
                  : { fontFamily: fonts.bodySemi, fontSize: 18, lineHeight: 24, letterSpacing: -0.2 }
              }
            >
              {title}
            </Text>
            {badge}
          </View>
          {description ? (
            <Text color={colors.textSecondary} style={{ fontFamily: fonts.body, fontSize: titleStyle === 'display' ? 16 : 16, lineHeight: 22 }}>
              {description}
            </Text>
          ) : null}
        </View>
        {trailing ?? (markLeft ? null : <SelectMark selected={selected} />)}
      </Pressable>
      {children}
    </View>
  );
}

/** Small outlined tag next to a title: "MAIN", "VERIFIED ONLY". */
export function Tag({ children, accent = false }: { children: string; accent?: boolean }) {
  const { colors, fonts } = useTheme();
  return (
    <View style={{ paddingHorizontal: 6, height: 22, borderRadius: 6, borderWidth: 1, borderColor: accent ? colors.accentLine : colors.borderStrong, justifyContent: 'center' }}>
      <Text importantForAccessibility="no" color={accent ? colors.accentInk : colors.textSecondary} style={{ fontFamily: fonts.bodyBold, fontSize: 11, letterSpacing: 0.7, textTransform: 'uppercase' }}>
        {children}
      </Text>
    </View>
  );
}
