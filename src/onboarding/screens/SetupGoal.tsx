import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { Text } from '../../components/ui';
import { useTheme } from '../../theme/ThemeProvider';
import { WEIGHT_PACE_NOTE, WEIGHT_STAYS_ON_DEVICE, DELETE_WEIGHT_LABEL } from '../copy';
import { ADULT_GOALS, MINOR_GOALS, MINOR_GOAL_HINT, PACES, type AdultGoalId, type MinorGoalId, type PaceId } from '../goals';
import type { Units } from '../prefs';
import { formatWeight, projection } from '../weightGoal';
import { FieldLabel } from '../ui/Field';
import { FooterHint, OnbScreen } from '../ui/OnbScreen';
import { LinkButton, OnbSub, OnbTitle } from '../ui/OnbText';
import { OptionCard } from '../ui/OptionCard';
import { Caption } from '../ui/Pills';
import { PrimaryCta } from '../ui/PrimaryCta';
import { Stepper } from '../ui/Stepper';
import { StepHeader } from '../ui/StepHeader';

export type GoalAdultProps = {
  goal: AdultGoalId | null;
  onGoal: (g: AdultGoalId) => void;
  units: Units;
  /** Typed text for the current weight (kept as text so partial input is never rewritten). */
  currentText: string;
  onCurrentText: (v: string) => void;
  target: number | null;
  onTargetStep: (dir: 1 | -1) => void;
  pace: PaceId;
  onPace: (p: PaceId) => void;
  /** A weight goal is stored on this device (shows the delete control). */
  storedOnDevice: boolean;
  onDeleteWeight: () => void;
  busy?: boolean;
  message?: string | null;
  onContinue: () => void;
  onSkip: () => void;
  onBack?: () => void;
};

