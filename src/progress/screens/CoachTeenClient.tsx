import { View } from 'react-native';
import { Text } from '../../components/ui';
import { useTheme } from '../../theme/ThemeProvider';
import {
  COACH_CLIENT_META,
  COACH_SHARING_LIMITS_TITLE,
  COACH_TEEN_CLIENT_NOTE,
  COACH_WEIGHT_NOT_SHARED,
} from '../teenWeightCopy.ts';

/** Preview-only Studio surfaces 33 / 34. Not wired into the plan-editor Studio tab. */
export function CoachClientListPreview({ name, highlighted }: { name: string; highlighted?: boolean }) {
  const { colors, fonts, radius } = useTheme();
  return (
    <View style={{ gap: 16 }}>
      <Text variant="hero" accessibilityRole="header">Studio</Text>
      <View
        style={{
          backgroundColor: colors.glass ?? colors.surface,
          borderColor: highlighted ? colors.accentInk : (colors.glassBorder ?? colors.border),
          borderWidth: highlighted ? 2 : 1,
          borderRadius: radius.hero ?? 24,
          padding: 16,
          gap: 4,
        }}
      >
        <Text color={colors.text} style={{ fontFamily: fonts.bodySemi, fontSize: 16 }}>{name}</Text>
        <Text color={colors.textSecondary} style={{ fontFamily: fonts.body, fontSize: 14 }}>{COACH_CLIENT_META}</Text>
      </View>
    </View>
  );
}

export function CoachTeenClientPage({ name, planGoal }: { name: string; planGoal: string }) {
  const { colors, fonts, radius } = useTheme();
  return (
    <View style={{ gap: 16 }}>
      <Text variant="hero" accessibilityRole="header">{name}</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {['16–17', COACH_WEIGHT_NOT_SHARED, 'No photos'].map((chip) => (
          <View
            key={chip}
            style={{
              paddingHorizontal: 10,
              paddingVertical: 6,
              borderRadius: radius.pill,
              borderWidth: 1,
              borderColor: colors.border,
              backgroundColor: colors.surfaceSunken ?? colors.surface,
            }}
          >
            <Text color={colors.textSecondary} style={{ fontFamily: fonts.bodyMedium, fontSize: 12 }}>{chip}</Text>
          </View>
        ))}
      </View>
      <Text color={colors.text} style={{ fontFamily: fonts.body, fontSize: 16 }}>Plan goal · {planGoal}</Text>
      <View
        style={{
          backgroundColor: colors.glass ?? colors.surface,
          borderColor: colors.glassBorder ?? colors.border,
          borderWidth: 1,
          borderRadius: radius.hero ?? 24,
          padding: 16,
          gap: 8,
        }}
      >
        <Text color={colors.text} style={{ fontFamily: fonts.bodySemi, fontSize: 16 }}>{COACH_SHARING_LIMITS_TITLE}</Text>
        <Text color={colors.textSecondary} style={{ fontFamily: fonts.body, fontSize: 15, lineHeight: 22 }}>{COACH_TEEN_CLIENT_NOTE}</Text>
      </View>
    </View>
  );
}
