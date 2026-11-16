import { Ionicons } from '@expo/vector-icons';
import { ReactNode } from 'react';
import { Pressable, Switch, View } from 'react-native';
import { Text } from '../../components/ui';
import { useTheme } from '../../theme/ThemeProvider';

/** Section caption above a consent card ("HEALTH DATA"). */
export function SectionCaption({ children }: { children: string }) {
  const { colors, fonts } = useTheme();
  return (
    <Text accessibilityRole="header" color={colors.textMuted} style={{ fontFamily: fonts.bodyBold, fontSize: 12, lineHeight: 16, letterSpacing: 0.96, textTransform: 'uppercase' }}>
      {children}
    </Text>
  );
}

/**
 * One consent: bold sentence + switch (off by default), the FULL Counsel text always visible (no expander), and an
 * optional lock note. Never carries an "accept all". `locked` shows a lock icon and the switch cannot be turned on.
 * `inertOff`: an off switch whose tap still does something (AI needs health → explanation), so it is not "disabled".
 */
export function ConsentCard({ title, body, on, onChange, locked = false, lockNote, label, children }: { title: string; body: string; on: boolean; onChange: (v: boolean) => void; locked?: boolean; lockNote?: string; label: string; children?: ReactNode }) {
  const { colors, fonts } = useTheme();
  return (
    <View style={{ borderRadius: 20, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, padding: 18, gap: 14 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <Text color={colors.text} style={{ flex: 1, fontFamily: fonts.bodyBold, fontSize: 16, lineHeight: 22, letterSpacing: -0.1 }}>
          {title}
        </Text>
        {locked ? <Ionicons name="lock-closed-outline" size={16} color={colors.textMuted} accessibilityLabel="Locked" /> : null}
        <Switch
          value={on}
          onValueChange={onChange}
          disabled={locked}
          accessibilityLabel={label}
          trackColor={{ false: colors.surfaceSunken, true: colors.accent }}
          thumbColor={on ? colors.accentText : colors.textMuted}
          ios_backgroundColor={colors.surfaceSunken}
        />
      </View>
      <Text color={colors.textSecondary} style={{ fontFamily: fonts.body, fontSize: 14, lineHeight: 20 }}>
        {body}
      </Text>
      {locked && lockNote ? (
        <View style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start' }}>
          <Ionicons name="lock-closed-outline" size={14} color={colors.textMuted} style={{ marginTop: 3 }} />
          <Text color={colors.textSecondary} style={{ flex: 1, fontFamily: fonts.bodyMedium, fontSize: 14, lineHeight: 20 }}>
            {lockNote}
          </Text>
        </View>
      ) : null}
      {children}
    </View>
  );
}

/** Parent-consent optional box: checkbox + bold title + full text. `disabled` greys it (AI without health) but a tap still reports. */
export function OptionBox({ title, body, checked, onChange, disabled = false, label }: { title: string; body: string; checked: boolean; onChange: (v: boolean) => void; disabled?: boolean; label: string }) {
  const { colors, fonts } = useTheme();
  return (
    <View style={{ borderRadius: 20, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, padding: 18, gap: 12, opacity: disabled ? 0.7 : 1 }}>
      <Pressable
        onPress={() => onChange(!checked)}
        accessibilityRole="checkbox"
        accessibilityLabel={label}
        accessibilityState={{ checked, disabled }}
        style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}
      >
        <View style={[{ width: 22, height: 22, borderRadius: 6, alignItems: 'center', justifyContent: 'center' }, checked ? { backgroundColor: colors.accent } : { borderWidth: 1.5, borderColor: colors.borderStrong, backgroundColor: colors.surfaceSunken }]}>
          {checked ? <Ionicons name="checkmark" size={16} color={colors.accentText} /> : null}
        </View>
        <Text color={colors.text} style={{ flex: 1, fontFamily: fonts.bodyBold, fontSize: 16, lineHeight: 22, letterSpacing: -0.1 }}>
          {title}
        </Text>
      </Pressable>
      <Text color={colors.textSecondary} style={{ fontFamily: fonts.body, fontSize: 14, lineHeight: 20 }}>
        {body}
      </Text>
    </View>
  );
}

/** "AI planning needs health info" explanation, inline under the AI card. Health only turns on from the explicit action. [COUNSEL] chrome. */
export function NeedsHealthNotice({ title, body, action, dismiss, onAction, onDismiss }: { title: string; body: string; action: string; dismiss: string; onAction: () => void; onDismiss: () => void }) {
  const { colors, fonts } = useTheme();
  return (
    <View accessibilityLiveRegion="polite" style={{ borderRadius: 14, borderWidth: 1, borderColor: colors.accentLine, backgroundColor: colors.surfaceRaised, padding: 14, gap: 10 }}>
      <Text color={colors.text} style={{ fontFamily: fonts.bodyBold, fontSize: 15, lineHeight: 20 }}>
        {title}
      </Text>
      <Text color={colors.textSecondary} style={{ fontFamily: fonts.body, fontSize: 14, lineHeight: 20 }}>
        {body}
      </Text>
      <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap' }}>
        <Pressable onPress={onAction} accessibilityRole="button" accessibilityLabel={action} style={{ minHeight: 40, paddingHorizontal: 16, borderRadius: 999, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' }}>
          <Text importantForAccessibility="no" color={colors.accentText} style={{ fontFamily: fonts.bodyBold, fontSize: 14 }}>
            {action}
          </Text>
        </Pressable>
        <Pressable onPress={onDismiss} accessibilityRole="button" accessibilityLabel={dismiss} style={{ minHeight: 40, paddingHorizontal: 16, borderRadius: 999, borderWidth: 1, borderColor: colors.borderStrong, alignItems: 'center', justifyContent: 'center' }}>
          <Text importantForAccessibility="no" color={colors.text} style={{ fontFamily: fonts.bodySemi, fontSize: 14 }}>
            {dismiss}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
