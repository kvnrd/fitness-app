import test from 'node:test';
import assert from 'node:assert/strict';
import {
  allowedVideoUri,
  dateForDay,
  dayForDate,
  formatTime,
  fromRow,
  logsFromRows,
  mapPlan,
  parseTime,
  previousFromRows,
  toRowValues,
  weekStart,
  type PlanRow,
  type SetLogRow,
} from '../../src/data/planMapping.ts';

const plan: PlanRow = {
  id: 'p1',
  name: 'Hybrid Athlete',
  week_label: 'Week 1 of 8',
  owner_id: 'coach1',
  plan_days: [
    {
      id: 'd1',
      day_key: 'mon',
      title: 'Lower Strength',
      focus: 'Squat',
      duration_min: 55,
      rest: false,
      key_points: ['Brace.'],
      video_title: 'Walkthrough',
      video_duration: '4:12',
      video_uri: 'https://evil.example.net/v.mp4',
      exercises: [
        { id: 'e2', name: 'RDL', kind: 'strength', sets: 3, target: '8', fields: ['weight', 'reps'], description: '', rest_seconds: 120, position: 1 },
        { id: 'e1', name: 'Squat', kind: 'strength', sets: 4, target: '6', fields: ['weight', 'reps', 'bogus'], description: 'Sit.', rest_seconds: null, position: 0 },
      ],
    },
    { id: 'd2', day_key: 'tue', title: 'Row', focus: '', duration_min: 30, rest: false, key_points: null, video_title: null, video_duration: null, video_uri: null, exercises: [
      { id: 'e3', name: 'Row', kind: 'cardio', sets: 2, target: '4 min', fields: ['time', 'distance'], description: '', rest_seconds: null, position: 0 },
    ] },
    { id: 'dx', day_key: 'funday', title: 'x', focus: '', duration_min: 0, rest: false, key_points: [], video_title: null, video_duration: null, video_uri: null, exercises: [] },
  ],
};

test('mapPlan fills missing days as rest, sorts exercises, drops unknown fields', () => {
  const p = mapPlan(plan);
  assert.equal(p.trainer.programName, 'Hybrid Athlete');
  assert.equal(p.weekLabel, 'Week 1 of 8');
  assert.deepEqual(p.days.mon.exercises.map((e) => e.id), ['e1', 'e2']);
  assert.deepEqual(p.days.mon.exercises[0].fields, ['weight', 'reps']);
  assert.equal(p.days.mon.exercises[0].restSeconds, undefined);
  assert.equal(p.days.mon.video?.title, 'Walkthrough');
  assert.equal(p.days.tue.video, undefined);
  for (const d of ['wed', 'thu', 'fri', 'sat', 'sun'] as const) {
    assert.equal(p.days[d].rest, true);
    assert.equal(p.days[d].exercises.length, 0);
  }
});

test('plan videos only play from allowlisted https hosts', () => {
  assert.equal(mapPlan(plan).days.mon.video?.uri, undefined);
  assert.equal(allowedVideoUri('https://stream.mux.com/a.m3u8', ['stream.mux.com']), 'https://stream.mux.com/a.m3u8');
  assert.equal(allowedVideoUri('http://stream.mux.com/a.m3u8', ['stream.mux.com']), undefined);
  assert.equal(allowedVideoUri('https://stream.mux.com.evil.net/a', ['stream.mux.com']), undefined);
  assert.equal(allowedVideoUri('not a url', ['stream.mux.com']), undefined);
});

test('weekStart is the local Monday; dateForDay walks the week', () => {
  assert.equal(weekStart(new Date(2026, 10, 18)), '2026-11-16'); // Wednesday
  assert.equal(weekStart(new Date(2026, 10, 16)), '2026-11-16'); // Monday
  assert.equal(weekStart(new Date(2026, 10, 22)), '2026-11-16'); // Sunday
  assert.equal(weekStart(new Date(2027, 0, 1)), '2026-12-28'); // across a year
  assert.equal(dateForDay('sun', '2026-12-28'), '2027-01-03');
  assert.equal(dayForDate('2026-11-18', '2026-11-16'), 'wed');
  assert.equal(dayForDate('2026-11-30', '2026-11-16'), null);
});

