import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Card, Chip, SectionLabel, Text } from '../../components/ui';
import { DAY_KEYS, DAY_LABELS, DayKey, Exercise, ExerciseKind, LOG_FIELDS, LogField } from '../../data/types';
import { useAppStore } from '../../state/AppStore';
import { colors, radius, space, type } from '../../theme/tokens';

const DEFAULT_FIELDS: Record<ExerciseKind, LogField[]> = {
  strength: ['weight', 'reps'],
  cardio: ['time', 'power', 'calories'],
};

function Field({ label, ...props }: { label: string } & React.ComponentProps<typeof TextInput>) {
  return (
    <View style={{ gap: 6, flex: props.multiline ? undefined : 1 }}>
      <Text variant="label" color={colors.textMuted}>
        {label}
      </Text>
      <TextInput
        placeholderTextColor={colors.textMuted}
        selectionColor={colors.accent}
        {...props}
        style={[styles.input, props.multiline && { height: 88, textAlignVertical: 'top', paddingTop: 12 }]}
      />
    </View>
  );
}

function AddExercise({ day, onDone }: { day: DayKey; onDone: () => void }) {
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
    <Card raised style={{ gap: space.md }}>
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
    </Card>
  );
}

export default function StudioScreen() {
  const insets = useSafeAreaInsets();
  const { program, updateDay, removeExercise } = useAppStore();
  const [day, setDay] = useState<DayKey>('mon');
  const [adding, setAdding] = useState(false);
  const w = program.days[day];

  return (
    <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + space.lg }]} keyboardShouldPersistTaps="handled">
      <View style={{ gap: 4 }}>
        <Text variant="label" color={colors.accent}>
          Coach Studio
        </Text>
        <Text variant="title">{program.trainer.programName}</Text>
        <Text variant="small" color={colors.textSecondary}>
          Build each day of the week. Changes show up on the Train tab right away.
        </Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: space.xs }}>
        {DAY_KEYS.map((d) => (
          <Chip
            key={d}
            label={`${DAY_LABELS[d].short} · ${program.days[d].rest ? 'Rest' : program.days[d].exercises.length}`}
            active={d === day}
            onPress={() => {
              setDay(d);
              setAdding(false);
            }}
          />
        ))}
      </ScrollView>

      <Card style={{ gap: space.md }}>
        <SectionLabel>{DAY_LABELS[day].long}</SectionLabel>
        <View style={{ flexDirection: 'row', gap: space.sm }}>
          <Field label="Title" value={w.title} onChangeText={(t) => updateDay(day, { title: t })} />
        </View>
        <Field label="Focus" value={w.focus} onChangeText={(t) => updateDay(day, { focus: t })} />
        <View style={{ flexDirection: 'row', gap: space.xs }}>
          <Chip label="Training day" active={!w.rest} onPress={() => updateDay(day, { rest: false })} />
          <Chip label="Rest day" active={!!w.rest} onPress={() => updateDay(day, { rest: true })} />
        </View>
      </Card>

      <Pressable style={styles.upload} accessibilityRole="button" accessibilityLabel="Upload walkthrough video">
        <View style={styles.uploadIcon}>
          <Ionicons name="cloud-upload-outline" size={22} color={colors.accent} />
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <Text variant="bodyStrong">{w.video ? w.video.title : 'Upload walkthrough video'}</Text>
          <Text variant="small" color={colors.textMuted}>
            {w.video ? `${w.video.durationLabel} · Replace video` : 'MP4 or MOV. Clients see it at the top of the day.'}
          </Text>
        </View>
        <Text variant="small" color={colors.textMuted}>
          Soon
        </Text>
      </Pressable>

      <View>
        <SectionLabel>{`Exercises (${w.exercises.length})`}</SectionLabel>
        <View style={{ gap: space.xs }}>
          {w.exercises.map((e, i) => (
            <View key={e.id} style={styles.exRow}>
              <Text variant="small" color={colors.textMuted} style={{ width: 22, fontWeight: '700' }}>
                {String(i + 1).padStart(2, '0')}
              </Text>
              <View style={{ flex: 1, gap: 2 }}>
                <Text variant="bodyStrong">{e.name}</Text>
                <Text variant="small" color={colors.textMuted} numberOfLines={1}>
                  {e.sets} × {e.target} · logs {e.fields.map((f) => LOG_FIELDS[f].label.toLowerCase()).join(', ')}
                </Text>
              </View>
              <Pressable
                onPress={() => removeExercise(day, e.id)}
                accessibilityRole="button"
                accessibilityLabel={`Remove ${e.name}`}
                hitSlop={8}
                style={styles.remove}
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
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: space.lg, paddingBottom: space.xxl, gap: space.xl, maxWidth: 720, width: '100%', alignSelf: 'center' },
  input: {
    ...type.body,
    color: colors.text,
    backgroundColor: colors.surfaceSunken,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    height: 46,
    paddingHorizontal: space.sm,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.xs },
  upload: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    padding: space.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.borderStrong,
  },
  uploadIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  exRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    padding: space.md,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  remove: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceRaised,
  },
});
