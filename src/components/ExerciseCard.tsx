import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { DayKey, Exercise, LOG_FIELDS } from '../data/types';
import { rowsFor, useAppStore } from '../state/AppStore';
import { colors, radius, space, type } from '../theme/tokens';
import { Text } from './ui';

function prevLabel(exercise: Exercise, prev?: Record<string, string | boolean | undefined>) {
  if (!prev) return '—';
  if (exercise.fields.includes('weight') && prev.weight && prev.reps) return `${prev.weight}×${prev.reps}`;
  const first = exercise.fields.find((f) => prev[f]);
  return first ? String(prev[first]) : '—';
}

export function ExerciseCard({ day, exercise, index }: { day: DayKey; exercise: Exercise; index: number }) {
  const { logs, previous, updateSet, toggleSetDone } = useAppStore();
  const [open, setOpen] = useState(index === 0);
  const rows = rowsFor(logs[day], exercise);
  const done = rows.filter((r) => r.done).length;
  const complete = done === exercise.sets;
  // Many fields on a phone: drop the Last column (it still shows as the placeholder) and tighten type.
  const compact = exercise.fields.length >= 3;

  return (
    <View style={[styles.card, complete && { borderColor: colors.accent }]}>
      <Pressable
        onPress={() => setOpen((o) => !o)}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        style={styles.header}
      >
        <View style={[styles.index, complete && { backgroundColor: colors.accent }]}>
          {complete ? (
            <Ionicons name="checkmark" size={16} color={colors.accentText} />
          ) : (
            <Text variant="small" color={colors.textSecondary} style={{ fontWeight: '700' }}>
              {String(index + 1).padStart(2, '0')}
            </Text>
          )}
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <Text variant="heading">{exercise.name}</Text>
          <Text variant="small" color={colors.textSecondary}>
            {exercise.sets} {exercise.kind === 'cardio' ? (exercise.sets === 1 ? 'effort' : 'rounds') : 'sets'} · {exercise.target}
          </Text>
        </View>
        <Text variant="small" color={colors.textMuted} style={{ fontVariant: ['tabular-nums'] }}>
          {done}/{exercise.sets}
        </Text>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={18} color={colors.textMuted} />
      </Pressable>

      {open ? (
        <View style={{ gap: space.md }}>
          <Text variant="small" color={colors.textSecondary}>
            {exercise.description}
          </Text>

          <View style={styles.table}>
            <View style={styles.row}>
              <Text variant="label" color={colors.textMuted} style={styles.colSet}>
                Set
              </Text>
              {compact ? null : (
                <Text variant="label" color={colors.textMuted} style={styles.colPrev}>
                  Last
                </Text>
              )}
              {exercise.fields.map((f) => (
                <Text key={f} variant="label" color={colors.textMuted} style={[styles.colField, { textAlign: 'center', letterSpacing: 0.6 }]} numberOfLines={1}>
                  {LOG_FIELDS[f].short}
                </Text>
              ))}
              <View style={styles.colCheck} />
            </View>

            {rows.map((row, i) => (
              <View key={i} style={[styles.row, styles.dataRow, row.done && styles.rowDone]}>
                <Text variant="bodyStrong" color={row.done ? colors.accent : colors.text} style={styles.colSet}>
                  {i + 1}
                </Text>
                {compact ? null : (
                  <Text variant="small" color={colors.textMuted} style={[styles.colPrev, { fontVariant: ['tabular-nums'] }]}>
                    {prevLabel(exercise, previous[exercise.id]?.[i])}
                  </Text>
                )}
                {exercise.fields.map((f) => (
                  <View key={f} style={styles.colField}>
                    <TextInput
                      value={row[f] ?? ''}
                      onChangeText={(v) => updateSet(day, exercise, i, f, v)}
                      placeholder={String(previous[exercise.id]?.[i]?.[f] ?? '–')}
                      placeholderTextColor={colors.textMuted}
                      keyboardType={LOG_FIELDS[f].keyboard === 'numeric' ? 'decimal-pad' : 'numbers-and-punctuation'}
                      accessibilityLabel={`Set ${i + 1} ${LOG_FIELDS[f].label}`}
                      selectionColor={colors.accent}
                      style={[styles.input, compact && styles.inputCompact, row.done && { color: colors.textSecondary }]}
                    />
                  </View>
                ))}
                <Pressable
                  onPress={() => {
                    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    toggleSetDone(day, exercise, i);
                  }}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: !!row.done }}
                  accessibilityLabel={`Mark set ${i + 1} done`}
                  hitSlop={8}
                  style={[styles.colCheck, styles.check, row.done && styles.checkOn]}
                >
                  <Ionicons name="checkmark" size={18} color={row.done ? colors.accentText : colors.textMuted} />
                </Pressable>
              </View>
            ))}
          </View>

          {exercise.restSeconds ? (
            <View style={styles.rest}>
              <Ionicons name="timer-outline" size={14} color={colors.textMuted} />
              <Text variant="small" color={colors.textMuted}>
                Rest {Math.floor(exercise.restSeconds / 60)}:{String(exercise.restSeconds % 60).padStart(2, '0')} between{' '}
                {exercise.kind === 'cardio' ? 'rounds' : 'sets'}
              </Text>
            </View>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.md,
    gap: space.md,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  index: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceRaised,
    alignItems: 'center',
    justifyContent: 'center',
  },
  table: { gap: 6 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dataRow: {
    backgroundColor: colors.surfaceSunken,
    borderRadius: radius.sm,
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  rowDone: { backgroundColor: colors.accentSoft },
  colSet: { width: 30, textAlign: 'center' },
  colPrev: { width: 64 },
  colField: { flex: 1, minWidth: 0 },
  colCheck: { width: 40, alignItems: 'center' },
  input: {
    ...type.bodyStrong,
    fontVariant: ['tabular-nums'],
    color: colors.text,
    backgroundColor: colors.surfaceRaised,
    borderRadius: 8,
    height: 40,
    textAlign: 'center',
    paddingHorizontal: 4,
    minWidth: 0,
    width: '100%',
  },
  inputCompact: { fontSize: 14 },
  check: {
    height: 36,
    width: 36,
    borderRadius: 18,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  checkOn: { backgroundColor: colors.accent, borderColor: colors.accent },
  rest: { flexDirection: 'row', alignItems: 'center', gap: 6 },
});
