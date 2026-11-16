import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { DayKey, Exercise, LOG_FIELDS, SetLog } from '../data/types';
import { rowsFor, useAppStore } from '../state/AppStore';
import { useTheme } from '../theme/ThemeProvider';
import { radius, space } from '../theme/tokens';
import { Text } from './ui';

function lastLabel(exercise: Exercise, prev?: SetLog) {
  if (!prev) return '–';
  if (exercise.fields.includes('weight') && prev.weight && prev.reps) return `${prev.weight}×${prev.reps}`;
  const first = exercise.fields.find((f) => prev[f]);
  return first ? String(prev[first]) : '–';
}

/** One exercise as a ledger entry: name and target, coach's cue, then a row per set. */
export function ExerciseCard({ day, exercise, index }: { day: DayKey; exercise: Exercise; index: number }) {
  const { colors, fonts } = useTheme();
  const { logs, previous, updateSet, toggleSetDone } = useAppStore();
  const [open, setOpen] = useState(index === 0);
  const rows = rowsFor(logs[day], exercise);
  const done = rows.filter((r) => r.done).length;
  const complete = done === exercise.sets;
  // Many fields on a phone: drop the Last column (it still shows as the placeholder).
  const compact = exercise.fields.length >= 3;
  const unit = exercise.kind === 'cardio' ? (exercise.sets === 1 ? 'effort' : 'rounds') : 'sets';

  return (
    <View style={[styles.entry, { borderTopColor: colors.border }]}>
      <Pressable
        onPress={() => setOpen((o) => !o)}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        accessibilityLabel={`${exercise.name}, ${done} of ${exercise.sets} ${unit} done`}
        style={styles.header}
      >
        <Text style={[styles.index, { fontFamily: fonts.displayBold }]} color={complete ? colors.accentInk : colors.textMuted}>
          {index + 1}
        </Text>
        <View style={{ flex: 1, gap: 2 }}>
          <Text variant="heading" color={complete ? colors.textSecondary : colors.text}>
            {exercise.name}
          </Text>
          <Text variant="small" color={colors.textSecondary}>
            {exercise.sets} {unit}, {exercise.target}
          </Text>
        </View>
        {complete ? (
          <Ionicons name="checkmark-circle" size={22} color={colors.accentInk} />
        ) : (
          <Text variant="small" color={colors.textMuted} style={{ fontVariant: ['tabular-nums'] }}>
            {done}/{exercise.sets}
          </Text>
        )}
      </Pressable>

      {open ? (
        <View style={[styles.body, compact && { paddingLeft: 0 }]}>
          {exercise.description ? (
            <Text variant="small" color={colors.coach} style={{ maxWidth: 560 }}>
              {exercise.description}
            </Text>
          ) : null}

          <View style={{ gap: 4 }}>
            <View style={styles.row}>
              <Text variant="label" color={colors.textMuted} style={styles.colSet}>
                Set
              </Text>
              {compact ? null : (
                <Text variant="label" color={colors.textMuted} style={styles.colLast}>
                  Last
                </Text>
              )}
              {exercise.fields.map((f) => (
                <Text key={f} variant="label" color={colors.textMuted} style={styles.colField} numberOfLines={1}>
                  {LOG_FIELDS[f].short}
                </Text>
              ))}
              <View style={styles.colCheck} />
            </View>

            {rows.map((row, i) => {
              const prev = previous[exercise.id]?.[i];
              return (
                <View key={i} style={[styles.row, styles.setRow, row.done && { backgroundColor: colors.accentSoft }]}>
                  <Text style={[styles.setNo, styles.colSet, { fontFamily: fonts.displayBold }]} color={row.done ? colors.text : colors.textSecondary}>
                    {i + 1}
                  </Text>
                  {compact ? null : (
                    <Text variant="small" color={colors.textMuted} style={[styles.colLast, { fontVariant: ['tabular-nums'] }]}>
                      {lastLabel(exercise, prev)}
                    </Text>
                  )}
                  {exercise.fields.map((f) => (
                    <View key={f} style={styles.colField}>
                      <TextInput
                        value={row[f] ?? ''}
                        onChangeText={(v) => updateSet(day, exercise, i, f, v)}
                        placeholder={String(prev?.[f] ?? '–')}
                        placeholderTextColor={colors.placeholder}
                        keyboardType={LOG_FIELDS[f].keyboard === 'numeric' ? 'decimal-pad' : 'numbers-and-punctuation'}
                        accessibilityLabel={`Set ${i + 1} ${LOG_FIELDS[f].label}`}
                        selectionColor={colors.accentInk}
                        style={[
                          styles.input,
                          { fontFamily: fonts.displayBold, color: colors.text, backgroundColor: colors.surface },
                          compact && { fontSize: 20 },
                        ]}
                      />
                    </View>
                  ))}
                  <Pressable
                    onPress={() => {
                      if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                      toggleSetDone(day, exercise, i);
                    }}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: !!row.done }}
                    accessibilityLabel={`Set ${i + 1} done`}
                    hitSlop={8}
                    style={styles.colCheck}
                  >
                    <View
                      style={[
                        styles.check,
                        { borderColor: colors.borderStrong },
                        row.done && { backgroundColor: colors.accent, borderColor: colors.accent },
                      ]}
                    >
                      {row.done ? <Ionicons name="checkmark" size={18} color={colors.accentText} /> : null}
                    </View>
                  </Pressable>
                </View>
              );
            })}
          </View>

          {exercise.restSeconds ? (
            <Text variant="small" color={colors.textMuted}>
              Rest {Math.floor(exercise.restSeconds / 60)}:{String(exercise.restSeconds % 60).padStart(2, '0')} between{' '}
              {exercise.kind === 'cardio' ? 'rounds' : 'sets'}
            </Text>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  entry: { borderTopWidth: StyleSheet.hairlineWidth, paddingVertical: space.md },
  header: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  index: { fontSize: 28, lineHeight: 30, width: 28 },
  body: { gap: space.md, marginTop: space.md, paddingLeft: 28 + space.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  setRow: { borderRadius: radius.tile, paddingVertical: 4 },
  colSet: { width: 28, textAlign: 'center' },
  setNo: { fontSize: 20, lineHeight: 24 },
  colLast: { width: 58 },
  colField: { flex: 1, minWidth: 0 },
  colCheck: { width: 44, alignItems: 'center' },
  input: {
    fontSize: 24,
    borderRadius: radius.input,
    height: 46,
    textAlign: 'center',
    paddingHorizontal: 2,
    minWidth: 0,
    width: '100%',
    fontVariant: ['tabular-nums'],
  },
  check: {
    width: 34,
    height: 34,
    borderRadius: radius.tile,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
