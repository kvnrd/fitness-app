import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Redirect } from 'expo-router';
import { useSession } from '../../auth/SessionProvider';
import { StudioClientsScreen } from '../../studio/screens/StudioScreens';
import { StudioLockedScreen } from '../../studio/screens/StudioScreens';
import { Button, Chip, SectionHeader, Text } from '../../components/ui';
import { DAY_KEYS, DAY_LABELS, DayKey, Exercise, ExerciseKind, LOG_FIELDS, LogField } from '../../data/types';
import { useAppStore } from '../../state/AppStore';
import { useTheme } from '../../theme/ThemeProvider';
import { ScreenBackground } from '../../components/ScreenAtmosphere';
import { radius, space } from '../../theme/tokens';

const DEFAULT_FIELDS: Record<ExerciseKind, LogField[]> = {
  strength: ['weight', 'reps'],
  cardio: ['time', 'power', 'calories'],
};

function Field({ label, ...props }: { label: string } & React.ComponentProps<typeof TextInput>) {
  const { colors, type } = useTheme();
  return (
    <View style={{ gap: 6, flex: props.multiline ? undefined : 1 }}>
      <Text variant="label" color={colors.textMuted}>
        {label}
      </Text>
      <TextInput
        placeholderTextColor={colors.textMuted}
        selectionColor={colors.accentInk}
        {...props}
        style={[
          styles.input,
          { ...type.body, color: colors.text, backgroundColor: colors.surfaceSunken, borderColor: colors.border },
          props.multiline && { height: 88, textAlignVertical: 'top', paddingTop: 12 },
        ]}
      />
    </View>
  );
}

function AddExercise({ day, onDone }: { day: DayKey; onDone: () => void }) {
  const { colors } = useTheme();
  const { addExercise } = useAppStore();
  const [kind, setKind] = useState<ExerciseKind>('strength');
  const [name, setName] = useState('');
  const [sets, setSets] = useState('3');
  const [target, setTarget] = useState('');
  const [description, setDescription] = useState('');
  const [fields, setFields] = useState<LogField[]>(DEFAULT_FIELDS.strength);

  const toggle = (f: LogField) => setFields((cur) => (cur.includes(f) ? cur.filter((x) => x !== f) : [...cur, f]));
  const valid = name.trim().length > 0 && fields.length > 0 && Number(sets) > 0;

  return (
    <View style={[styles.panel, { backgroundColor: colors.surface }]}>
      <View style={{ flexDirection: 'row', gap: space.xs }}>
        {(['strength', 'cardio'] as ExerciseKind[]).map((k) => (
          <Chip
            key={k}
            label={k === 'strength' ? 'Strength' : 'Cardio'}
            active={kind === k}
            onPress={() => {
              setKind(k);
              setFields(DEFAULT_FIELDS[k]);
            }}
          />
        ))}
      </View>
      <Field label="Exercise name" value={name} onChangeText={setName} placeholder={kind === 'strength' ? 'e.g. Front Squat' : 'e.g. Ski Erg'} />
      <View style={{ flexDirection: 'row', gap: space.sm }}>
        <Field label={kind === 'strength' ? 'Sets' : 'Rounds'} value={sets} onChangeText={setSets} keyboardType="number-pad" />
        <Field label="Target" value={target} onChangeText={setTarget} placeholder={kind === 'strength' ? '8 reps @ RPE 7' : '20 min steady'} />
      </View>
      <Field
        label="Description and cues"
        value={description}
        onChangeText={setDescription}
        multiline
        placeholder="What should they focus on?"
      />
      <View style={{ gap: 8 }}>
        <Text variant="label" color={colors.textMuted}>
          Client logs
        </Text>
        <View style={styles.chips}>
          {(Object.keys(LOG_FIELDS) as LogField[]).map((f) => (
            <Chip key={f} label={`${LOG_FIELDS[f].label} (${LOG_FIELDS[f].unit})`} active={fields.includes(f)} onPress={() => toggle(f)} />
          ))}
        </View>
      </View>
      <View style={{ flexDirection: 'row', gap: space.sm }}>
        <Button label="Cancel" variant="secondary" style={{ flex: 1 }} onPress={onDone} />
        <Button
          label="Add exercise"
          style={{ flex: 1, opacity: valid ? 1 : 0.4 }}
          disabled={!valid}
          onPress={() => {
            const ex: Exercise = {
              id: `${day}_${Date.now()}`,
              name: name.trim(),
              kind,
              sets: Number(sets),
              target: target.trim() || (kind === 'strength' ? `${sets} sets` : 'Steady effort'),
              description: description.trim(),
              fields,
              restSeconds: kind === 'strength' ? 90 : undefined,
            };
            addExercise(day, ex);
            onDone();
          }}
        />
      </View>
    </View>
  );
}

/** Pending coaches see the lock. Verified coaches land on the client list. */
export default function StudioScreen() {
  const { isStudioCoach, isVerifiedCoach } = useSession();
  if (!isStudioCoach) return <Redirect href="/" />;
  if (!isVerifiedCoach) return <StudioLockedScreen />;
  return <StudioClientsScreen />;
}