/** Setup · Step 5 of 8, adults: Lose / Gain / Maintain + weights + pace. Weights stay ON DEVICE (never sent to save_training_setup). [ATTORNEY] */
export function GoalAdultScreen(p: GoalAdultProps) {
  const { colors, fonts } = useTheme();
  const [focus, setFocus] = useState(false);
  const cur = Number(p.currentText.replace(',', '.'));
  const current = p.currentText.trim() && Number.isFinite(cur) ? cur : null;
  const showTarget = p.goal === 'lose' || p.goal === 'gain';
  const proj = showTarget && p.goal ? projection(current, p.target, p.units, p.pace) : null;
  return (
    <OnbScreen
      onBack={p.onBack}
      onSkip={p.onSkip}
      footer={<PrimaryCta label="Continue" busy={p.busy} onPress={p.onContinue} />}
    >
      <StepHeader eyebrow="Setup" current={5} />
      <View style={{ gap: 10 }}>
        <OnbTitle>Weight goal</OnbTitle>
        <OnbSub>Optional. It shapes Home and Progress, and you can change it anytime in Progress.</OnbSub>
      </View>
      <View style={{ flexDirection: 'row', gap: 12 }}>
        {ADULT_GOALS.map((g) => {
          const sel = p.goal === g.id;
          return (
            <Pressable
              key={g.id}
              onPress={() => p.onGoal(g.id)}
              accessibilityRole="radio"
              accessibilityLabel={`${g.label}, ${g.description}`}
              accessibilityState={{ selected: sel }}
              style={[
                { flex: 1, borderRadius: 16, padding: 12, gap: 2, borderWidth: sel ? 1.5 : 1, borderColor: sel ? colors.accentLine : colors.border, backgroundColor: colors.surface },
                sel && { shadowColor: colors.accent, shadowOpacity: 0.22, shadowRadius: 12, shadowOffset: { width: 0, height: 3 } },
              ]}
            >
              <Text importantForAccessibility="no" numberOfLines={1} color={colors.text} style={{ fontFamily: fonts.displayHeavy, fontSize: 20, lineHeight: 26, textTransform: 'uppercase' }}>
                {g.label}
              </Text>
              <Text importantForAccessibility="no" color={colors.textSecondary} style={{ fontFamily: fonts.body, fontSize: 14, lineHeight: 18 }}>
                {g.description}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start' }}>
        <View style={{ flex: 1, gap: 8 }}>
          <FieldLabel>Current</FieldLabel>
          <View style={{ height: 56, borderRadius: 14, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.surface, borderWidth: focus ? 1.5 : 1, borderColor: focus ? colors.accentLine : colors.border }}>
            <TextInput
              value={p.currentText}
              onChangeText={(v) => p.onCurrentText(v.replace(/[^0-9.,]/g, '').slice(0, 6))}
              onFocus={() => setFocus(true)}
              onBlur={() => setFocus(false)}
              accessibilityLabel={`Current weight in ${p.units}`}
              placeholder="—"
              placeholderTextColor={colors.placeholder}
              keyboardType="decimal-pad"
              inputMode="decimal"
              maxLength={6}
              style={[{ width: (p.currentText.length || 1) * 19 + 8, minWidth: 28, color: colors.text, fontFamily: fonts.displayHeavy, fontSize: 36, height: 56 }, { outlineStyle: 'none' } as object]}
            />
            <Text color={colors.textSecondary} style={{ fontFamily: fonts.bodySemi, fontSize: 16 }}>
              {p.units}
            </Text>
          </View>
        </View>
        {showTarget ? (
          <View style={{ flex: 1.35, gap: 8 }}>
            <FieldLabel state="focus">Target · optional</FieldLabel>
            <View style={{ height: 56, borderRadius: 14, paddingHorizontal: 6, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.accentLine }}>
              <Stepper big label="Target weight" value={p.target == null ? '—' : formatWeight(p.target)} unit={p.units} onMinus={() => p.onTargetStep(-1)} onPlus={() => p.onTargetStep(1)} />
            </View>
          </View>
        ) : null}
      </View>

      {showTarget ? (
        <View style={{ gap: 10 }}>
          <Caption right={<Text color={colors.textMuted} style={{ fontFamily: fonts.bodyBold, fontSize: 12, letterSpacing: 0.96, textTransform: 'uppercase' }}>{`${p.units} / week`}</Text>}>Pace · optional</Caption>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            {PACES.map((x) => {
              const sel = p.pace === x.id;
              const n = p.units === 'lb' ? x.lbPerWeek : Math.round(x.lbPerWeek * 0.45359237 * 100) / 100;
              return (
                <Pressable
                  key={x.id}
                  onPress={() => p.onPace(x.id)}
                  accessibilityRole="radio"
                  accessibilityLabel={`${x.label}, ${n} ${p.units} per week`}
                  accessibilityState={{ selected: sel }}
                  style={{ flex: 1, minHeight: 56, borderRadius: 14, alignItems: 'center', justifyContent: 'center', borderWidth: sel ? 1.5 : 1, borderColor: sel ? colors.accentLine : colors.borderStrong, backgroundColor: sel ? colors.surfaceRaised : 'transparent' }}
                >
                  <Text importantForAccessibility="no" color={colors.text} style={{ fontFamily: fonts.bodyBold, fontSize: 20, lineHeight: 24, fontVariant: ['tabular-nums'] }}>
                    {n.toFixed(n < 0.5 ? 2 : 1)}
                  </Text>
                  <Text importantForAccessibility="no" color={colors.textSecondary} style={{ fontFamily: fonts.body, fontSize: 14, lineHeight: 18 }}>
                    {x.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      ) : null}

      {proj ? (
        <View accessible style={{ flexDirection: 'row', gap: 14, alignItems: 'center', padding: 14, borderRadius: 12, backgroundColor: colors.surfaceRaised }}>
          <Ionicons name="calendar-outline" size={22} color={colors.accentInk} />
          <View style={{ flex: 1 }}>
            <Text color={colors.text} style={{ fontFamily: fonts.bodyBold, fontSize: 15, lineHeight: 20 }}>{`${proj.diff > 0 ? '+' : '−'}${formatWeight(Math.abs(proj.diff))} ${p.units} to go · about ${proj.weeks} weeks`}</Text>
            <Text color={colors.textSecondary} style={{ fontFamily: fonts.bodyMedium, fontSize: 12, lineHeight: 16 }}>{`Projected for ${proj.whenLabel} at ${proj.perWeek} ${p.units} / week`}</Text>
          </View>
        </View>
      ) : null}

      {showTarget ? (
        <View style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start' }}>
          <Ionicons name="information-circle-outline" size={20} color={colors.textMuted} />
          <Text color={colors.textMuted} style={{ flex: 1, fontFamily: fonts.bodyMedium, fontSize: 12, lineHeight: 16 }}>
            {WEIGHT_PACE_NOTE}
          </Text>
        </View>
      ) : null}

      <View style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start' }}>
        <Ionicons name="phone-portrait-outline" size={18} color={colors.accentInk} />
        <Text color={colors.textSecondary} style={{ flex: 1, fontFamily: fonts.bodyMedium, fontSize: 12, lineHeight: 16 }}>
          {WEIGHT_STAYS_ON_DEVICE}
        </Text>
      </View>
      {p.storedOnDevice ? <LinkButton onPress={p.onDeleteWeight}>{DELETE_WEIGHT_LABEL}</LinkButton> : null}
      {p.message ? (
        <Text accessibilityLiveRegion="polite" variant="small" color={colors.danger}>
          {p.message}
        </Text>
      ) : null}
    </OnbScreen>
  );
}

export type GoalMinorProps = {
  picked: MinorGoalId | null;
  onPick: (g: MinorGoalId) => void;
  busy?: boolean;
  message?: string | null;
  onContinue: () => void;
  onSkip: () => void;
  onBack?: () => void;
};

/** Setup · Step 5 of 8, linked 16-17: Counsel's approved minor-safe list. Single pick; Skip or none = Get generally fitter. No weights. [ATTORNEY] */
export function GoalMinorScreen(p: GoalMinorProps) {
  const { colors } = useTheme();
  return (
    <OnbScreen
      onBack={p.onBack}
      onSkip={p.onSkip}
      contentGap={20}
      footer={
        <>
          <PrimaryCta label="Continue" busy={p.busy} onPress={p.onContinue} />
          <FooterHint>Skip uses Get generally fitter.</FooterHint>
        </>
      }
    >
      <StepHeader eyebrow="Setup" current={5} />
      <View style={{ gap: 10 }}>
        <OnbTitle>Your goal</OnbTitle>
        <OnbSub>Optional. You can skip this.</OnbSub>
      </View>
      <View style={{ gap: 12 }}>
        {MINOR_GOALS.map((g) => (
          <OptionCard key={g.id} title={g.label} description={g.description} titleStyle="body" markLeft selected={p.picked === g.id} onPress={() => p.onPick(g.id)} />
        ))}
      </View>
      <Text color={colors.textMuted} style={{ fontSize: 14, lineHeight: 20 }}>
        {MINOR_GOAL_HINT}
      </Text>
      {p.message ? (
        <Text accessibilityLiveRegion="polite" variant="small" color={colors.danger}>
          {p.message}
        </Text>
      ) : null}
    </OnbScreen>
  );
}
