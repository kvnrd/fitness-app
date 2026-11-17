import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { AI_PLAN_NOTICE, AI_PLAN_NOTICE_MORE, AI_PLAN_NOTICE_SHORT } from '../ai/notice';
import { useTheme } from '../theme/ThemeProvider';
import { Text } from './ui';

/**
 * Counsel's plan-screen notice (Paper board 27 "Plan AI notice"): an "AI" tag in the accent ink, then the fixed sentence.
 * Shown on EVERY surface that shows an AI-made plan and never hidden (phase4-review #7).
 * After the first session it shrinks to a one-line footer; the full verbatim is a tap away. [ATTORNEY]
 */
export function AiNotice({
  variant = 'banner',
  onMore,
}: {
  variant?: 'banner' | 'footer';
  onMore?: () => void;
}) {
  const { colors, fonts } = useTheme();
  const [open, setOpen] = useState(false);
  const banner = (
    <View
      accessibilityRole="text"
      accessibilityLabel={AI_PLAN_NOTICE}
      style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start', borderWidth: 1, borderColor: colors.border, borderRadius: 16, paddingVertical: 14, paddingHorizontal: 16, backgroundColor: colors.surface }}
    >
      <Text importantForAccessibility="no" color={colors.accentInk} style={{ fontFamily: fonts.bodyBold, fontSize: 14, lineHeight: 22, letterSpacing: 0.5 }}>
        AI
      </Text>
      <Text importantForAccessibility="no" color={colors.textSecondary} style={{ flex: 1, fontFamily: fonts.body, fontSize: 16, lineHeight: 22 }}>
        {AI_PLAN_NOTICE}
      </Text>
    </View>
  );
  if (variant === 'banner') return banner;
  return (
    <View>
      {open && !onMore ? <View style={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 }}>{banner}</View> : null}
      <Pressable
        onPress={onMore ?? (() => setOpen((v) => !v))}
        accessibilityRole="button"
        accessibilityLabel={`${AI_PLAN_NOTICE_SHORT}. ${AI_PLAN_NOTICE_MORE}. ${AI_PLAN_NOTICE}`}
        accessibilityState={{ expanded: open }}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          paddingHorizontal: 20,
          paddingVertical: 8,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        }}
      >
        <Text importantForAccessibility="no" color={colors.accentInk} style={{ fontFamily: fonts.bodyBold, fontSize: 12, letterSpacing: 0.5 }}>
          AI
        </Text>
        <Text importantForAccessibility="no" color={colors.textSecondary} numberOfLines={1} style={{ flex: 1, fontFamily: fonts.bodyMedium, fontSize: 12, lineHeight: 16 }}>
          {AI_PLAN_NOTICE_SHORT}
        </Text>
        <Text importantForAccessibility="no" color={colors.accentInk} style={{ fontFamily: fonts.bodyBold, fontSize: 12, letterSpacing: 0.8, textTransform: 'uppercase' }}>
          {AI_PLAN_NOTICE_MORE}
        </Text>
      </Pressable>
    </View>
  );
}