function StudioEditor() {
  const { colors, fonts } = useTheme();
  const insets = useSafeAreaInsets();
  const { program, updateDay, removeExercise } = useAppStore();
  const [day, setDay] = useState<DayKey>('mon');
  const [adding, setAdding] = useState(false);
  const w = program.days[day];

  return (
    <ScreenBackground>
    <ScrollView
      style={{ flex: 1, backgroundColor: 'transparent' }}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + space.lg }]}
      keyboardShouldPersistTaps="handled"
    >
      <View style={{ gap: 4 }}>
        <Text variant="hero" accessibilityRole="header">
          Your week
        </Text>
        <Text variant="body" color={colors.textSecondary}>
          Build each day of {program.trainer.programName}. Clients see changes on their Train tab right away.
        </Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: space.xs }}>
        {DAY_KEYS.map((d) => (
          <Chip
            key={d}
            label={program.days[d].rest ? `${DAY_LABELS[d].short}, rest` : `${DAY_LABELS[d].short}, ${program.days[d].exercises.length}`}
            active={d === day}
            onPress={() => {
              setDay(d);
              setAdding(false);
            }}
          />
        ))}
      </ScrollView>

      <View style={{ gap: space.md }}>
        <Text variant="title">{DAY_LABELS[day].long}</Text>
        <View style={{ flexDirection: 'row', gap: space.sm }}>
          <Field label="Title" value={w.title} onChangeText={(t) => updateDay(day, { title: t })} />
        </View>
        <Field label="Focus" value={w.focus} onChangeText={(t) => updateDay(day, { focus: t })} />
        <View style={{ flexDirection: 'row', gap: space.xs }}>
          <Chip label="Training day" active={!w.rest} onPress={() => updateDay(day, { rest: false })} />
          <Chip label="Rest day" active={!!w.rest} onPress={() => updateDay(day, { rest: true })} />
        </View>
      </View>

      <Pressable style={[styles.upload, { borderColor: colors.borderStrong }]} accessibilityRole="button" accessibilityLabel="Upload walkthrough video">
        <View style={[styles.uploadIcon, { backgroundColor: colors.accentSoft }]}>
          <Ionicons name="cloud-upload-outline" size={22} color={colors.coach} />
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <Text variant="bodyStrong">{w.video ? w.video.title : 'Upload walkthrough video'}</Text>
          <Text variant="small" color={colors.textMuted}>
            {w.video ? `${w.video.durationLabel}. Video upload arrives with accounts.` : 'MP4 or MOV. Clients see it at the top of the day.'}
          </Text>
        </View>
      </Pressable>

      <View>
        <SectionHeader title={`Exercises (${w.exercises.length})`} />
        <View>
          {w.exercises.map((e, i) => (
            <View key={e.id} style={[styles.exRow, { borderTopColor: colors.border }]}>
              <Text style={{ width: 24, fontFamily: fonts.displayBold, fontSize: 22 }} color={colors.textMuted}>
                {i + 1}
              </Text>
              <View style={{ flex: 1, gap: 2 }}>
                <Text variant="bodyStrong">{e.name}</Text>
                <Text variant="small" color={colors.textMuted} numberOfLines={1}>
                  {e.sets} × {e.target}, logs {e.fields.map((f) => LOG_FIELDS[f].label.toLowerCase()).join(', ')}
                </Text>
              </View>
              <Pressable
                onPress={() => removeExercise(day, e.id)}
                accessibilityRole="button"
                accessibilityLabel={`Remove ${e.name}`}
                hitSlop={8}
                style={[styles.remove, { backgroundColor: colors.surfaceRaised }]}
              >
                <Ionicons name="trash-outline" size={16} color={colors.textMuted} />
              </Pressable>
            </View>
          ))}
          {w.exercises.length === 0 && !adding ? (
            <Text variant="small" color={colors.textMuted}>
              No exercises yet.
            </Text>
          ) : null}
        </View>
      </View>

      {adding ? (
        <AddExercise day={day} onDone={() => setAdding(false)} />
      ) : (
        <Button
          label="Add exercise"
          variant="secondary"
          icon={<Ionicons name="add" size={18} color={colors.text} />}
          onPress={() => setAdding(true)}
        />
      )}
    </ScrollView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: space.lg, paddingBottom: space['4xl'], gap: space['2xl'], maxWidth: 720, width: '100%', alignSelf: 'center' },
  input: {
    borderRadius: radius.input,
    borderWidth: 1,
    height: 46,
    paddingHorizontal: space.sm,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.xs },
  upload: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    padding: space.md,
    borderRadius: radius.card,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  panel: {
    gap: space.md,
    padding: space.md,
    borderRadius: radius.card,
  },
  uploadIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.tile,
    alignItems: 'center',
    justifyContent: 'center',
  },
  exRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    paddingVertical: space.md,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  remove: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
