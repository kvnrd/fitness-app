import { Ionicons } from '@expo/vector-icons';
import { Pressable, Switch, View } from 'react-native';
import { Text } from '../../components/ui';
import { useTheme } from '../../theme/ThemeProvider';
import { minControlSize } from '../../theme/tokens';
import {
  ADD_PHOTOS_CAMERA_ROLL_LABEL,
  ADD_PHOTOS_CAMERA_ROLL_NOTE,
  ADD_PHOTOS_CAMERA_ROLL_SUB,
  ADD_PHOTOS_CANCEL,
  ADD_PHOTOS_CHOOSE_FROM_LIBRARY,
  ADD_PHOTOS_CHOOSE_FROM_LIBRARY_SUB,
  ADD_PHOTOS_SHEET_TITLE,
  ADD_PHOTOS_TAKE_PHOTO,
  ADD_PHOTOS_TAKE_PHOTO_SUB,
} from '../phase5bCopy.ts';
import { DEFAULT_CAMERA_ROLL_COPIES } from '../photoPrivacy.ts';
import { SheetCard } from './sheet.tsx';

export function AddPhotosChooser({
  cameraRollOn = DEFAULT_CAMERA_ROLL_COPIES,
  onCameraRollChange,
  onTakePhoto,
  onChooseFromLibrary,
  onCancel,
}: {
  cameraRollOn?: boolean;
  onCameraRollChange?: (on: boolean) => void;
  onTakePhoto: () => void;
  onChooseFromLibrary: () => void;
  onCancel: () => void;
}) {
  const { colors, fonts } = useTheme();
  const option = (icon: keyof typeof Ionicons.glyphMap, title: string, sub: string, onPress: () => void) => (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${sub}`}
      style={{
        minHeight: minControlSize,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 12,
        borderTopWidth: 1,
        borderTopColor: colors.border,
      }}
    >
      <Ionicons name={icon} size={22} color={colors.text} />
      <View style={{ flex: 1, gap: 2 }}>
        <Text color={colors.text} style={{ fontFamily: fonts.bodySemi, fontSize: 16, lineHeight: 22 }}>
          {title}
        </Text>
        <Text color={colors.textSecondary} style={{ fontFamily: fonts.body, fontSize: 14, lineHeight: 20 }}>
          {sub}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
    </Pressable>
  );
  return (
    <SheetCard>
      <Text variant="title" accessibilityRole="header">
        {ADD_PHOTOS_SHEET_TITLE}
      </Text>
      {option('camera-outline', ADD_PHOTOS_TAKE_PHOTO, ADD_PHOTOS_TAKE_PHOTO_SUB, onTakePhoto)}
      {option('images-outline', ADD_PHOTOS_CHOOSE_FROM_LIBRARY, ADD_PHOTOS_CHOOSE_FROM_LIBRARY_SUB, onChooseFromLibrary)}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingTop: 4 }}>
        <View style={{ flex: 1, gap: 2 }}>
          <Text color={colors.text} style={{ fontFamily: fonts.bodySemi, fontSize: 16, lineHeight: 22 }}>
            {ADD_PHOTOS_CAMERA_ROLL_LABEL}
          </Text>
          <Text color={colors.textSecondary} style={{ fontFamily: fonts.body, fontSize: 14, lineHeight: 20 }}>
            {ADD_PHOTOS_CAMERA_ROLL_SUB}
          </Text>
          <Text color={colors.textMuted} style={{ fontFamily: fonts.body, fontSize: 13, lineHeight: 18 }}>
            {ADD_PHOTOS_CAMERA_ROLL_NOTE}
          </Text>
        </View>
        <Switch
          value={cameraRollOn}
          onValueChange={onCameraRollChange}
          accessibilityLabel={ADD_PHOTOS_CAMERA_ROLL_LABEL}
        />
      </View>
      <Pressable
        onPress={onCancel}
        accessibilityRole="button"
        accessibilityLabel={ADD_PHOTOS_CANCEL}
        style={{ minHeight: minControlSize, alignItems: 'center', justifyContent: 'center' }}
      >
        <Text color={colors.text} style={{ fontFamily: fonts.bodySemi, fontSize: 16 }}>
          {ADD_PHOTOS_CANCEL}
        </Text>
      </Pressable>
    </SheetCard>
  );
}
