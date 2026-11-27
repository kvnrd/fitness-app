import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '../../components/ui';
import { useTheme } from '../../theme/ThemeProvider';
import {
  Avatar,
  BackRow,
  Banner,
  Caption,
  EmptyState,
  EqualRow,
  GlassCard,
  Phase6Shell,
  PrimaryButton,
  SheetOverlay,
  SettingsRow,
  SwitchRow,
  TextLink,
} from '../chrome';

function Figure({ size = 44 }: { size?: number }) {
  const { colors } = useTheme();
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: 14,
        backgroundColor: colors.surfaceRaised,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}
    >
      <View style={{ width: size * 0.28, height: size * 0.28, borderRadius: 99, backgroundColor: colors.borderStrong, position: 'absolute', top: size * 0.12 }} />
      <View style={{ width: size * 0.42, height: size * 0.42, borderRadius: 10, backgroundColor: colors.borderStrong, position: 'absolute', top: size * 0.42 }} />
    </View>
  );
}

function Chip({ label, on }: { label: string; on?: boolean }) {
  const { colors } = useTheme();
  return (
    <View
      style={{
        height: 32,
        borderRadius: 16,
        paddingHorizontal: 10,
        justifyContent: 'center',
        backgroundColor: on ? colors.tabOn : colors.glass,
        borderWidth: 1,
        borderColor: on ? colors.tabOn : colors.glassBorder,
      }}
    >
      <Text variant="label" color={on ? colors.tabOnText : colors.text} style={{ fontWeight: '700' }}>
        {label}
      </Text>
    </View>
  );
}

function NavRow({ label, value, first }: { label: string; value?: string; first?: boolean }) {
  const { colors } = useTheme();
  return (
    <View
      style={{
        height: 56,
        paddingHorizontal: 16,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        borderTopWidth: first ? 0 : 1,
        borderTopColor: colors.border,
      }}
    >
      <Text variant="body" style={{ flex: 1 }}>
        {label}
      </Text>
      {value ? (
        <Text variant="label" color={colors.textMuted}>
          {value}
        </Text>
      ) : null}
      <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
    </View>
  );
}

function Sheet({ title, body, children }: { title: string; body?: string; children?: React.ReactNode }) {
  const { colors } = useTheme();
  return (
    <View
      style={{
        marginTop: 16,
        backgroundColor: colors.surface,
        borderTopLeftRadius: 40,
        borderTopRightRadius: 40,
        borderWidth: 1,
        borderColor: colors.glassBorder,
        paddingTop: 10,
        paddingHorizontal: 20,
        paddingBottom: 24,
      }}
    >
      <View style={{ width: 40, height: 5, borderRadius: 3, backgroundColor: colors.border, alignSelf: 'center', marginBottom: 14 }} />
      <Text variant="heading">{title}</Text>
      {body ? (
        <Text variant="small" color={colors.textMuted} style={{ marginTop: 8 }}>
          {body}
        </Text>
      ) : null}
      {children}
    </View>
  );
}

export function StudioLockedScreen() {
  return (
    <Phase6Shell tab={3} lockedStudio>
      <Muted>Coach workspace</Muted>
      <Text variant="title" accessibilityRole="header">
        Studio
      </Text>
      <EmptyState
        title="Studio is locked"
        body="Studio opens after you’re a verified coach. Your application is still in review. We’ll email you when there’s an update."
        cta="View application"
      />
    </Phase6Shell>
  );
}

function Muted({ children }: { children: string }) {
  const { colors } = useTheme();
  return (
    <Text variant="small" color={colors.textMuted}>
      {children}
    </Text>
  );
}

const CLIENTS = [
  { ini: 'KR', name: 'Kevin', sub: '1:1 · Today · Upper Push', share: 'Weight on · Photos off', ask: false },
  { ini: 'MC', name: 'Maya Chen', sub: '1:1 · Yesterday · Lower A', share: 'Weight on · Photos on', ask: false },
  { ini: 'JL', name: 'Jordan Lee', sub: '1:1 · Fri · Zone 2 Run', share: 'Weight off · Photos off', ask: false },
  { ini: 'S', name: 'Sam', sub: '1:1 · Today · Full body', share: '16–17 · Weight isn’t shared · No photos', ask: false },
];

