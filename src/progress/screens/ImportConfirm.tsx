import { Pressable, View } from 'react-native';
import { ScreenBackground } from '../../components/ScreenAtmosphere';
import { Text } from '../../components/ui';
import { useTheme } from '../../theme/ThemeProvider';
import { minControlSize, space } from '../../theme/tokens';
import {
  IMPORT_ADD,
  IMPORT_CONFIRM_TITLE,
  IMPORT_DATE_CONFIRM,
  IMPORT_DATE_EDIT,
  IMPORT_DATE_LABEL,
  IMPORT_POSE_LABEL,
  IMPORT_SKIP,
  IMPORT_STRIP_NOTE,
} from '../phase5bCopy.ts';

export function ImportConfirmScreen({
  index,
  total,
  dateLabel,
  pose = 'Front',
  poses = ['Front', 'Side', 'Back'],
  onSelectPose,
  onEditDate,
  onSkip,
  onAdd,
  onBack,
}: {
  index: number;
  total: number;
  dateLabel: string;
  pose?: string;
  poses?: readonly string[];
  onSelectPose?: (pose: string) => void;
  onEditDate: () => void;
  onSkip: () => void;
  onAdd: () => void;
  onBack?: () => void;
}) {
  const { colors, fonts, radius } = useTheme();
  return (
    <ScreenBackground>
      <View style={{ flex: 1, padding: 24, gap: 20 }}>
        {onBack ? (
          <Pressable onPress={onBack} accessibilityRole="button" accessibilityLabel="Back" style={{ minHeight: minControlSize, justifyContent: 'center' }}>
            <Text color={colors.text}>Back</Text>
          </Pressable>
        ) : null}
        <Text variant="title" accessibilityRole="header">
          {IMPORT_CONFIRM_TITLE(index, total)}
        </Text>
        <Text color={colors.textMuted} style={{ fontFamily: fonts.bodyBold, fontSize: 12, letterSpacing: 1, textTransform: 'uppercase' }}>
          {IMPORT_POSE_LABEL}
        </Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {poses.map((p) => {
            const on = p === pose;
            return (
              <Pressable
                key={p}
                onPress={() => onSelectPose?.(p)}
                accessibilityRole="button"
                accessibilityState={{ selected: on }}
                accessibilityLabel={p}
                style={{
                  minHeight: minControlSize,
                  paddingHorizontal: 14,
                  borderRadius: radius.input ?? 12,
                  borderWidth: 1,
                  borderColor: on ? colors.accent : colors.border,
                  backgroundColor: on ? colors.accent : 'transparent',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={{ fontFamily: fonts.bodySemi, color: on ? colors.accentInk : colors.text }}>{p}</Text>
              </Pressable>
            );
          })}
        </View>
        <View style={{ gap: 6 }}>
          <Text color={colors.textMuted} style={{ fontFamily: fonts.bodyBold, fontSize: 12, letterSpacing: 1, textTransform: 'uppercase' }}>
            {IMPORT_DATE_LABEL}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Text color={colors.text} style={{ flex: 1, fontFamily: fonts.bodySemi, fontSize: 16 }}>
              {dateLabel}
            </Text>
            <Pressable onPress={onEditDate} accessibilityRole="button" accessibilityLabel={IMPORT_DATE_EDIT} style={{ minHeight: minControlSize, justifyContent: 'center' }}>
              <Text color={colors.accentInk} style={{ fontFamily: fonts.bodySemi }}>{IMPORT_DATE_EDIT}</Text>
            </Pressable>
          </View>
          <Text color={colors.textSecondary} style={{ fontFamily: fonts.body, fontSize: 14, lineHeight: 20 }}>
            {IMPORT_DATE_CONFIRM}
          </Text>
        </View>
        <Text color={colors.textMuted} style={{ fontFamily: fonts.body, fontSize: 14, lineHeight: 20 }}>
          {IMPORT_STRIP_NOTE}
        </Text>
        <View style={{ flexDirection: 'row', gap: 12, marginTop: 'auto', paddingBottom: space.lg }}>
          <Pressable
            onPress={onSkip}
            accessibilityRole="button"
            accessibilityLabel={IMPORT_SKIP}
            style={{ flex: 1, minHeight: minControlSize, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.borderStrong, borderRadius: radius.input ?? 12 }}
          >
            <Text color={colors.text} style={{ fontFamily: fonts.bodySemi, fontSize: 16 }}>{IMPORT_SKIP}</Text>
          </Pressable>
          <Pressable
            onPress={onAdd}
            accessibilityRole="button"
            accessibilityLabel={IMPORT_ADD}
            style={{ flex: 1, minHeight: minControlSize, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.accent, borderRadius: radius.input ?? 12 }}
          >
            <Text style={{ fontFamily: fonts.bodySemi, fontSize: 16, color: colors.accentInk }}>{IMPORT_ADD}</Text>
          </Pressable>
        </View>
      </View>
    </ScreenBackground>
  );
}
