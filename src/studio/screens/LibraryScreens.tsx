import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '../../components/ui';
import { useTheme } from '../../theme/ThemeProvider';
import { ScreenBackground } from '../../components/ScreenAtmosphere';
import {
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
      <Caption>Step 1 of 3</Caption>
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
      <Caption>Step 2 of 3</Caption>
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
      <Caption>Step 3 of 3</Caption>
      <Text variant="title" accessibilityRole="header">Add a demo</Text>
      <Text variant="small" color={colors.textMuted} style={{ marginTop: 8 }}>A short demo helps clients see the movement. You can skip this and add one later.</Text>
      <PrimaryButton label="Record a demo" />
      <EqualRow left="Upload a video" right="Skip for now" />
    </Phase6Shell>
  );
}

/** Camera chrome is always dark, in both themes. */
export function RecordDemoScreen() {
  return (
    <View style={{ flex: 1, backgroundColor: '#070A16' }}>
      <ScreenBackground>
        <View style={{ flex: 1, backgroundColor: '#070A16', paddingTop: 56, paddingHorizontal: 20 }}>
          <Text variant="small" color="#F1F4FF">Demo · Front</Text>
          <Text variant="title" color="#F1F4FF" accessibilityRole="header" style={{ marginTop: 4 }}>Record demo</Text>
          <View style={{ flex: 1, marginTop: 16, borderRadius: 24, backgroundColor: '#12162A' }} />
          <View style={{ alignItems: 'center', paddingVertical: 28 }}>
            <View style={{ width: 72, height: 72, borderRadius: 36, borderWidth: 4, borderColor: '#F1F4FF' }} />
            <Text variant="small" color="#F1F4FF" style={{ marginTop: 12 }}>00:12</Text>
          </View>
        </View>
      </ScreenBackground>
    </View>
  );
}

export function TrimDemoScreen() {
  const { colors } = useTheme();
  return (
    <Phase6Shell tab={3}>
      <BackRow title="Demo" rightLabel="Done" />
      <Text variant="title" accessibilityRole="header">Trim your demo</Text>
      <Text variant="small" color={colors.textMuted} style={{ marginTop: 8 }}>Keep the useful part. Clients will see this loop.</Text>
      <GlassCard style={{ height: 180, borderRadius: 20 }} />
      <Text variant="small" color={colors.textMuted} style={{ marginTop: 10 }}>00:12 of 00:30</Text>
      <PrimaryButton label="Use this clip" />
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

export function ClientViewCustomScreen() {
  const { colors } = useTheme();
  return (
    <Phase6Shell athleteTab={1}>
      <BackRow title="Upper Push" />
      <Text variant="title" accessibilityRole="header" style={{ marginTop: 6 }}>Half-kneeling landmine press</Text>
      <Text variant="small" color={colors.textMuted}>From Alex · My exercise · 3 × 10</Text>
      <View style={{ flexDirection: 'row', gap: 6, marginTop: 12 }}>
        {['Front', 'Side', '3/4'].map((p, i) => <Chip key={p} label={p} on={i === 0} />)}
      </View>
      <GlassCard style={{ height: 160, borderRadius: 20 }} />
      <Text variant="small" color={colors.textMuted} style={{ marginTop: 10 }}>Eyes on the landmine. Ribs down. Press without shrugging.</Text>
    </Phase6Shell>
  );
}

void Figure;
