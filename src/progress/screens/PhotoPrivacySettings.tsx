import { Ionicons } from '@expo/vector-icons';
import { Pressable, ScrollView, Switch, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenBackground, screenScrollContentStyle } from '../../components/ScreenAtmosphere';
import { Text } from '../../components/ui';
import { useTheme } from '../../theme/ThemeProvider';
import { minControlSize, space } from '../../theme/tokens';
import {
  ADD_PHOTOS_CAMERA_ROLL_LABEL,
  ADD_PHOTOS_CAMERA_ROLL_SUB,
  PHOTO_LIBRARY_LINE,
  PHOTO_PRIVACY_BLUR,
  PHOTO_PRIVACY_BLUR_SUB,
  PHOTO_PRIVACY_COACH_SHARING,
  PHOTO_PRIVACY_DELETE_ALL,
  PHOTO_PRIVACY_DOWNLOAD,
  PHOTO_PRIVACY_LOCK,
  PHOTO_PRIVACY_NOT_OPTED_SUB,
  PHOTO_PRIVACY_TITLE,
  PHOTO_PRIVACY_TURN_OFF,
  PHOTO_PRIVACY_TURN_OFF_SUB,
  PHOTO_PRIVACY_WEIGHT_NOTE,
  PROGRESS_PHOTOS_OFF,
  PROGRESS_PHOTOS_ON,
  PROGRESS_PHOTOS_ROW_LABEL,
} from '../phase5bCopy.ts';
import { lockSubtitle } from '../photoPrivacy.ts';

export function PhotoPrivacySettingsScreen({
  optedIn,
  lockOn,
  blurOn,
  cameraRollOn,
  coachSharingOn,
  onBack,
  onOpenOptIn,
  onToggleLock,
  onToggleBlur,
  onToggleCameraRoll,
  onCoachSharing,
  onDownload,
  onTurnOff,
  onDeleteAll,
}: {
  optedIn: boolean;
  lockOn?: boolean;
  blurOn?: boolean;
  cameraRollOn?: boolean;
  coachSharingOn?: boolean;
  onBack?: () => void;
  onOpenOptIn?: () => void;
  onToggleLock?: (on: boolean) => void;
  onToggleBlur?: (on: boolean) => void;
  onToggleCameraRoll?: (on: boolean) => void;
  onCoachSharing?: () => void;
  onDownload?: () => void;
  onTurnOff?: () => void;
  onDeleteAll?: () => void;
}) {
  const { colors, fonts } = useTheme();
  const insets = useSafeAreaInsets();
  const row = (opts: {
    label: string;
    sub?: string;
    value?: string;
    onPress?: () => void;
    toggle?: { value: boolean; onChange: (v: boolean) => void };
  }) => (
    <Pressable
      onPress={opts.onPress}
      disabled={!opts.onPress && !opts.toggle}
      accessibilityRole={opts.onPress ? 'button' : opts.toggle ? 'switch' : 'text'}
      accessibilityLabel={opts.label}
      accessibilityState={opts.toggle ? { checked: opts.toggle.value } : undefined}
      style={{ paddingVertical: 12, minHeight: minControlSize, flexDirection: 'row', alignItems: 'center', gap: 12, borderTopWidth: 1, borderTopColor: colors.border }}
    >
      <View style={{ flex: 1, gap: 2 }}>
        <Text color={colors.text} style={{ fontFamily: fonts.bodySemi, fontSize: 16, lineHeight: 22 }}>{opts.label}</Text>
        {opts.sub ? <Text color={colors.textSecondary} style={{ fontFamily: fonts.body, fontSize: 14, lineHeight: 20 }}>{opts.sub}</Text> : null}
      </View>
      {opts.value ? <Text color={colors.textMuted} style={{ fontFamily: fonts.bodyMedium, fontSize: 14 }}>{opts.value}</Text> : null}
      {opts.toggle ? <Switch value={opts.toggle.value} onValueChange={opts.toggle.onChange} /> : null}
      {opts.onPress ? <Ionicons name="chevron-forward" size={16} color={colors.textMuted} /> : null}
    </Pressable>
  );

  return (
    <ScreenBackground>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={[screenScrollContentStyle(colors.bg), { paddingTop: insets.top + space.md, paddingHorizontal: 24, paddingBottom: 48, gap: 16 }]}>
        <Pressable onPress={onBack} accessibilityRole="button" accessibilityLabel="Back" style={{ alignSelf: 'flex-start', minHeight: minControlSize, justifyContent: 'center' }}>
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </Pressable>
        <Text variant="hero" accessibilityRole="header">{PHOTO_PRIVACY_TITLE}</Text>
        {!optedIn
          ? row({
              label: PROGRESS_PHOTOS_ROW_LABEL,
              sub: PHOTO_PRIVACY_NOT_OPTED_SUB,
              value: PROGRESS_PHOTOS_OFF,
              onPress: onOpenOptIn,
            })
          : (
            <View>
              {row({ label: PHOTO_PRIVACY_LOCK, sub: lockSubtitle(), toggle: onToggleLock ? { value: !!lockOn, onChange: onToggleLock } : undefined })}
              {row({ label: PHOTO_PRIVACY_BLUR, sub: PHOTO_PRIVACY_BLUR_SUB, toggle: onToggleBlur ? { value: !!blurOn, onChange: onToggleBlur } : undefined })}
              {row({ label: ADD_PHOTOS_CAMERA_ROLL_LABEL, sub: ADD_PHOTOS_CAMERA_ROLL_SUB, toggle: onToggleCameraRoll ? { value: !!cameraRollOn, onChange: onToggleCameraRoll } : undefined })}
              {row({ label: PHOTO_PRIVACY_COACH_SHARING, value: coachSharingOn ? PROGRESS_PHOTOS_ON : PROGRESS_PHOTOS_OFF, onPress: onCoachSharing })}
              {row({ label: PHOTO_PRIVACY_DOWNLOAD, onPress: onDownload })}
              {row({ label: PHOTO_PRIVACY_TURN_OFF, sub: PHOTO_PRIVACY_TURN_OFF_SUB, onPress: onTurnOff })}
              {row({ label: PHOTO_PRIVACY_DELETE_ALL, onPress: onDeleteAll })}
            </View>
          )}
        <Text color={colors.textMuted} style={{ fontFamily: fonts.body, fontSize: 13, lineHeight: 18 }}>
          {PHOTO_LIBRARY_LINE}
        </Text>
        {optedIn ? (
          <Text color={colors.textMuted} style={{ fontFamily: fonts.body, fontSize: 13, lineHeight: 18 }}>
            {PHOTO_PRIVACY_WEIGHT_NOTE}
          </Text>
        ) : null}
      </ScrollView>
    </ScreenBackground>
  );
}