export function StudioClientsScreen({ empty = false, banner = false }: { empty?: boolean; banner?: boolean }) {
  const { colors } = useTheme();
  if (empty) {
    return (
      <Phase6Shell tab={3}>
        <Muted>Coach workspace</Muted>
        <Text variant="title" accessibilityRole="header">
          Studio
        </Text>
        <EmptyState
          title="No clients yet"
          body="When someone starts 1:1 coaching with you, they show up here. You only see what each client has chosen to share."
          cta="Share your invite link"
        />
        <GlassCard>
          <SettingsRow first icon="book-outline" label="Exercise library" accentChevron />
        </GlassCard>
      </Phase6Shell>
    );
  }
  const list = CLIENTS.map((c, i) => (i === 0 && banner ? { ...c, ask: true } : c));
  return (
    <Phase6Shell tab={3}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <View>
          <Muted>Coach workspace</Muted>
          <Text variant="title" accessibilityRole="header">
            Studio
          </Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text variant="hero">4</Text>
          <Text variant="label" color={colors.textMuted}>
            clients
          </Text>
        </View>
      </View>
      {banner ? (
        <GlassCard>
          <View style={{ padding: 16, borderWidth: 2, borderColor: colors.accent, borderRadius: 20 }}>
            <Text variant="body">Kevin asked you to delete his data</Text>
            <Text variant="small" color={colors.textMuted} style={{ marginTop: 2 }}>
              Under the Coach Terms, you must delete every copy by Dec 17 and confirm. Open to review.
            </Text>
          </View>
        </GlassCard>
      ) : null}
      <GlassCard>
        <View style={{ height: 44, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Ionicons name="search" size={20} color={colors.textMuted} />
          <Text variant="body" color={colors.textMuted}>
            Search clients
          </Text>
        </View>
      </GlassCard>
      <GlassCard>
        <View style={{ paddingHorizontal: 16 }}>
          {list.map((c, i) => (
            <View
              key={c.name}
              style={{
                flexDirection: 'row',
                gap: 12,
                paddingVertical: 12,
                alignItems: 'center',
                borderTopWidth: i ? 1 : 0,
                borderTopColor: colors.border,
              }}
            >
              <Avatar initials={c.ini} size={48} />
              <View style={{ flex: 1 }}>
                <Text variant="body">{c.name}</Text>
                <Text variant="label" color={colors.textMuted}>
                  {c.sub}
                </Text>
                <Text variant="label" color={colors.textMuted}>
                  {c.share}
                </Text>
              </View>
              {c.ask ? (
                <View style={{ backgroundColor: colors.surfaceRaised, borderRadius: 16, paddingHorizontal: 10, height: 32, justifyContent: 'center' }}>
                  <Text variant="label" style={{ fontWeight: '700' }}>
                    Asked to delete
                  </Text>
                </View>
              ) : null}
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </View>
          ))}
        </View>
      </GlassCard>
      <GlassCard>
        <View style={{ height: 56, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Ionicons name="book-outline" size={20} color={colors.accentInk} />
          <Text variant="body" style={{ flex: 1 }}>
            Exercise library
          </Text>
          <Text variant="label" color={colors.textMuted}>
            640
          </Text>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </View>
      </GlassCard>
    </Phase6Shell>
  );
}

export function ClientAdultScreen({ photos = false, deleteAsk = false }: { photos?: boolean; deleteAsk?: boolean }) {
  return (
    <Phase6Shell tab={3}>
      <ClientAdultBody photos={photos} deleteAsk={deleteAsk} />
    </Phase6Shell>
  );
}

export function ClientAdultBody({ photos = false, deleteAsk = false }: { photos?: boolean; deleteAsk?: boolean }) {
  const { colors } = useTheme();
  return (
    <View>
      <BackRow title="Studio" right={<Ionicons name="ellipsis-horizontal" size={20} color={colors.text} />} />
      <View style={{ flexDirection: 'row', gap: 14, marginTop: 14, alignItems: 'center' }}>
        <Avatar initials="KR" size={56} />
        <View style={{ flex: 1 }}>
          <Text variant="title" accessibilityRole="header">
            Kevin
          </Text>
          <Muted>1:1 · Week 3 of 8 · Main gym</Muted>
        </View>
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 12 }}>
        <Chip label="Weight on" />
        <Chip label={photos ? 'Photos on' : 'Photos off'} />
        <Chip label="Favorites visible" />
      </View>
      {deleteAsk ? (
        <GlassCard>
          <View style={{ padding: 16, borderWidth: 2, borderColor: colors.accent, borderRadius: 20 }}>
            <Text variant="body">Kevin asked you to delete his data</Text>
            <Text variant="small" color={colors.textMuted} style={{ marginTop: 4 }}>
              Your access has already ended. Delete every copy you have, including anything saved outside [App], by Dec 17, and confirm each item. You don’t get an export.
            </Text>
            <Text variant="small" color={colors.accentInk} style={{ marginTop: 8, fontWeight: '600' }}>
              Review request
            </Text>
          </View>
        </GlassCard>
      ) : null}
      <GlassCard style={{ borderRadius: 32 }}>
        <View style={{ padding: 18 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text variant="label" color={colors.textMuted}>
              Today
            </Text>
            <Text variant="label" color={colors.textMuted}>
              3 of 10 sets
            </Text>
          </View>
          <Text variant="heading" style={{ marginTop: 4 }}>
            Upper Push
          </Text>
          <Muted>50 min · 3 exercises</Muted>
          <Text variant="small" color={colors.accentInk} style={{ marginTop: 10, fontWeight: '600' }}>
            Edit this plan
          </Text>
        </View>
      </GlassCard>
      <GlassCard>
        <NavRow first label="Activity" value="3 new" />
        <NavRow label="Coach picks" value="4 of 20" />
        <NavRow label="Weight" value="182.9 lb trend" />
      </GlassCard>
      <GlassCard>
        <View style={{ padding: 16 }}>
          {photos ? (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text variant="body" style={{ flex: 1 }}>
                Progress photos
              </Text>
              <Text variant="small" color={colors.accentInk} style={{ fontWeight: '600' }}>
                Open
              </Text>
            </View>
          ) : (
            <Text variant="body">Progress photos</Text>
          )}
          <Text variant="small" color={colors.textMuted} style={{ marginTop: 2 }}>
            {photos
              ? 'Kevin turned photo sharing on. 8 check-ins · last Nov 14.'
              : 'Kevin hasn’t turned on sharing, so photos aren’t available here.'}
          </Text>
        </View>
      </GlassCard>
    </View>
  );
}

export function ClientTeenScreen() {
  const { colors } = useTheme();
  return (
    <Phase6Shell tab={3}>
      <BackRow title="Studio" right={<Ionicons name="ellipsis-horizontal" size={20} color={colors.text} />} />
      <View style={{ flexDirection: 'row', gap: 14, marginTop: 14, alignItems: 'center' }}>
        <Avatar initials="S" size={56} />
        <View style={{ flex: 1 }}>
          <Text variant="title" accessibilityRole="header">
            Sam
          </Text>
          <Muted>1:1 · 16–17 · Parent is the buyer</Muted>
        </View>
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 12 }}>
        <Chip label="16–17" />
        <Chip label="Weight isn’t shared" />
        <Chip label="No photos" />
      </View>
      <GlassCard>
        <View style={{ padding: 16 }}>
          <Text variant="body">Sharing limits for 16–17</Text>
          <Text variant="small" color={colors.textMuted} style={{ marginTop: 4 }}>
            You never see Sam’s weight or health info, including weight from Apple Health or Garmin. Progress photos aren’t available for anyone under 18.
          </Text>
        </View>
      </GlassCard>
      <GlassCard style={{ borderRadius: 32 }}>
        <View style={{ padding: 18 }}>
          <Text variant="label" color={colors.textMuted}>
            Today
          </Text>
          <Text variant="heading" style={{ marginTop: 4 }}>
            Full body
          </Text>
          <Muted>45 min · 5 exercises · Build muscle</Muted>
          <Text variant="small" color={colors.accentInk} style={{ marginTop: 10, fontWeight: '600' }}>
            Edit this plan
          </Text>
        </View>
      </GlassCard>
      <GlassCard>
        <NavRow first label="Activity" value="1 new" />
        <NavRow label="Coach picks" value="2 of 20" />
      </GlassCard>
    </Phase6Shell>
  );
}

export function EndRelationshipScreen() {
  return (
    <Phase6Shell
      tab={3}
      hideTab
      overlay={
        <SheetOverlay
          title="End coaching with Kevin?"
          body="Your access to Kevin’s shared data ends right away. Under the Coach Terms, delete every copy you have, including anything saved outside [App], by Dec 17. You don’t get an export."
        >
          <EqualRow left="Keep coaching" right="End and delete copies" danger stacked />
        </SheetOverlay>
      }
    >
      <ClientAdultBody />
    </Phase6Shell>
  );
}

const DAYS: { d: string; n: string; m: string; s: 'done' | 'today' | 'open' | 'rest' }[] = [
  { d: 'Mon', n: 'Lower Strength', m: '55 min', s: 'done' },
  { d: 'Tue', n: 'Engine Intervals', m: '40 min', s: 'done' },
  { d: 'Wed', n: 'Upper Push', m: '50 min', s: 'today' },
  { d: 'Thu', n: 'Zone 2 Run', m: '45 min', s: 'open' },
  { d: 'Fri', n: 'Upper Pull', m: '50 min', s: 'open' },
  { d: 'Sat', n: 'Conditioning', m: '35 min', s: 'open' },
  { d: 'Sun', n: 'Recovery', m: 'Rest', s: 'rest' },
];

export function PlanWeekScreen({ empty = false }: { empty?: boolean }) {
  const { colors } = useTheme();
  if (empty) {
    return (
      <Phase6Shell tab={3}>
        <BackRow title="Kevin" />
        <Muted>Kevin’s plan</Muted>
        <Text variant="title" accessibilityRole="header">
          This week
        </Text>
        <EmptyState
          title="No plan this week"
          body="Add a week from a template, or build a day from the library. Kevin will see it on Train."
          cta="Add a week"
        />
      </Phase6Shell>
    );
  }
  return (
    <Phase6Shell tab={3}>
      <BackRow title="Kevin" right={<Ionicons name="ellipsis-horizontal" size={20} color={colors.text} />} />
      <Muted>Kevin’s plan · Week 3 of 8</Muted>
      <Text variant="title" accessibilityRole="header">
        This week
      </Text>
      <GlassCard>
        <View style={{ paddingHorizontal: 16 }}>
          {DAYS.map((row, i) => (
            <View
              key={row.d}
              style={{
                height: 56,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                borderTopWidth: i ? 1 : 0,
                borderTopColor: colors.border,
              }}
            >
              <Text variant="heading" color={row.s === 'today' ? colors.accentInk : colors.textMuted} style={{ width: 44 }}>
                {row.d}
              </Text>
              <Text variant="body" style={{ flex: 1, fontWeight: row.s === 'today' ? '700' : '400' }}>
                {row.n}
              </Text>
              <Text variant="small" color={colors.textMuted}>
                {row.m}
              </Text>
              {row.s === 'done' ? (
                <Ionicons name="checkmark-circle" size={20} color={colors.accentInk} />
              ) : row.s === 'today' ? (
                <Text variant="label" style={{ fontWeight: '700' }}>
                  Today
                </Text>
              ) : row.s === 'rest' ? (
                <Ionicons name="leaf-outline" size={20} color={colors.textMuted} />
              ) : (
                <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
              )}
            </View>
          ))}
        </View>
      </GlassCard>
      <Text variant="label" color={colors.textMuted} style={{ marginTop: 10 }}>
        Lock an exercise to keep your prescription, tempo and swaps. Kevin sees changes on Train after you save.
      </Text>
    </Phase6Shell>
  );
}

const EXERCISES = [
  { n: '01', name: 'Bench Press', meta: '4 × 5 @ RPE 8 · TEMPO 3-1-1-2', lock: true },
  { n: '02', name: 'Seated DB Press', meta: '3 × 10 · rest 2:00', lock: false },
  { n: '03', name: 'Triceps Pushdown', meta: '3 × 15', lock: false },
];

export function PlanDayScreen({ add = false }: { add?: boolean }) {
  const { colors } = useTheme();
  const addSheet = (
    <SheetOverlay title="Add to Upper Push">
          <GlassCard style={{ marginTop: 10 }}>
            <View style={{ height: 44, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Ionicons name="search" size={20} color={colors.textMuted} />
              <Text variant="body" color={colors.textMuted}>
                Search 640 exercises
              </Text>
            </View>
          </GlassCard>
          <View style={{ flexDirection: 'row', gap: 4, marginTop: 10, padding: 4, borderRadius: 22, backgroundColor: colors.glass }}>
            {['All', 'Default', 'My exercises'].map((s, i) => (
              <View key={s} style={{ flex: 1, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: i === 0 ? colors.tabOn : 'transparent' }}>
                <Text variant="small" color={i === 0 ? colors.tabOnText : colors.text} style={{ fontWeight: '700' }}>
                  {s}
                </Text>
              </View>
            ))}
          </View>
          {[
            ['Barbell bench press', 'Barbell · Push · Chest, triceps', 'Default'],
            ['Half-kneeling landmine press', 'Landmine · Push · Shoulders', 'My exercise'],
            ['Incline dumbbell press', 'Dumbbells · Push · Upper chest', 'Default'],
          ].map(([n, m, b], i) => (
            <View key={n} style={{ flexDirection: 'row', gap: 12, paddingVertical: 10, borderTopWidth: i ? 1 : 0, borderTopColor: colors.border, alignItems: 'center' }}>
              <Figure />
              <View style={{ flex: 1 }}>
                <Text variant="body">{n}</Text>
                <Text variant="label" color={colors.textMuted}>
                  {m}
                </Text>
              </View>
              <Chip label={b} />
            </View>
          ))}
    </SheetOverlay>
  );
  return (
    <Phase6Shell tab={3} hideTab={add} overlay={add ? addSheet : undefined}>
      <BackRow title="This week" rightLabel="Save" />
      <Muted>Wednesday · Kevin</Muted>
      <Text variant="title" accessibilityRole="header">
        Upper Push
      </Text>
      <View style={{ flexDirection: 'row', gap: 8, marginTop: 8, alignItems: 'center' }}>
        <GlassCard style={{ marginTop: 0, flex: 1, height: 36, justifyContent: 'center', paddingHorizontal: 12 }}>
          <Text variant="small">50 min</Text>
        </GlassCard>
        <Chip label="Main gym" />
      </View>
      {EXERCISES.map((ex) => (
        <GlassCard key={ex.n}>
          <View style={{ padding: 12, flexDirection: 'row', gap: 10, alignItems: 'center' }}>
            <Text variant="heading" color={colors.accentInk} style={{ width: 28 }}>
              {ex.n}
            </Text>
            <Figure />
            <View style={{ flex: 1 }}>
              <Text variant="body">{ex.name}</Text>
              <Text variant="label" color={colors.textMuted}>
                {ex.meta}
              </Text>
            </View>
            <Ionicons name={ex.lock ? 'lock-closed-outline' : 'lock-open-outline'} size={18} color={colors.textMuted} />
            <Ionicons name="menu-outline" size={18} color={colors.textMuted} />
          </View>
        </GlassCard>
      ))}
      <GlassCard>
        <View style={{ height: 56, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 }}>
          <Ionicons name="add" size={20} color={colors.text} />
          <Text variant="bodyStrong">Add exercise</Text>
        </View>
      </GlassCard>
      <Text variant="label" color={colors.textMuted} style={{ marginTop: 10 }}>
        A lock keeps Kevin from editing that exercise or its tempo. Unlocked changes show up in Activity, with no notification.
      </Text>
    </Phase6Shell>
  );
}

export function TempoEditorScreen({ perSet = false }: { perSet?: boolean }) {
  const { colors } = useTheme();
  const presets = [
    { n: 'Controlled', v: '3-1-1-2', on: !perSet },
    { n: 'Slow negative', v: '4-1-1-1', on: false },
    { n: 'Pause reps', v: '2-3-1-1', on: perSet },
    { n: 'Standard', v: '2-0-1-0', on: false },
  ];
  const phases = [
    { n: 'Negative', s: 'Lower', v: '2' },
    { n: 'Stretch', s: 'Bottom pause', v: perSet ? '3' : '1' },
    { n: 'Up', s: 'Lift', v: '1' },
    { n: 'Squeeze', s: 'Top pause', v: '1' },
  ];
  return (
    <Phase6Shell tab={3}>
      <BackRow title="Upper Push" rightLabel="Save" />
      <Muted>Barbell bench press · 4 sets</Muted>
      <Text variant="title" accessibilityRole="header">
        Tempo
      </Text>
      <Caption>Presets</Caption>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
        {presets.map((p) => (
          <View
            key={p.n}
            style={{
              paddingVertical: 6,
              paddingHorizontal: 10,
              borderRadius: 16,
              backgroundColor: p.on ? colors.tabOn : colors.glass,
              borderWidth: 1,
              borderColor: p.on ? colors.tabOn : colors.glassBorder,
            }}
          >
            <Text variant="label" color={p.on ? colors.tabOnText : colors.textMuted}>
              {p.n}
            </Text>
            <Text variant="small" color={p.on ? colors.tabOnText : colors.text} style={{ fontWeight: '700' }}>
              {p.v}
            </Text>
          </View>
        ))}
      </View>
      <View style={{ marginTop: 8 }}>
        <Caption>Tempo by set</Caption>
      </View>
      <View style={{ flexDirection: 'row', gap: 4, marginTop: 6, padding: 4, borderRadius: 22, backgroundColor: colors.glass }}>
        {['Same all sets', 'Per set'].map((s, i) => {
          const on = (i === 1) === perSet;
          return (
            <View key={s} style={{ flex: 1, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: on ? colors.tabOn : 'transparent' }}>
              <Text variant="small" color={on ? colors.tabOnText : colors.text} style={{ fontWeight: '700' }}>
                {s}
              </Text>
            </View>
          );
        })}
      </View>
      {perSet
        ? [
            { n: 'Set 1', v: '3-1-1-2', a: false },
            { n: 'Set 2', v: '3-1-1-2', a: false },
            { n: 'Set 3', v: '3-1-1-2', a: false },
            { n: 'Set 4', v: '2-3-1-1', a: true },
          ].map((s) => (
            <View
              key={s.n}
              style={{
                height: 36,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 10,
                paddingHorizontal: 8,
                borderRadius: 14,
                backgroundColor: s.a ? colors.surfaceRaised : 'transparent',
                borderWidth: s.a ? 1.5 : 0,
                borderColor: colors.accent,
                marginTop: 4,
              }}
            >
              <Text variant="body" style={{ width: 48 }}>
                {s.n}
              </Text>
              <Text variant="small" style={{ flex: 1, textAlign: 'right', fontWeight: '700' }}>
                {s.v}
              </Text>
            </View>
          ))
        : null}
      <GlassCard>
        <View style={{ paddingHorizontal: 12 }}>
          {phases.map((p, i) => (
            <View key={p.n} style={{ height: 44, flexDirection: 'row', alignItems: 'center', gap: 8, borderTopWidth: i ? 1 : 0, borderTopColor: colors.border }}>
              <Text variant="body" style={{ flex: 1 }}>
                {p.n}
              </Text>
              <Text variant="label" color={colors.textMuted} style={{ width: 80 }}>
                {p.s}
              </Text>
              <Text variant="heading" style={{ width: 24, textAlign: 'center' }}>
                {p.v}
              </Text>
            </View>
          ))}
        </View>
      </GlassCard>
      <SwitchRow label="Lock tempo" hint="On while the exercise is locked, Kevin can’t change it." on a11y="Lock tempo" />
    </Phase6Shell>
  );
}

export function ActivityScreen({ hidden = false, empty = false }: { hidden?: boolean; empty?: boolean }) {
  const { colors } = useTheme();
  if (empty) {
    return (
      <Phase6Shell tab={3}>
        <BackRow title="Kevin" />
        <Text variant="title" accessibilityRole="header">
          Activity
        </Text>
        <Muted>Plan changes Kevin made · no notifications</Muted>
        <EmptyState
          title="No changes yet"
          body="When Kevin swaps an exercise, edits a tempo, or marks Less of this, it shows up here. Locked items stay as you wrote them."
          cta="Edit this plan"
        />
      </Phase6Shell>
    );
  }
  return (
    <Phase6Shell tab={3}>
      <BackRow title="Kevin" />
      <Text variant="title" accessibilityRole="header">
        Activity
      </Text>
      <Text variant="small" color={colors.textMuted} style={{ marginTop: 4 }}>
        Plan changes Kevin made · no notifications
      </Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 12 }}>
        {['All', 'Tempo', 'Swaps', 'Less of this'].map((c, i) => (
          <Chip key={c} label={c} on={i === 0} />
        ))}
      </View>
      {hidden ? (
        <GlassCard>
          <View style={{ padding: 16 }}>
            <Text variant="body">Tempo hidden</Text>
            <Text variant="small" color={colors.textMuted} style={{ marginTop: 4 }}>
              Kevin turned off Show tempo on Nov 15. Your tempos are kept, but he won’t see them in workouts. Put key cues in notes or chat.
            </Text>
          </View>
        </GlassCard>
      ) : null}
      <GlassCard>
        <View style={{ padding: 16 }}>
          <Text variant="body">Changed tempo · Goblet squat</Text>
          <Text variant="label" color={colors.textMuted}>
            Lower B · AI plan exercise, not locked
          </Text>
          <View style={{ flexDirection: 'row', gap: 6, marginTop: 8 }}>
            <Chip label="TEMPO 3-1-1-1" />
            <Chip label="TEMPO 4-1-X-1" on />
          </View>
          <View style={{ flexDirection: 'row', marginTop: 8 }}>
            <Text variant="label" color={colors.textMuted} style={{ flex: 1 }}>
              Today, 8:02 AM
            </Text>
            <Text variant="small" color={colors.accentInk} style={{ fontWeight: '600' }}>
              Reset to plan
            </Text>
          </View>
        </View>
      </GlassCard>
      <GlassCard>
        <View style={{ padding: 16 }}>
          <Text variant="body">Swapped leg press → hack squat</Text>
          <Text variant="label" color={colors.textMuted}>
            Just today · reason: machine taken
          </Text>
          <View style={{ flexDirection: 'row', marginTop: 8 }}>
            <Text variant="label" color={colors.textMuted} style={{ flex: 1 }}>
              Today, 7:40 AM
            </Text>
            <Text variant="small" color={colors.accentInk} style={{ fontWeight: '600' }}>
              Undo
            </Text>
          </View>
        </View>
      </GlassCard>
      <GlassCard>
        <View style={{ padding: 16 }}>
          <Text variant="body">Less of this · Cable fly</Text>
          <Text variant="label" color={colors.textMuted}>
            Stays in your plan unless you change it
          </Text>
          <Text variant="label" color={colors.textMuted} style={{ marginTop: 8 }}>
            Nov 12
          </Text>
        </View>
      </GlassCard>
      <Text variant="label" color={colors.textMuted} style={{ marginTop: 10 }}>
        Lock an exercise to keep your tempo. Locked tempos can’t be changed by the client.
      </Text>
    </Phase6Shell>
  );
}

export function CoachPicksScreen({ empty = false, full = false, add = false }: { empty?: boolean; full?: boolean; add?: boolean }) {
  const { colors } = useTheme();
  if (empty) {
    return (
      <Phase6Shell tab={3}>
        <BackRow title="Kevin" rightLabel="Done" />
        <Caption style={{ marginTop: 8 }}>Shown in Kevin’s Favorites</Caption>
        <Text variant="title" accessibilityRole="header">
          Coach picks
        </Text>
        <EmptyState
          title="No coach picks yet"
          body="Add up to 20 exercises or workouts for Kevin. They show up in his Favorites as Coach picks from Alex, and gently boost his AI plan."
          cta="Add from library"
        />
      </Phase6Shell>
    );
  }
  const picks = [
    { n: 'Half-kneeling landmine press', note: '“Shoulder-friendly press for your block.”', warn: false },
    { n: 'Belt squat', note: '“Great when your back is tired.”', warn: false },
    { n: 'Rower intervals', note: '“Short, hard, done.”', warn: false },
    { n: 'Pendulum squat', note: '“Use when you’re at Main gym.”', warn: true },
  ];
  const count = full ? 20 : 4;
  const addSheet = (
    <SheetOverlay title="Add a pick · 4 of 20">
          <GlassCard style={{ marginTop: 10 }}>
            <View style={{ height: 44, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Ionicons name="search" size={20} color={colors.textMuted} />
              <Text variant="body" color={colors.textMuted}>
                Search library
              </Text>
            </View>
          </GlassCard>
          {[
            ['Front squat', 'Barbell · Squat · Quads'],
            ['Landmine press, standing', 'Landmine · Push · Shoulders'],
            ['Farmer’s carry', 'Dumbbells · Carry · Full body'],
          ].map(([n, m], i) => (
            <View key={n} style={{ flexDirection: 'row', gap: 12, paddingVertical: 10, borderTopWidth: i ? 1 : 0, borderTopColor: colors.border, alignItems: 'center' }}>
              <Figure />
              <View style={{ flex: 1 }}>
                <Text variant="body">{n}</Text>
                <Text variant="label" color={colors.textMuted}>
                  {m}
                </Text>
              </View>
              <Chip label="Add" />
            </View>
          ))}
    </SheetOverlay>
  );
  return (
    <Phase6Shell tab={3} hideTab={add} overlay={add ? addSheet : undefined}>
      <BackRow title="Kevin" rightLabel="Done" />
      <Caption style={{ marginTop: 8 }}>Shown in Kevin’s Favorites</Caption>
      <Text variant="title" accessibilityRole="header">
        Coach picks
      </Text>
      <GlassCard>
        <View style={{ padding: 16 }}>
          <Caption>Kevin’s preferences</Caption>
          <View style={{ flexDirection: 'row', gap: 16, marginTop: 8 }}>
            <Text variant="body">5 favorites</Text>
            <Text variant="body">2 Less of this</Text>
          </View>
          <Text variant="label" color={colors.textMuted} style={{ marginTop: 4 }}>
            Use them to tailor his plan. Gym: Home (6 items) today. Favorites never override equipment or your locks.
          </Text>
        </View>
      </GlassCard>
      {picks.map((p) => (
        <GlassCard key={p.n}>
          <View style={{ padding: 12, flexDirection: 'row', gap: 10, alignItems: 'flex-start' }}>
            <Ionicons name="menu-outline" size={20} color={colors.textMuted} />
            <Figure />
            <View style={{ flex: 1 }}>
              <Text variant="body">{p.n}</Text>
              <Text variant="small" color={colors.textMuted}>
                {p.note}
              </Text>
              {p.warn ? (
                <Text variant="label" color={colors.textMuted} style={{ marginTop: 4 }}>
                  Not at Kevin’s active gym (Home)
                </Text>
              ) : null}
            </View>
            <Ionicons name="close" size={18} color={colors.textMuted} />
          </View>
        </GlassCard>
      ))}
      <EqualRow left={`Add from library · ${count} of 20`} />
      {full ? (
        <Text variant="label" color={colors.textMuted} style={{ marginTop: 8 }}>
          You’ve reached 20 of 20. Remove a pick to add another.
        </Text>
      ) : null}
    </Phase6Shell>
  );
}

void Banner;
void TextLink;
void PrimaryButton;
