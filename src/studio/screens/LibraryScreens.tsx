import { Switch, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '../../components/ui';
import { useTheme } from '../../theme/ThemeProvider';
import {
  Avatar,
  BackRow,
  Caption,
  EmptyState,
  EqualRow,
  Field,
  GlassCard,
  Phase6Shell,
  PrimaryButton,
  SettingsRow,
  TextLink,
} from '../chrome';

function Figure({ w = 48, h = 48 }: { w?: number; h?: number }) {
  const { colors } = useTheme();
  return (
    <View style={{ width: w, height: h, borderRadius: 14, backgroundColor: colors.surfaceRaised }} />
  );
}

function Chip({ label, on }: { label: string; on?: boolean }) {
  const { colors } = useTheme();
  return (
    <View style={{ height: 32, borderRadius: 16, paddingHorizontal: 10, justifyContent: 'center', backgroundColor: on ? colors.tabOn : colors.glass, borderWidth: 1, borderColor: on ? colors.tabOn : colors.glassBorder }}>
      <Text variant="label" color={on ? colors.tabOnText : colors.text} style={{ fontWeight: '700' }}>{label}</Text>
    </View>
  );
}

export function LibraryBrowseScreen({ mine = false, empty = false }: { mine?: boolean; empty?: boolean }) {
  const { colors } = useTheme();
  return (
    <Phase6Shell tab={3}>
      <BackRow title="Studio" />
      <Text variant="small" color={colors.textMuted}>{mine ? '640 default · 7 yours' : empty ? '640 default · 0 yours' : '640 default · 7 yours'}</Text>
      <Text variant="title" accessibilityRole="header">Exercise library</Text>
      <GlassCard>
        <View style={{ height: 44, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Ionicons name="search" size={20} color={colors.textMuted} />
          <Text variant="body" color={colors.textMuted}>Search 640 exercises</Text>
        </View>
      </GlassCard>
      <View style={{ flexDirection: 'row', gap: 6, marginTop: 12 }}>
        <Chip label="All" on={!mine && !empty} />
        <Chip label="Default" />
        <Chip label="My exercises" on={mine || empty} />
      </View>
      {empty ? (
        <EmptyState title="Nothing custom yet" body="Custom exercises stay private to you and your current clients. Only they will see them." cta="Create exercise" alt="Duplicate a default" />
      ) : (
        <>
          {[
            ['Barbell bench press', 'Barbell · Push · Chest, triceps', 'Default'],
            ['Half-kneeling landmine press', 'Landmine · Push · Shoulders', 'My exercise'],
            ['Incline dumbbell press', 'Dumbbells · Push · Upper chest', 'Default'],
          ].filter((row, i) => !mine || i === 1 || !mine).map(([n, m, b]) => (
            <GlassCard key={n}>
              <View style={{ padding: 12, flexDirection: 'row', gap: 12, alignItems: 'center' }}>
                <Figure />
                <View style={{ flex: 1 }}>
                  <Text variant="body">{n}</Text>
                  <Text variant="label" color={colors.textMuted}>{m}</Text>
                </View>
                <Chip label={b} />
              </View>
            </GlassCard>
          ))}
        </>
      )}
    </Phase6Shell>
  );
}

export function LibraryDetailScreen() {
  const { colors } = useTheme();
  return (
    <Phase6Shell tab={3}>
      <BackRow title="Library" rightLabel="Edit" />
      <Figure w={72} h={72} />
      <Text variant="title" accessibilityRole="header" style={{ marginTop: 6 }}>Barbell bench press</Text>
      <Text variant="small" color={colors.textMuted}>Barbell · Push · Chest, triceps</Text>
      <View style={{ flexDirection: 'row', gap: 6, marginTop: 12 }}>
        {['Front', 'Side', '3/4'].map((p, i) => <Chip key={p} label={p} on={i === 0} />)}
      </View>
      <GlassCard style={{ height: 160, marginTop: 12, borderRadius: 20 }} />
      <PrimaryButton label="Use in a plan" />
      <TextLink label="Edit cues" />
    </Phase6Shell>
  );
}

export function EditCuesScreen() {
  const { colors } = useTheme();
  return (
    <Phase6Shell tab={3}>
      <BackRow title="Bench press" rightLabel="Save" />
      <Text variant="title" accessibilityRole="header">Edit cues</Text>
      <Text variant="small" color={colors.textMuted} style={{ marginTop: 8 }}>Cues you write here show on the client’s set card. Keep them short.</Text>
      <Field label="Setup" value="Eyes under the bar. Plant your feet." />
      <Field label="During the set" value="Lower with control. Drive up." />
      <PrimaryButton label="Save cues" />
    </Phase6Shell>
  );
}

export function CreateBasicsScreen() {
  const { colors } = useTheme();
  return (
    <Phase6Shell tab={3}>
      <BackRow title="Library" />
      <Caption style={{ marginTop: 8 }}>Step 1 of 3</Caption>
      <Text variant="title" accessibilityRole="header">New exercise</Text>
      <Field label="Name" value="Half-kneeling landmine press" />
      <Field label="Equipment" value="Landmine" />
      <Field label="Pattern" value="Push" />
      <PrimaryButton label="Continue" />
    </Phase6Shell>
  );
}

export function CreateTrackingScreen() {
  const { colors } = useTheme();
  return (
    <Phase6Shell tab={3}>
      <BackRow title="New exercise" />
      <Caption style={{ marginTop: 8 }}>Step 2 of 3</Caption>
      <Text variant="title" accessibilityRole="header">What clients log</Text>
      <Text variant="small" color={colors.textMuted} style={{ marginTop: 8 }}>Pick how this exercise is tracked. You can change this later.</Text>
      <GlassCard>
        <SettingsRow first icon="barbell-outline" label="Weight and reps" sub="Most strength work" accentChevron />
        <SettingsRow icon="time-outline" label="Time" sub="Holds, carries, cardio" />
        <SettingsRow icon="analytics-outline" label="Distance or calories" />
      </GlassCard>
      <PrimaryButton label="Continue" />
    </Phase6Shell>
  );
}

export function CreateDemoScreen() {
  const { colors } = useTheme();
  return (
    <Phase6Shell tab={3}>
      <BackRow title="New exercise" />
      <Caption style={{ marginTop: 8 }}>Step 3 of 3</Caption>
      <Text variant="title" accessibilityRole="header">Add a demo</Text>
      <Text variant="small" color={colors.textMuted} style={{ marginTop: 8 }}>A short demo helps clients see the movement. You can skip this and add one later.</Text>
      <PrimaryButton label="Record a demo" />
      <EqualRow left="Upload a video" right="Skip for now" />
    </Phase6Shell>
  );
}

/** Camera chrome is always dark, in both themes. Copy and layout follow the rev 3 mockup. */
export function RecordDemoScreen() {
  return (
    <View style={{ flex: 1, backgroundColor: '#070A16', minHeight: '100%' }}>
      <View style={{ paddingTop: 62, paddingHorizontal: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <View style={{ height: 32, borderRadius: 16, paddingHorizontal: 10, gap: 6, backgroundColor: '#3A1020', flexDirection: 'row', alignItems: 'center' }}>
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#FE7E70' }} />
          <Text variant="label" color="#F1F4FF" style={{ fontWeight: '700' }}>00:12 / 00:30</Text>
        </View>
        <View style={{ height: 32, borderRadius: 16, paddingHorizontal: 12, justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.10)' }}>
          <Text variant="label" color="#F1F4FF" style={{ fontWeight: '700' }}>Sound off</Text>
        </View>
      </View>
      <View style={{ marginTop: 12, alignSelf: 'center', height: 28, borderRadius: 14, paddingHorizontal: 12, justifyContent: 'center', backgroundColor: 'rgba(7,10,22,0.82)' }}>
        <Text variant="label" color="#F1F4FF" style={{ fontWeight: '700' }}>Side view · keep your whole body in the box</Text>
      </View>
      <View pointerEvents="none" style={{ position: 'absolute', left: 36, right: 36, top: 150, bottom: 210, borderWidth: 1.5, borderStyle: 'dashed', borderColor: '#8FA3FF', borderRadius: 8 }} />
      <View style={{ position: 'absolute', left: 28, top: 142, width: 18, height: 18, borderTopWidth: 2, borderLeftWidth: 2, borderColor: '#8FA3FF' }} />
      <View style={{ position: 'absolute', right: 28, top: 142, width: 18, height: 18, borderTopWidth: 2, borderRightWidth: 2, borderColor: '#8FA3FF' }} />
      <View style={{ position: 'absolute', left: 28, bottom: 202, width: 18, height: 18, borderBottomWidth: 2, borderLeftWidth: 2, borderColor: '#8FA3FF' }} />
      <View style={{ position: 'absolute', right: 28, bottom: 202, width: 18, height: 18, borderBottomWidth: 2, borderRightWidth: 2, borderColor: '#8FA3FF' }} />
      <View style={{ position: 'absolute', left: '50%', top: 210, marginLeft: -22, width: 44, height: 44, borderRadius: 22, backgroundColor: '#5B6690' }} />
      <View style={{ position: 'absolute', left: '50%', top: 260, marginLeft: -45, width: 90, height: 200, borderRadius: 40, backgroundColor: '#5B6690', opacity: 0.9 }} />
      <View style={{ position: 'absolute', left: 20, bottom: 150 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, height: 28, borderRadius: 14, paddingHorizontal: 10, backgroundColor: 'rgba(7,10,22,0.82)', alignSelf: 'flex-start' }}>
          <Ionicons name="checkmark-circle" size={16} color="#A9BAFF" />
          <Text variant="label" color="#F1F4FF">Whole body in frame</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, height: 28, borderRadius: 14, paddingHorizontal: 10, backgroundColor: 'rgba(7,10,22,0.82)', alignSelf: 'flex-start', marginTop: 6 }}>
          <Ionicons name="checkmark-circle" size={16} color="#A9BAFF" />
          <Text variant="label" color="#F1F4FF">No one else in shot</Text>
        </View>
      </View>
      <View style={{ position: 'absolute', left: 20, right: 20, bottom: 118, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.16)' }}>
        <View style={{ width: '40%', height: 4, borderRadius: 2, backgroundColor: '#8FA3FF' }} />
      </View>
      <View style={{ position: 'absolute', left: '50%', bottom: 36, marginLeft: -36, width: 72, height: 72, borderRadius: 36, borderWidth: 3, borderColor: '#F1F4FF', alignItems: 'center', justifyContent: 'center' }}>
        <View style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: '#FE7E70' }} />
      </View>
      <Text variant="label" color="#AEB6D4" style={{ position: 'absolute', left: 20, right: 20, bottom: 14, textAlign: 'center' }}>
        Demo for Half-kneeling landmine press
      </Text>
    </View>
  );
}

export function TrimDemoScreen() {
  const { colors } = useTheme();
  return (
    <Phase6Shell tab={3}>
      <BackRow title="New exercise" />
      <Text variant="title" accessibilityRole="header">Trim your demo</Text>
      <Text variant="small" color={colors.textMuted} style={{ marginTop: 4 }}>9 seconds selected · 0:02–0:11 of 0:12. Max 30 seconds. Loop is on for clients.</Text>
      <View style={{ height: 280, borderRadius: 24, backgroundColor: colors.glass, marginTop: 14, overflow: 'hidden', position: 'relative' }}>
        <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surfaceRaised, position: 'absolute', left: '50%', top: 56, marginLeft: -20 }} />
        <View style={{ width: 86, height: 150, borderRadius: 32, backgroundColor: colors.surfaceRaised, position: 'absolute', left: '50%', top: 104, marginLeft: -43 }} />
        <View accessibilityRole="button" accessibilityLabel="Play" style={{ position: 'absolute', left: '50%', top: '50%', marginLeft: -28, marginTop: -28, width: 56, height: 56, borderRadius: 28, backgroundColor: colors.tabOn, alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="play" size={24} color={colors.tabOnText} />
        </View>
      </View>
      <View style={{ flexDirection: 'row', gap: 4, marginTop: 12 }}>
        {Array.from({ length: 10 }, (_, i) => (
          <View
            key={i}
            style={{
              flex: 1,
              height: 44,
              borderRadius: 8,
              backgroundColor: colors.glass,
              opacity: 2 <= i && i <= 6 ? 1 : 0.55,
              borderWidth: 2 <= i && i <= 6 ? 2 : 0,
              borderColor: colors.accent,
            }}
          />
        ))}
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
        <Text variant="label" color={colors.textMuted}>0:00</Text>
        <Text variant="label" color={colors.textMuted}>0:12</Text>
      </View>
      <GlassCard style={{ borderRadius: 20, marginTop: 12 }}>
        <View style={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 0 }}>
          <View style={{ height: 48, flexDirection: 'row', alignItems: 'center' }}>
            <Text variant="body" style={{ flex: 1 }}>Loop for clients</Text>
            <Switch value accessibilityLabel="Loop for clients" onValueChange={() => undefined} trackColor={{ false: colors.borderStrong, true: colors.accent }} thumbColor={colors.accentText} />
          </View>
          <View style={{ height: 48, flexDirection: 'row', alignItems: 'center', borderTopWidth: 1, borderTopColor: colors.glassBorder }}>
            <Text variant="body" style={{ flex: 1 }}>Sound off</Text>
            <Switch value={false} accessibilityLabel="Sound off" onValueChange={() => undefined} trackColor={{ false: colors.borderStrong, true: colors.accent }} thumbColor={colors.surfaceRaised} />
          </View>
          <Text variant="label" color={colors.textMuted} style={{ paddingTop: 4, paddingBottom: 8 }}>Location data removed. Clients see it after an automatic check, usually within a minute.</Text>
        </View>
      </GlassCard>
      <PrimaryButton label="Use this demo" />
    </Phase6Shell>
  );
}

export function DemoPendingScreen() {
  const { colors } = useTheme();
  return (
    <Phase6Shell tab={3}>
      <BackRow title="Library" />
      <Text variant="title" accessibilityRole="header">Checking your demo</Text>
      <Text variant="small" color={colors.textMuted} style={{ marginTop: 8 }}>We’re reviewing this video before clients can see it. That usually takes a little while. You can keep editing cues in the meantime.</Text>
      <PrimaryButton label="Back to library" />
    </Phase6Shell>
  );
}

function DemoStage({ active = 'Side', height = 132 }: { active?: 'Front' | 'Side' | '3/4'; height?: number }) {
  const { colors } = useTheme();
  return (
    <GlassCard style={{ borderRadius: 24, marginTop: 12 }}>
      <View style={{ padding: 12 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text variant="label" color={colors.textMuted}>Demo · loop</Text>
          <View style={{ flexDirection: 'row', gap: 6 }}>
            {(['Front', 'Side', '3/4'] as const).map((p) => <Chip key={p} label={p} on={p === active} />)}
          </View>
        </View>
        <View style={{ height, borderRadius: 20, backgroundColor: colors.glass, marginTop: 10, overflow: 'hidden', position: 'relative' }}>
          <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: colors.surfaceRaised, position: 'absolute', left: '50%', top: 28, marginLeft: -18 }} />
          <View style={{ width: 70, height: 88, borderRadius: 20, backgroundColor: colors.surfaceRaised, position: 'absolute', left: '50%', top: 68, marginLeft: -35 }} />
        </View>
        <View style={{ flexDirection: 'row', gap: 10, marginTop: 10, alignItems: 'center' }}>
          <Ionicons name="pause" size={20} color={colors.text} accessibilityLabel="Pause" />
          <View style={{ flex: 1, height: 4, borderRadius: 2, backgroundColor: colors.track }}>
            <View style={{ width: '38%', height: 4, borderRadius: 2, backgroundColor: colors.accent }} />
          </View>
          <Text variant="label" color={colors.textMuted}>0.5×</Text>
        </View>
      </View>
    </GlassCard>
  );
}

export function ClientViewCustomScreen({ embedded = false }: { embedded?: boolean }) {
  const { colors } = useTheme();
  const cues = [
    'Ribcage stacked, front knee tracks over mid-foot.',
    'Press the landmine away, don’t lean into it.',
  ];
  const body = (
    <>
      <BackRow title="Upper Push" right={<Ionicons name="flag-outline" size={20} color={colors.text} accessibilityLabel="Report" />} />
      <View style={{ flexDirection: 'row', gap: 6, marginTop: 8, alignItems: 'center' }}>
        <Chip label="From Coach Alex" />
        <Text variant="label" color={colors.textMuted}>Custom exercise</Text>
      </View>
      <Text variant="title" accessibilityRole="header" style={{ marginTop: 6 }}>Half-kneeling landmine press</Text>
      <Text variant="small" color={colors.textMuted}>3 × 8 / side · RPE 7</Text>
      <DemoStage active="Side" height={132} />
      <View style={{ flexDirection: 'row', gap: 8, marginTop: 8, alignItems: 'center' }}>
        <Avatar initials="AR" size={28} />
        <Text variant="label" color={colors.textMuted} style={{ flex: 1 }}>Alex’s demo · visible to Alex’s clients only</Text>
      </View>
      <GlassCard style={{ borderRadius: 24, marginTop: 12 }}>
        <View style={{ paddingHorizontal: 16, paddingVertical: 14 }}>
          <Text variant="bodyStrong">Cues · By Alex</Text>
          {cues.map((c, i) => (
            <View key={c} style={{ flexDirection: 'row', gap: 10, paddingVertical: 6, alignItems: 'flex-start' }}>
              <Text variant="heading" color={colors.accentInk} style={{ width: 28 }}>{`0${i + 1}`}</Text>
              <Text variant="body" style={{ flex: 1 }}>{c}</Text>
            </View>
          ))}
        </View>
      </GlassCard>
      <GlassCard style={{ borderRadius: 20, marginTop: 8 }}>
        <View style={{ paddingHorizontal: 16, paddingVertical: 14 }}>
          <Text variant="body">You’ll log</Text>
          <Text variant="small" color={colors.textMuted} style={{ marginTop: 4 }}>Weight · reps · RPE · per side</Text>
        </View>
      </GlassCard>
      <TextLink label="Report this video" />
    </>
  );
  if (embedded) return body;
  return <Phase6Shell athleteTab={1}>{body}</Phase6Shell>;
}
