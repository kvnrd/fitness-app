import { Pressable, View } from 'react-native';
import { Text } from '../../components/ui';
import { useTheme } from '../../theme/ThemeProvider';
import { minControlSize } from '../../theme/tokens';
import { ADD_PHOTOS_BUTTON, GALLERY_LOCK_LINE_FACE, PHOTO_LIBRARY_LINE, PHOTOS_TAB } from '../phase5bCopy.ts';

export type GalleryItem = { id: string; dateLabel: string };

export function PhotoGalleryScreen({
  items,
  onAdd,
  onOpenPhoto,
}: {
  items: readonly GalleryItem[];
  onAdd?: () => void;
  onOpenPhoto?: (id: string) => void;
}) {
  const { colors, fonts, radius } = useTheme();
  return (
    <View style={{ gap: 16 }}>
      <Text variant="hero" accessibilityRole="header">{PHOTOS_TAB}</Text>
      <Text color={colors.textMuted} style={{ fontFamily: fonts.body, fontSize: 13 }}>{GALLERY_LOCK_LINE_FACE}</Text>
      <Text color={colors.textMuted} style={{ fontFamily: fonts.body, fontSize: 13 }}>{PHOTO_LIBRARY_LINE}</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
        {items.map((item) => (
          <Pressable
            key={item.id}
            onPress={() => onOpenPhoto?.(item.id)}
            accessibilityRole="button"
            accessibilityLabel={item.dateLabel}
            style={{
              width: 104,
              height: 104,
              borderRadius: radius.tile ?? 8,
              backgroundColor: colors.surfaceSunken,
              borderWidth: 1,
              borderColor: colors.border,
              padding: 8,
              justifyContent: 'flex-end',
            }}
          >
            <Text color={colors.textSecondary} style={{ fontFamily: fonts.body, fontSize: 12 }}>{item.dateLabel}</Text>
          </Pressable>
        ))}
      </View>
      {onAdd ? (
        <Pressable onPress={onAdd} accessibilityRole="button" accessibilityLabel={ADD_PHOTOS_BUTTON} style={{ minHeight: minControlSize, justifyContent: 'center' }}>
          <Text color={colors.accentInk} style={{ fontFamily: fonts.bodySemi, fontSize: 16 }}>{ADD_PHOTOS_BUTTON}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
