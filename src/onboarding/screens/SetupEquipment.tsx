import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { Text } from '../../components/ui';
import { useTheme } from '../../theme/ThemeProvider';
import {
  EQUIPMENT_GROUPS, GYM_NAME_MAX, MAX_WEIGHT_ITEMS, PRESETS, groupCount, type EquipmentId, type GymDraft, type MaxWeightItem, type PresetId,
} from '../equipment';
import type { Units } from '../prefs';
import { maxDisplay } from '../weightGoal';
import { FieldLabel } from '../ui/Field';
import { FooterHint, OnbScreen } from '../ui/OnbScreen';
import { OnbSub, OnbTitle } from '../ui/OnbText';
import { SelectMark } from '../ui/OptionCard';
import { PillOption } from '../ui/Pills';
import { PrimaryCta } from '../ui/PrimaryCta';
import { Stepper } from '../ui/Stepper';
import { StepHeader } from '../ui/StepHeader';

export type EquipmentProps = {
  gym: GymDraft;
  units: Units;
  /** Shown as "Started from Full gym · edited below" once an edit switched the preset to Custom. */
  startedFrom?: PresetId | null;
  onName: (v: string) => void;
  onPreset: (p: PresetId) => void;
  onToggleItem: (id: EquipmentId) => void;
  onToggleGroup: (groupId: string, on: boolean) => void;
  onMax: (item: MaxWeightItem, dir: 1 | -1) => void;
  /** Initially expanded groups (the first two by default). */
  initiallyOpen?: string[];
  busy?: boolean;
  message?: string | null;
  onContinue: () => void;
  onSkip: () => void;
  onBack?: () => void;
};

const MAX_SUB: Record<MaxWeightItem, string> = { barbell: 'loaded bar, max', dumbbells: 'heaviest', kettlebells: 'heaviest' };

