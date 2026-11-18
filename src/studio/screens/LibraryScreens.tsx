import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '../../components/ui';
import { useTheme } from '../../theme/ThemeProvider';
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
      <View style={{ flex: 1, marginHorizontal: 36, marginTop: 16, marginBottom: 210, borderWidth: 1.5, borderStyle: 'dashed', borderColor: '#8FA3FF', borderRadius: 8 }} />
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

export function ClientViewCustomScreen({ embedded = false }: { embedded?: boolean }) {
  const { colors } = useTheme();
  const body = (
    <>
      <BackRow title="Upper Push" />
      <Text variant="title" accessibilityRole="header" style={{ marginTop: 6 }}>Half-kneeling landmine press</Text>
      <Text variant="small" color={colors.textMuted}>From Alex · My exercise · 3 × 10</Text>
      <View style={{ flexDirection: 'row', gap: 6, marginTop: 12 }}>
        {['Front', 'Side', '3/4'].map((p, i) => <Chip key={p} label={p} on={i === 0} />)}
      </View>
      <GlassCard style={{ height: 160, borderRadius: 20 }} />
      <Text variant="small" color={colors.textMuted} style={{ marginTop: 10 }}>Eyes on the landmine. Ribs down. Press without shrugging.</Text>
    </>
  );
  if (embedded) return body;
  return <Phase6Shell athleteTab={1}>{body}</Phase6Shell>;
}

void Figure;
