import { View } from 'react-native';
import { Text } from '../../components/ui';
import { OnbScreen } from '../../onboarding/ui/OnbScreen';
import { OnbTitle } from '../../onboarding/ui/OnbText';
import { useTheme } from '../../theme/ThemeProvider';
import { Ionicons } from '@expo/vector-icons';
import { TRAINER_NAME } from '../trainer';

export type GenerateStep = 'done' | 'now' | 'todo';

const DEFAULT_STEPS: { label: string; status: GenerateStep }[] = [
  { label: 'Matching your goals', status: 'done' },
  { label: 'Balancing weekly volume', status: 'done' },
  { label: 'Working around your injury category', status: 'now' },
  { label: 'Checking the plan against safety rules', status: 'todo' },
];

export function AiGeneratingScreen({
  steps = DEFAULT_STEPS,
  injuryLabel,
  onCancel,
}: {
  steps?: { label: string; status: GenerateStep }[];
  injuryLabel?: string | null;
  onCancel?: () => void;
}) {
  const { colors, fonts } = useTheme();
  const resolved = steps.map((s) =>
    injuryLabel && s.label.includes('injury category')
      ? { ...s, label: `Working around your ${injuryLabel.toLowerCase()} category` }
      : s,
  );
  return (
    <OnbScreen
      contentGap={24}
      headerRight={
        onCancel ? (
          <Text
            color={colors.textMuted}
            onPress={onCancel}
            accessibilityRole="button"
            accessibilityLabel="Cancel"
            style={{ fontFamily: fonts.bodyBold, fontSize: 14, letterSpacing: 1.1, textTransform: 'uppercase' }}
          >
            Cancel
          </Text>
        ) : (
          <Text color={colors.textMuted} style={{ fontFamily: fonts.bodyBold, fontSize: 14, letterSpacing: 1.1, textTransform: 'uppercase' }}>
            Cancel
          </Text>
        )
      }
    >
      <View style={{ height: 280, alignItems: 'center', justifyContent: 'center' }}>
        {[270, 220, 170, 120].map((size) => (
          <View
            key={size}
            style={{
              position: 'absolute',
              width: size,
              height: size,
              borderRadius: size / 2,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          />
        ))}
        <View
          style={{
            width: 84,
            height: 84,
            borderRadius: 42,
            backgroundColor: colors.accentSoft,
            borderWidth: 1.5,
            borderColor: colors.accentLine,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name="sparkles" size={32} color={colors.accentInk} />
        </View>
      </View>
      <View style={{ alignItems: 'center', gap: 10 }}>
        <Text color={colors.accentInk} style={{ fontFamily: fonts.bodyBold, fontSize: 12, letterSpacing: 1.2, textTransform: 'uppercase' }}>
          {TRAINER_NAME}
        </Text>
        <OnbTitle>Building your plan</OnbTitle>
        <Text color={colors.textSecondary} style={{ fontFamily: fonts.body, fontSize: 16, lineHeight: 24 }}>
          About 20 seconds.
        </Text>
      </View>
      <View
        style={{
          padding: 16,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: colors.surface,
          gap: 14,
        }}
      >
        {resolved.map((s) => (
          <View key={s.label} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View
              style={{
                width: 22,
                height: 22,
                borderRadius: 11,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: s.status === 'done' ? colors.accent : 'transparent',
                borderWidth: s.status === 'done' ? 0 : 1.5,
                borderColor: s.status === 'now' ? colors.accentLine : colors.borderStrong,
              }}
            >
              {s.status === 'done' ? <Ionicons name="checkmark" size={14} color={colors.accentText} /> : null}
            </View>
            <Text
              color={s.status === 'todo' ? colors.textMuted : colors.text}
              style={{ flex: 1, fontFamily: s.status === 'todo' ? fonts.bodyMedium : fonts.bodySemi, fontSize: 16, lineHeight: 24 }}
            >
              {s.label}
            </Text>
          </View>
        ))}
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
        <Ionicons name="information-circle-outline" size={18} color={colors.textMuted} style={{ marginTop: 1 }} />
        <Text color={colors.textMuted} style={{ flex: 1, fontFamily: fonts.bodyMedium, fontSize: 12, lineHeight: 16 }}>
          Only an injury category is sent to Anthropic, never your notes, name or email. The plan is also checked against our safety rules.
        </Text>
      </View>
    </OnbScreen>
  );
}