/** Setup · Step 7 of 8: "Your gym". Presets, grouped checklist with select-all and n of N, collapsible groups, max-weight steppers. Skip = Full gym. */
export function EquipmentScreen(p: EquipmentProps) {
  const { colors, fonts } = useTheme();
  const [open, setOpen] = useState<string[]>(p.initiallyOpen ?? ['free_weights', 'racks_benches']);
  const total = p.gym.items.length;
  const presetLabel = (id: PresetId) => PRESETS.find((x) => x.id === id)?.label ?? id;
  return (
    <OnbScreen
      onBack={p.onBack}
      onSkip={p.onSkip}
      contentGap={20}
      footer={
        <>
          <PrimaryCta label="Continue" busy={p.busy} onPress={p.onContinue} />
          <FooterHint>Skip uses Full gym · 31 of 31 items</FooterHint>
        </>
      }
    >
      <StepHeader eyebrow="Setup" current={7} />
      <View style={{ gap: 10 }}>
        <OnbTitle>Your gym</OnbTitle>
        <OnbSub>Pick what your gym has. Plans and swaps only use this equipment. Change it anytime in Profile.</OnbSub>
      </View>
      <View style={{ gap: 8 }}>
        <FieldLabel>Gym name</FieldLabel>
        <View style={{ height: 56, borderRadius: 14, paddingHorizontal: 16, justifyContent: 'center', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }}>
          <TextInput
            value={p.gym.name}
            onChangeText={(v) => p.onName(v.replace(/[\u0000-\u001f]/g, '').slice(0, GYM_NAME_MAX))}
            accessibilityLabel="Gym name"
            maxLength={GYM_NAME_MAX}
            placeholder="Main gym"
            placeholderTextColor={colors.placeholder}
            style={[{ color: colors.text, fontFamily: fonts.bodyMedium, fontSize: 18, height: 56 }, { outlineStyle: 'none' } as object]}
          />
        </View>
      </View>
      <View style={{ gap: 10 }}>
        <FieldLabel>Start from</FieldLabel>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
          {PRESETS.map((x) => (
            <PillOption key={x.id} label={x.label} check selected={p.gym.preset === x.id} onPress={() => p.onPreset(x.id)} />
          ))}
        </View>
        {p.gym.preset === 'custom' && p.startedFrom && p.startedFrom !== 'custom' ? (
          <Text color={colors.textMuted} style={{ fontFamily: fonts.bodyMedium, fontSize: 12 }}>{`Started from ${presetLabel(p.startedFrom)} · edited below`}</Text>
        ) : null}
      </View>

      {EQUIPMENT_GROUPS.map((g) => {
        const { have, total: n } = groupCount(p.gym, g.id);
        const expanded = open.includes(g.id);
        const all = have === n;
        if (!expanded) {
          const names = g.items.filter((i) => p.gym.items.includes(i.id)).map((i) => i.label).join(', ');
          return (
            <Pressable
              key={g.id}
              onPress={() => setOpen([...open, g.id])}
              accessibilityRole="button"
              accessibilityState={{ expanded: false }}
              accessibilityLabel={`${g.label}, ${have} of ${n} selected. Expand`}
              style={{ borderRadius: 16, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12 }}
            >
              <View style={{ flex: 1, gap: 4 }}>
                <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 10 }}>
                  <Text importantForAccessibility="no" color={colors.text} style={{ fontFamily: fonts.displayBold, fontSize: 22, lineHeight: 26, textTransform: 'uppercase' }}>{g.label}</Text>
                  <Text importantForAccessibility="no" color={colors.textMuted} style={{ fontFamily: fonts.bodyMedium, fontSize: 14 }}>{`${have} of ${n}`}</Text>
                </View>
                <Text importantForAccessibility="no" numberOfLines={1} color={colors.textSecondary} style={{ fontFamily: fonts.bodyMedium, fontSize: 14 }}>{names || 'None selected'}</Text>
              </View>
              <Ionicons name="chevron-down" size={20} color={colors.textSecondary} />
            </Pressable>
          );
        }
        return (
          <View key={g.id} style={{ gap: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Pressable onPress={() => setOpen(open.filter((x) => x !== g.id))} accessibilityRole="button" accessibilityState={{ expanded: true }} accessibilityLabel={`${g.label}, ${have} of ${n} selected. Collapse`} style={{ flexDirection: 'row', alignItems: 'baseline', gap: 10 }}>
                <Text importantForAccessibility="no" color={colors.text} style={{ fontFamily: fonts.displayBold, fontSize: 22, lineHeight: 26, textTransform: 'uppercase' }}>{g.label}</Text>
                <Text importantForAccessibility="no" color={colors.textMuted} style={{ fontFamily: fonts.bodyMedium, fontSize: 14 }}>{`${have} of ${n}`}</Text>
              </Pressable>
              <Pressable onPress={() => p.onToggleGroup(g.id, !all)} accessibilityRole="checkbox" accessibilityState={{ checked: all }} accessibilityLabel={`Select all ${g.label}`} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }} hitSlop={8}>
                <SelectMark selected={all} size={24} square />
                <Text importantForAccessibility="no" color={colors.accentInk} style={{ fontFamily: fonts.bodyBold, fontSize: 12, letterSpacing: 0.96, textTransform: 'uppercase' }}>{all ? 'All selected' : 'Select all'}</Text>
              </Pressable>
            </View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
              {g.items.map((it) => {
                const on = p.gym.items.includes(it.id);
                const isMax = (MAX_WEIGHT_ITEMS as readonly string[]).includes(it.id);
                const cell = (
                  <Pressable
                    onPress={() => p.onToggleItem(it.id)}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: on }}
                    accessibilityLabel={it.label}
                    style={{ flex: isMax ? 1 : undefined, flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: isMax ? 0 : 14 }}
                  >
                    <SelectMark selected={on} size={26} square />
                    <View style={{ flex: 1 }}>
                      <Text importantForAccessibility="no" color={on ? colors.text : colors.textSecondary} style={{ fontFamily: fonts.bodySemi, fontSize: 16, lineHeight: 22 }}>{it.label}</Text>
                      {isMax ? <Text importantForAccessibility="no" color={colors.textMuted} style={{ fontFamily: fonts.bodyMedium, fontSize: 14 }}>{MAX_SUB[it.id as MaxWeightItem]}</Text> : null}
                    </View>
                  </Pressable>
                );
                const box = { borderRadius: 14, borderWidth: on ? 1.5 : 1, borderColor: on ? colors.accentLine : colors.border, backgroundColor: on ? colors.surface : colors.surfaceSunken, paddingHorizontal: 14 } as const;
                if (isMax) {
                  const v = p.gym.maxes[it.id as MaxWeightItem];
                  return (
                    <View key={it.id} style={[box, { width: '100%', minHeight: 78, flexDirection: 'row', alignItems: 'center', gap: 8 }]}>
                      {cell}
                      {on && v != null ? <Stepper label={`${it.label} max`} value={String(maxDisplay(v, p.units))} unit={p.units} onMinus={() => p.onMax(it.id as MaxWeightItem, -1)} onPlus={() => p.onMax(it.id as MaxWeightItem, 1)} /> : null}
                    </View>
                  );
                }
                return (
                  <View key={it.id} style={[box, { width: '48%', flexGrow: 1, minHeight: 64, justifyContent: 'center' }]}>
                    {cell}
                  </View>
                );
              })}
            </View>
          </View>
        );
      })}
      <Text color={colors.textMuted} style={{ fontFamily: fonts.bodyMedium, fontSize: 12 }}>{`${total} of 31 items selected`}</Text>
      {p.message ? (
        <Text accessibilityLiveRegion="polite" variant="small" color={colors.danger}>
          {p.message}
        </Text>
      ) : null}
    </OnbScreen>
  );
}
