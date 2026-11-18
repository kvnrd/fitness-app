import { Pressable, Switch, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button, Text } from '../../components/ui';
import { useTheme } from '../../theme/ThemeProvider';
import {
  Avatar,
  BackRow,
  Caption,
  DemoFigure,
  EmptyState,
  Field,
  GlassCard,
  Phase6Shell,
  PrimaryButton,
  TextLink,
} from '../chrome';

function Chip({ label, on, size = 'sm' }: { label: string; on?: boolean; size?: 'sm' | 'md' }) {
  const { colors } = useTheme();
  const h = size === 'md' ? 36 : 32;
  return (
    <View style={{ height: h, borderRadius: h / 2, paddingHorizontal: size === 'md' ? 12 : 10, justifyContent: 'center', backgroundColor: on ? colors.tabOn : colors.glass, borderWidth: 1, borderColor: on ? colors.tabOn : colors.glassBorder }}>
      <Text variant={size === 'md' ? 'small' : 'label'} color={on ? colors.tabOnText : colors.text} style={{ fontWeight: '700' }}>{label}</Text>
    </View>
  );
}


export function LibraryBrowseScreen({ mine = false, empty = false }: { mine?: boolean; empty?: boolean }) {
  const { colors } = useTheme();
  const all = [
    { n: 'Barbell bench press', m: 'Barbell · Push · Chest, triceps', b: 'Default', u: 'In 6 plans', mine: false },
    { n: 'Half-kneeling landmine press', m: 'Landmine · Push · Shoulders', b: 'My exercise', u: 'In 3 plans', mine: true },
    { n: 'Incline dumbbell press', m: 'Dumbbells · Push · Upper chest', b: 'Default', u: 'In 2 plans', mine: false },
    { n: 'Tempo pause bench (copy)', m: 'Barbell · Push · Chest', b: 'My exercise', u: 'In 1 plan', mine: true },
    { n: 'Landmine press', m: 'Landmine · Push · Shoulders', b: 'Default', u: 'In 0 plans', mine: false },
  ];
  const rows = empty ? [] : mine ? all.filter((r) => r.mine) : all;
  const seg = empty || mine ? 'My exercises' : 'All';
  const count = empty ? '' : `${rows.length} results` + (mine ? '' : ' · press');
  const search = !mine && !empty ? 'press' : 'Search 640 exercises';
  return (
    <Phase6Shell
      tab={3}
      overlay={
        empty ? undefined : (
          <View style={{ position: 'absolute', left: 20, right: 20, bottom: 110, zIndex: 20 }}>
            <Button label="New exercise" icon={<Ionicons name="add" size={20} color={colors.accentText} />} />
          </View>
        )
      }
    >
      <BackRow title="Studio" right={<Ionicons name="options-outline" size={22} color={colors.text} accessibilityLabel="Filters" />} />
      <Text variant="small" color={colors.textMuted}>{empty ? '640 default · 0 yours' : '640 default · 7 yours'}</Text>
      <Text variant="title" accessibilityRole="header">Exercise library</Text>
      <GlassCard style={{ marginTop: 12 }}>
        <View style={{ height: 44, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Ionicons name="search" size={20} color={colors.textMuted} />
          <Text variant="body" color={!mine && !empty ? colors.text : colors.textMuted}>{search}</Text>
        </View>
      </GlassCard>
      <View style={{ marginTop: 12, flexDirection: 'row', borderRadius: 22, backgroundColor: colors.glass, borderWidth: 1, borderColor: colors.glassBorder, padding: 4 }}>
        {['All', 'Default', 'My exercises'].map((s) => (
          <View key={s} style={{ flex: 1, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: s === seg ? colors.tabOn : 'transparent' }}>
            <Text variant="small" color={s === seg ? colors.tabOnText : colors.text} style={{ fontWeight: s === seg ? '700' : '400' }}>{s}</Text>
          </View>
        ))}
      </View>
      {empty ? (
        <EmptyState title="Nothing custom yet" body="Custom exercises stay private to you and your current clients. Only they will see them." cta="Create exercise" alt="Duplicate a default" />
      ) : (
        <>
          <View style={{ flexDirection: 'row', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
            {['Chest', 'Equipment', 'Push'].map((c) => <Chip key={c} label={c} on={c === 'Push'} />)}
          </View>
          <View style={{ flexDirection: 'row', marginTop: 10, alignItems: 'center' }}>
            <Text variant="label" color={colors.textMuted} style={{ flex: 1 }}>{count}</Text>
            <Text variant="small" color={colors.accentInk} style={{ fontWeight: '600' }}>Clear</Text>
          </View>
          <GlassCard style={{ marginTop: 8, borderRadius: 24 }}>
            <View style={{ paddingHorizontal: 16, paddingBottom: 12, paddingTop: 4 }}>
              {rows.map((r, i) => (
                <View key={r.n} style={{ flexDirection: 'row', gap: 12, paddingVertical: 10, alignItems: 'center', borderTopWidth: i ? 1 : 0, borderTopColor: colors.glassBorder }}>
                  <DemoFigure w={48} h={48} />
                  <View style={{ flex: 1 }}>
                    <Text variant="body">{r.n}</Text>
                    <Text variant="label" color={colors.textMuted}>{r.m}</Text>
                    <View style={{ flexDirection: 'row', gap: 6, marginTop: 4, alignItems: 'center' }}>
                      <Chip label={r.b} />
                      <Text variant="label" color={colors.textMuted}>{r.u}</Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
                </View>
              ))}
            </View>
          </GlassCard>
        </>
      )}
    </Phase6Shell>
  );
}

export function LibraryDetailScreen() {
  const { colors } = useTheme();
  const cues: { n: string; txt: string; tag?: string; old?: string }[] = [
    { n: '01', txt: 'Eyes under the bar, shoulder blades pinned back and down.' },
    { n: '02', txt: 'Lower for three seconds to the lower chest, elbows about 45°.', tag: 'Edited', old: 'Lower for two seconds, touch at the sternum, elbows about 45°.' },
  ];
  return (
    <Phase6Shell tab={3}>
      <BackRow title="Library" right={<Ionicons name="flag-outline" size={20} color={colors.text} accessibilityLabel="Report" />} />
      <View style={{ flexDirection: 'row', gap: 6, marginTop: 8, alignItems: 'center' }}>
        <Chip label="Default" />
        <Text variant="label" color={colors.textMuted}>Strength · compound push</Text>
      </View>
      <Text variant="title" accessibilityRole="header" style={{ marginTop: 6 }}>Barbell bench press</Text>
      <DemoStage active="Front" height={132} />
      <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
        <View style={{ flex: 1.4 }}>
          <Button label="Add to plan" />
        </View>
        <View style={{ flex: 1, justifyContent: 'center' }}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Duplicate"
            style={{ minHeight: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: colors.text }}
          >
            <Text variant="bodyStrong">Duplicate</Text>
          </Pressable>
        </View>
      </View>
      <Text variant="label" color={colors.textMuted} style={{ marginTop: 10 }}>The demo and exercise info are locked. You can edit or add cues and add your own demo; your clients see your versions, everyone else sees the defaults.</Text>
      <GlassCard style={{ marginTop: 12, borderRadius: 24 }}>
        <View style={{ paddingHorizontal: 16, paddingVertical: 14 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text variant="bodyStrong" style={{ flex: 1 }}>Cues</Text>
            <Text variant="small" color={colors.accentInk} style={{ fontWeight: '600' }}>Edit cues</Text>
            <Text variant="small" color={colors.accentInk} style={{ fontWeight: '600', marginLeft: 12 }}>+ Add cue</Text>
          </View>
          <Text variant="label" color={colors.accentInk} style={{ marginTop: 6, fontWeight: '600' }}>Your cues · visible to your clients</Text>
          {cues.map((c, i) => (
            <View key={c.n} style={{ paddingVertical: 8, borderTopWidth: i ? 1 : 0, borderTopColor: colors.glassBorder }}>
              <View style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start' }}>
                <Text variant="heading" color={colors.accentInk} style={{ width: 28 }}>{c.n}</Text>
                <View style={{ flex: 1 }}>
                  <Text variant="body">{c.txt}</Text>
                  {c.old ? <Text variant="label" color={colors.textMuted} style={{ textDecorationLine: 'line-through', marginTop: 2 }}>{c.old}</Text> : null}
                </View>
                {c.tag ? <Chip label={c.tag} /> : null}
              </View>
            </View>
          ))}
          <View style={{ flexDirection: 'row', marginTop: 8, alignItems: 'center' }}>
            <Text variant="label" color={colors.textMuted} style={{ flex: 1 }}>1 edited · 1 added</Text>
            <Text variant="small" color={colors.accentInk} style={{ fontWeight: '600' }}>Reset to default</Text>
          </View>
        </View>
      </GlassCard>
      <GlassCard style={{ marginTop: 8, borderRadius: 20 }}>
        <View style={{ paddingHorizontal: 16, paddingVertical: 14 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text variant="body" style={{ flex: 1 }}>Used in your plans</Text>
            <Text variant="small" color={colors.textMuted}>6 plans · 14 clients</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
            <Text variant="body" style={{ flex: 1 }}>Tracked</Text>
            <Text variant="small" color={colors.textMuted}>Weight · reps · RPE</Text>
          </View>
        </View>
      </GlassCard>
    </Phase6Shell>
  );
}

export function EditCuesScreen() {
  const { colors } = useTheme();
  const items: { n: string; txt: string; ed: boolean }[] = [
    { n: '01', txt: 'Eyes under the bar, shoulder blades pinned back and down.', ed: false },
    { n: '02', txt: 'Lower for two seconds, touch at the sternum, elbows about 45°.', ed: true },
    { n: '03', txt: 'Pause, then drive up and slightly back over the shoulders.', ed: false },
    { n: '04', txt: 'Feet planted, push the floor away through the whole rep.', ed: false },
  ];
  return (
    <Phase6Shell tab={3}>
      <BackRow title="Bench press" rightLabel="Save" />
      <Text variant="title" accessibilityRole="header">Edit cues</Text>
      <Text variant="small" color={colors.textMuted} style={{ marginTop: 4 }}>Up to 6 cues. Your clients see these; everyone else still sees the defaults. Reset to default anytime.</Text>
      {items.map((it) => (
        <GlassCard key={it.n} style={{ marginTop: 8, borderRadius: 20 }}>
          <View style={{ paddingHorizontal: 14, paddingVertical: 12 }}>
            <View style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start' }}>
              <Ionicons name="menu-outline" size={20} color={colors.textMuted} />
              <Text variant="heading" color={colors.accentInk} style={{ width: 28 }}>{it.n}</Text>
              <Text variant="body" style={{ flex: 1 }}>{it.txt}</Text>
              <Ionicons name="close" size={20} color={colors.textMuted} accessibilityLabel="Remove cue" />
            </View>
            {it.ed ? <Text variant="label" color={colors.textMuted} style={{ marginTop: 6, marginLeft: 62 }}>Edited from the standard cue. Clients see your version.</Text> : null}
          </View>
        </GlassCard>
      ))}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Add cue"
        style={{ marginTop: 12, height: 56, borderRadius: 28, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: colors.glass, borderWidth: 1, borderColor: colors.glassBorder }}
      >
        <Ionicons name="add" size={20} color={colors.text} />
        <Text variant="bodyStrong">Add cue</Text>
      </Pressable>
      <TextLink label="Reset to default" />
    </Phase6Shell>
  );
}

export function CreateBasicsScreen() {
  const { colors } = useTheme();
  const types = [['Strength', true], ['Cardio', false], ['Mobility', false], ['Timed', false]] as const;
  const musc = [['Chest', 'Primary'], ['Triceps', 'Secondary'], ['Front delts', ''], ['Shoulders', ''], ['Back', '']] as const;
  return (
    <Phase6Shell tab={3}>
      <BackRow title="Library" rightLabel="Save draft" />
      <Caption style={{ marginTop: 8 }}>Step 1 of 3</Caption>
      <Text variant="title" accessibilityRole="header">New exercise</Text>
      <Field label="Name" value="Half-kneeling landmine press" />
      <Text variant="label" color={colors.textMuted} style={{ marginTop: 12, marginBottom: 6 }}>Type</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {types.map(([n, on]) => <Chip key={n} label={n} on={on} size="md" />)}
      </View>
      <Text variant="label" color={colors.textMuted} style={{ marginTop: 12, marginBottom: 6 }}>Muscles · tap once for primary, twice for secondary</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {musc.map(([n, l]) => <Chip key={n} label={l ? `${n} · ${l}` : n} on={Boolean(l)} size="md" />)}
      </View>
      <Text variant="label" color={colors.textMuted} style={{ marginTop: 12, marginBottom: 6 }}>Equipment</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {['Landmine', 'Barbell', 'Dumbbells'].map((n, i) => <Chip key={n} label={n} on={i === 0} size="md" />)}
      </View>
      <Text variant="label" color={colors.textMuted} style={{ marginTop: 12, marginBottom: 6 }}>Movement</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {['Push', 'Squat', 'Hinge'].map((n, i) => <Chip key={n} label={n} on={i === 0} size="md" />)}
      </View>
      <PrimaryButton label="Continue" style={{ marginTop: 16 }} />
    </Phase6Shell>
  );
}

export function CreateTrackingScreen() {
  const { colors } = useTheme();
  const mets = [['Weight', true], ['Reps', true], ['RPE', true], ['Per side', true], ['Time', false], ['Tempo', false], ['Distance', false]] as const;
  return (
    <Phase6Shell tab={3}>
      <BackRow title="New exercise" rightLabel="Save draft" />
      <Caption style={{ marginTop: 8 }}>Step 2 of 3</Caption>
      <Text variant="title" accessibilityRole="header">What clients log</Text>
      <Text variant="small" color={colors.textMuted} style={{ marginTop: 6 }}>Weight follows each client’s lb/kg setting. Pick the metrics that belong on the set card.</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 }}>
        {mets.map(([n, on]) => <Chip key={n} label={n} on={on} size="md" />)}
      </View>
      <Text variant="bodyStrong" style={{ marginTop: 16, marginBottom: 8 }}>Cues</Text>
      <GlassCard style={{ borderRadius: 20, marginTop: 0 }}>
        <View style={{ paddingHorizontal: 14, paddingVertical: 12, flexDirection: 'row', gap: 10, alignItems: 'center' }}>
          <Ionicons name="menu-outline" size={20} color={colors.textMuted} />
          <Text variant="heading" color={colors.accentInk}>01</Text>
          <Text variant="body" style={{ flex: 1 }}>Ribcage stacked, front knee tracks over mid-foot.</Text>
        </View>
      </GlassCard>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Add cue"
        style={{ marginTop: 8, height: 48, borderRadius: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: colors.glass, borderWidth: 1, borderColor: colors.glassBorder }}
      >
        <Ionicons name="add" size={20} color={colors.text} />
        <Text variant="bodyStrong">Add cue</Text>
      </Pressable>
      <Text variant="label" color={colors.textMuted} style={{ marginTop: 8 }}>Up to 6, shown as “By Alex” to your clients.</Text>
      <PrimaryButton label="Continue" style={{ marginTop: 16 }} />
    </Phase6Shell>
  );
}

export function CreateDemoScreen() {
  const { colors } = useTheme();
  return (
    <Phase6Shell tab={3}>
      <BackRow title="New exercise" rightLabel="Save draft" />
      <Caption style={{ marginTop: 8 }}>Step 3 of 3</Caption>
      <Text variant="title" accessibilityRole="header">Add a demo</Text>
      <Text variant="small" color={colors.textMuted} style={{ marginTop: 6 }}>Use a default demo, or record or upload your own. Videos stay in our private storage and are shown through short-lived links. Max 30 seconds, 200 videos per coach. Location is stripped. Sound is off unless you turn it on.</Text>
      <GlassCard style={{ marginTop: 14, borderRadius: 24 }}>
        <View style={{ padding: 16, flexDirection: 'row', gap: 12, alignItems: 'center' }}>
          <Ionicons name="tv-outline" size={22} color={colors.text} />
          <View style={{ flex: 1 }}>
            <Text variant="body">Use a default demo</Text>
            <Text variant="small" color={colors.textMuted}>Closest match: Landmine press, standing</Text>
          </View>
          <View style={{ width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: colors.faint }} />
        </View>
      </GlassCard>
      <GlassCard style={{ marginTop: 8, borderRadius: 24, borderWidth: 1.5, borderColor: colors.accent }}>
        <View style={{ padding: 16, flexDirection: 'row', gap: 12, alignItems: 'flex-start' }}>
          <Ionicons name="videocam-outline" size={22} color={colors.text} />
          <View style={{ flex: 1 }}>
            <Text variant="body">Record or upload your own</Text>
            <Text variant="small" color={colors.textMuted}>Vertical, 30 s or less. Only you in the shot, no minors in the frame, and only video you made or have the rights to use.</Text>
          </View>
          <View style={{ width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: colors.accent, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="checkmark" size={14} color={colors.accentText} />
          </View>
        </View>
      </GlassCard>
      <Text variant="label" color={colors.textMuted} style={{ marginTop: 10 }}>Clients see it after an automatic check, usually within a minute. We only host video from our own storage — no outside links.</Text>
      <View style={{ flexDirection: 'row', gap: 8, marginTop: 14 }}>
        <View style={{ flex: 1 }}>
          <Button label="Record demo" />
        </View>
        <View style={{ flex: 1 }}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Upload from phone"
            style={{ minHeight: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: colors.text }}
          >
            <Text variant="bodyStrong">Upload from phone</Text>
          </Pressable>
        </View>
      </View>
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
      <View style={{ height: 280, borderRadius: 24, backgroundColor: colors.photo, borderWidth: 1.5, borderColor: colors.faint, marginTop: 14, overflow: 'hidden', position: 'relative' }}>
        <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.figure, position: 'absolute', left: '50%', top: 56, marginLeft: -20 }} />
        <View style={{ width: 86, height: 150, borderRadius: 32, backgroundColor: colors.figure, position: 'absolute', left: '50%', top: 104, marginLeft: -43 }} />
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
              backgroundColor: colors.photo,
              borderWidth: 1.5,
              borderColor: 2 <= i && i <= 6 ? colors.accent : colors.faint,
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
      <Text variant="small" color={colors.textMuted} style={{ marginTop: 8 }}>Half-kneeling landmine press is saved as a draft. Clients see the demo after an automatic check, usually within a minute. If it’s flagged, a person reviews it and we’ll tell you.</Text>
      <GlassCard style={{ marginTop: 16, borderRadius: 24 }}>
        <View style={{ padding: 16, flexDirection: 'row', gap: 12, alignItems: 'center' }}>
          <DemoFigure w={56} h={56} />
          <View style={{ flex: 1 }}>
            <Text variant="body">Half-kneeling landmine press</Text>
            <Text variant="small" color={colors.textMuted}>9 s · sound off · check in progress</Text>
          </View>
        </View>
      </GlassCard>
      <PrimaryButton label="Back to library" style={{ marginTop: 16 }} />
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
        <View style={{ height, borderRadius: 20, backgroundColor: colors.photo, borderWidth: 1.5, borderColor: colors.faint, marginTop: 10, overflow: 'hidden', position: 'relative' }}>
          <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: colors.figure, position: 'absolute', left: '50%', top: 28, marginLeft: -18 }} />
          <View style={{ width: 70, height: 88, borderRadius: 20, backgroundColor: colors.figure, position: 'absolute', left: '50%', top: 68, marginLeft: -35 }} />
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