test('time parses mm:ss, h:mm:ss and seconds, and formats back', () => {
  assert.equal(parseTime('4:00'), 240);
  assert.equal(parseTime('1:02:03'), 3723);
  assert.equal(parseTime('95'), 95);
  assert.equal(parseTime('4:75'), null);
  assert.equal(parseTime('abc'), null);
  assert.equal(parseTime(''), null);
  assert.equal(formatTime(240), '4:00');
  assert.equal(formatTime(3723), '1:02:03');
});

test('toRowValues stores only clean numbers and respects the column checks', () => {
  assert.deepEqual(toRowValues({ weight: '185.5', reps: '6', rpe: '8', done: true }), {
    weight: 185.5, reps: 6, time_seconds: null, distance: null, calories: null, power: null, rpe: 8, done: true,
  });
  const bad = toRowValues({ weight: '-5', reps: '6.5', rpe: '11', distance: '0,68', calories: 'lots' });
  assert.equal(bad.weight, null);
  assert.equal(bad.reps, null);
  assert.equal(bad.rpe, null);
  assert.equal(bad.distance, 0.68);
  assert.equal(bad.calories, null);
  assert.equal(bad.done, false);
});

const row = (o: Partial<SetLogRow>): SetLogRow => ({
  exercise_id: 'e1', performed_on: '2026-11-16', set_index: 0, weight: null, reps: null, time_seconds: null,
  distance: null, calories: null, power: null, rpe: null, done: false, ...o,
});

test('fromRow turns numeric columns back into typed strings', () => {
  assert.deepEqual(fromRow(row({ weight: '185.50', reps: 6, done: true })), { weight: '185.5', reps: '6', done: true });
  assert.deepEqual(fromRow(row({ time_seconds: 240, distance: 0.68 })), { time: '4:00', distance: '0.68' });
});

test('logsFromRows keys this week by plan day and fills gaps', () => {
  const p = mapPlan(plan);
  const logs = logsFromRows(
    [
      row({ set_index: 2, weight: 195, reps: 6 }),
      row({ exercise_id: 'e3', performed_on: '2026-11-17', set_index: 0, time_seconds: 240 }),
      row({ exercise_id: 'e3', performed_on: '2026-11-18', set_index: 1, time_seconds: 250 }), // wrong date for Tuesday
      row({ exercise_id: 'gone', set_index: 0, reps: 1 }),
    ],
    p,
    '2026-11-16',
  );
  assert.deepEqual(logs.mon?.e1, [{}, {}, { weight: '195', reps: '6' }]);
  assert.deepEqual(logs.tue?.e3, [{ time: '4:00' }]);
  assert.equal(Object.keys(logs).length, 2);
});

test('previousFromRows keeps only the latest earlier date per exercise', () => {
  const prev = previousFromRows(
    [
      row({ performed_on: '2026-11-09', set_index: 0, weight: 185, reps: 6 }),
      row({ performed_on: '2026-11-09', set_index: 1, weight: 195, reps: 6 }),
      row({ performed_on: '2026-11-02', set_index: 0, weight: 175, reps: 6 }),
      row({ performed_on: '2026-11-16', set_index: 0, weight: 999, reps: 1 }),
    ],
    '2026-11-16',
  );
  assert.deepEqual(prev.e1, [{ weight: '185', reps: '6' }, { weight: '195', reps: '6' }]);
});

test('mapPlan carries the AI flag and overview only when set', () => {
  assert.equal(mapPlan(plan).aiGenerated, undefined);
  assert.equal(mapPlan(plan).overview, undefined);
  const ai = mapPlan({ ...plan, ai_generated: true, overview: 'Three full-body days.' });
  assert.equal(ai.aiGenerated, true);
  assert.equal(ai.overview, 'Three full-body days.');
});
