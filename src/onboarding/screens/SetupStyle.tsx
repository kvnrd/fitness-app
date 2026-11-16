import { useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '../../components/ui';
import { useTheme } from '../../theme/ThemeProvider';
import type { Units } from '../prefs';
import {
  BODY_FOCUS, CROSSFIT_LEVELS, DAYS_MAX, DAYS_MIN, HYROX_DIVISIONS, STYLES, followupSections, type BodyFocus, type CrossfitLevel, type Followups,
  type HyroxDivision, type Maxes, type StyleId, type StyleSelection,
} from '../styles';
import { fromLb, toLb } from '../weightGoal';
import { FooterHint, OnbScreen } from '../ui/OnbScreen';
import { OnbSub, OnbTitle } from '../ui/OnbText';
import { OptionCard, Tag } from '../ui/OptionCard';
import { Caption, PillOption } from '../ui/Pills';
import { PrimaryCta } from '../ui/PrimaryCta';
import { Slider } from '../ui/Slider';
import { StepHeader } from '../ui/StepHeader';

const ICONS: Record<StyleId, keyof typeof Ionicons.glyphMap> = {
  hybrid: 'sync-outline',
  hyrox: 'flag-outline',
  bodybuilding: 'barbell-outline',
  powerlifting: 'barbell-outline',
  crossfit: 'grid-outline',
  general: 'heart-outline',
};
const label = (id: StyleId) => STYLES.find((s) => s.id === id)?.label ?? id;

export type StyleProps = {
  selection: StyleSelection;
  onToggle: (id: StyleId) => void;
  onSetMain: (id: StyleId) => void;
  busy?: boolean;
  message?: string | null;
  onContinue: () => void;
  onSkip: () => void;
  onBack?: () => void;
};

/** Setup · Step 6 of 8: "How do you want to train?" Multi-select, first pick = Main. Skip = General fitness, 4 days. */
export function StyleScreen(p: StyleProps) {
  const { colors, fonts } = useTheme();
  const n = p.selection.styles.length;
  const ok = n > 0 && p.selection.main != null;
  return (
    <OnbScreen
      onBack={p.onBack}
      onSkip={p.onSkip}
      contentGap={20}
      footer={
        <>
          <PrimaryCta label="Continue" disabled={!ok} busy={p.busy} onPress={p.onContinue} />
          <FooterHint>{ok ? '' : 'Pick at least one style, or skip · Skip uses General fitness'}</FooterHint>
        </>
      }
    >
      <StepHeader eyebrow="Setup" current={6} />
      <View style={{ gap: 10 }}>
        <OnbTitle>How do you want to train?</OnbTitle>
        <OnbSub>Pick one or more. The first becomes your main style — tap Set as main to change it. You can change this later in Profile.</OnbSub>
      </View>
      <View style={{ gap: 10 }}>
        {STYLES.map((s) => {
          const sel = p.selection.styles.includes(s.id);
          const main = p.selection.main === s.id;
          return (
            <OptionCard
              key={s.id}
              title={s.label}
              description={s.description}
              icon={ICONS[s.id]}
              selected={sel}
              onPress={() => p.onToggle(s.id)}
              badge={
                sel ? (
                  main ? (
                    <Tag accent>Main</Tag>
                  ) : (
                    <Pressable onPress={() => p.onSetMain(s.id)} accessibilityRole="button" accessibilityLabel={`Set ${s.label} as main`} hitSlop={8}>
                      <Text importantForAccessibility="no" color={colors.accentInk} style={{ fontFamily: fonts.bodyBold, fontSize: 12, letterSpacing: 0.9, textTransform: 'uppercase' }}>
                        Set as main
                      </Text>
                    </Pressable>
                  )
                ) : null
              }
            />
          );
        })}
      </View>
      {ok ? (
        <Text color={colors.textMuted} style={{ fontFamily: fonts.bodyMedium, fontSize: 14, lineHeight: 20 }}>
          {`${n} style${n === 1 ? '' : 's'} · ${label(p.selection.main as StyleId)} is main${n > 1 ? ' and leads your plan' : ''}`}
        </Text>
      ) : null}
      {p.message ? (
        <Text accessibilityLiveRegion="polite" variant="small" color={colors.danger}>
          {p.message}
        </Text>
      ) : null}
    </OnbScreen>
  );
}

export type FollowupsProps = {
  selection: StyleSelection;
  followups: Followups;
  units: Units;
  onChange: (f: Followups) => void;
  busy?: boolean;
  message?: string | null;
  onContinue: () => void;
  onSkip: () => void;
  onBack?: () => void;
};

function Card({ title, main, children }: { title: string; main?: boolean; children: React.ReactNode }) {
  const { colors, fonts } = useTheme();
  return (
    <View style={{ borderRadius: 20, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, padding: 16, gap: 14 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <Text accessibilityRole="header" color={colors.text} style={{ fontFamily: fonts.displayBold, fontSize: 20, lineHeight: 24, textTransform: 'uppercase' }}>
          {title}
        </Text>
        {main ? <Tag accent>Main</Tag> : null}
      </View>
      {children}
    </View>
  );
}

const isoOk = (t: string): boolean => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(t);
  if (!m) return false;
  const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
  return d.getUTCFullYear() === +m[1] && d.getUTCMonth() === +m[2] - 1 && d.getUTCDate() === +m[3];
};

/** Setup · Step 6 of 8 (follow-ups, same step): only the picked styles, plus days per week. */
export function FollowupsScreen(p: FollowupsProps) {
  const { colors, fonts } = useTheme();
  const f = p.followups;
  const set = (patch: Partial<Followups>) => p.onChange({ ...f, ...patch });
  const sections = followupSections(p.selection);
  const summary = p.selection.styles.map((s) => (s === p.selection.main && p.selection.styles.length > 1 ? `${label(s)} (main)` : label(s))).join(' · ');
  const [dateText, setDateText] = useState(f.hyroxRaceDate ?? '');
  const maxText = (v: number | null) => (v == null ? '' : String(Math.round(fromLb(v, p.units))));
  const setMax = (k: keyof Maxes, text: string) => {
    const n = Number(text.replace(',', '.'));
    const lb = text.trim() && Number.isFinite(n) && n > 0 ? Math.round(toLb(n, p.units)) : null;
    set({ powerMaxes: { ...f.powerMaxes, [k]: lb } });
  };
  return (
    <OnbScreen
      onBack={p.onBack}
      onSkip={p.onSkip}
      contentGap={20}
      footer={
        <>
          <PrimaryCta label="Continue" busy={p.busy} onPress={p.onContinue} />
          <FooterHint>Skip uses the defaults shown</FooterHint>
        </>
      }
    >
      <StepHeader eyebrow="Setup" current={6} />
      <View style={{ gap: 10 }}>
        <OnbTitle>A few details</OnbTitle>
        <OnbSub>Only the styles you picked. Skip keeps the defaults shown, and you can change any of this later in Profile.</OnbSub>
      </View>
      <Text color={colors.textMuted} style={{ fontFamily: fonts.bodyMedium, fontSize: 14, lineHeight: 20 }}>
        {summary}
      </Text>
      <View style={{ gap: 10 }}>
        <Caption right={<Text color={colors.textMuted} style={{ fontFamily: fonts.bodyBold, fontSize: 12, letterSpacing: 0.96, textTransform: 'uppercase' }}>All styles</Text>}>Days per week</Caption>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          {Array.from({ length: DAYS_MAX - DAYS_MIN + 1 }, (_, i) => DAYS_MIN + i).map((d) => (
            <PillOption key={d} label={String(d)} flex tall selected={f.daysPerWeek === d} onPress={() => set({ daysPerWeek: d })} />
          ))}
        </View>
      </View>

      {sections.includes('hybrid') ? (
        <Card title="Hybrid" main={p.selection.main === 'hybrid'}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text color={colors.text} style={{ fontFamily: fonts.bodySemi, fontSize: 16 }}>Run / lift balance</Text>
            <Text color={colors.text} style={{ fontFamily: fonts.bodySemi, fontSize: 16, fontVariant: ['tabular-nums'] }}>{`${f.hybridRunPct} / ${100 - f.hybridRunPct}`}</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Text color={colors.textMuted} style={{ fontFamily: fonts.bodyBold, fontSize: 12, letterSpacing: 0.96 }}>RUN</Text>
            <Slider label="Run and lift balance" value={f.hybridRunPct} onChange={(v) => set({ hybridRunPct: v })} />
            <Text color={colors.textMuted} style={{ fontFamily: fonts.bodyBold, fontSize: 12, letterSpacing: 0.96 }}>LIFT</Text>
          </View>
          <Text color={colors.textSecondary} style={{ fontFamily: fonts.bodyMedium, fontSize: 14 }}>
            {f.hybridRunPct === 50 ? 'Even split. Drag toward the work you want more of.' : f.hybridRunPct > 50 ? 'Leaning toward running.' : 'Leaning toward lifting.'}
          </Text>
        </Card>
      ) : null}

      {sections.includes('hyrox') ? (
        <Card title="Hyrox" main={p.selection.main === 'hyrox'}>
          <View style={{ gap: 8 }}>
            <Caption>Race date · optional</Caption>
            <View style={{ height: 52, borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, backgroundColor: colors.surfaceSunken, borderWidth: 1, borderColor: colors.border }}>
              <Ionicons name="calendar-outline" size={18} color={colors.textSecondary} />
              <TextInput
                value={dateText}
                onChangeText={(t) => {
                  const v = t.replace(/[^0-9-]/g, '').slice(0, 10);
                  setDateText(v);
                  set({ hyroxRaceDate: isoOk(v) ? v : null });
                }}
                accessibilityLabel="Race date, year-month-day"
                placeholder="Add a date (YYYY-MM-DD)"
                placeholderTextColor={colors.placeholder}
                inputMode="numeric"
                maxLength={10}
                style={[{ flex: 1, height: 52, color: colors.text, fontFamily: fonts.bodyMedium, fontSize: 16 }, { outlineStyle: 'none' } as object]}
              />
            </View>
          </View>
          <View style={{ gap: 8 }}>
            <Caption>Division</Caption>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              {HYROX_DIVISIONS.map((d: HyroxDivision) => (
                <PillOption key={d} label={d === 'open' ? 'Open' : d === 'pro' ? 'Pro' : 'Doubles'} flex selected={f.hyroxDivision === d} onPress={() => set({ hyroxDivision: d })} />
              ))}
            </View>
          </View>
        </Card>
      ) : null}

      {sections.includes('bodybuilding') ? (
        <Card title="Bodybuilding" main={p.selection.main === 'bodybuilding'}>
          <Caption>Focus areas · pick any</Caption>
          <PillOption label="Balanced" check selected={f.bodyFocus.length === 0} onPress={() => set({ bodyFocus: [] })} flex />
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
            {BODY_FOCUS.map((b: BodyFocus) => (
              <View key={b} style={{ width: '31%', flexGrow: 1 }}>
                <PillOption
                  label={b.charAt(0).toUpperCase() + b.slice(1)}
                  selected={f.bodyFocus.includes(b)}
                  onPress={() => set({ bodyFocus: BODY_FOCUS.filter((x) => (x === b ? !f.bodyFocus.includes(b) : f.bodyFocus.includes(x))) })}
                  flex
                />
              </View>
            ))}
          </View>
        </Card>
      ) : null}

      {sections.includes('powerlifting') ? (
        <Card title="Powerlifting" main={p.selection.main === 'powerlifting'}>
          <View style={{ gap: 8 }}>
            <Caption>Do you compete?</Caption>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <PillOption label="No" flex selected={!f.powerCompete} onPress={() => set({ powerCompete: false })} />
              <PillOption label="Yes" flex selected={f.powerCompete} onPress={() => set({ powerCompete: true })} />
            </View>
          </View>
          <View style={{ gap: 8 }}>
            <Caption>{`Current maxes · optional · ${p.units}`}</Caption>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              {(['squat', 'bench', 'deadlift'] as const).map((k) => (
                <View key={k} style={{ flex: 1, gap: 6 }}>
                  <TextInput
                    key={`${k}-${p.units}`}
                    defaultValue={maxText(f.powerMaxes[k])}
                    onChangeText={(t) => setMax(k, t.replace(/[^0-9.,]/g, '').slice(0, 5))}
                    accessibilityLabel={`${k} max in ${p.units}`}
                    placeholder="—"
                    placeholderTextColor={colors.placeholder}
                    inputMode="decimal"
                    keyboardType="decimal-pad"
                    maxLength={5}
                    style={[{ height: 48, borderRadius: 12, textAlign: 'center', color: colors.text, fontFamily: fonts.bodyBold, fontSize: 18, backgroundColor: colors.surfaceSunken, borderWidth: 1, borderColor: colors.border }, { outlineStyle: 'none' } as object]}
                  />
                  <Text color={colors.textMuted} style={{ textAlign: 'center', fontFamily: fonts.bodyMedium, fontSize: 12, textTransform: 'capitalize' }}>{k}</Text>
                </View>
              ))}
            </View>
          </View>
        </Card>
      ) : null}

      {sections.includes('crossfit') ? (
        <Card title="CrossFit-style" main={p.selection.main === 'crossfit'}>
          <Caption>Experience</Caption>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            {CROSSFIT_LEVELS.map((l: CrossfitLevel) => (
              <PillOption key={l} label={l === 'beginner' ? 'Beginner' : l === 'intermediate' ? 'Intermediate' : 'Experienced'} flex selected={f.crossfitLevel === l} onPress={() => set({ crossfitLevel: l })} />
            ))}
          </View>
        </Card>
      ) : null}
      {p.message ? (
        <Text accessibilityLiveRegion="polite" variant="small" color={colors.danger}>
          {p.message}
        </Text>
      ) : null}
    </OnbScreen>
  );
}
