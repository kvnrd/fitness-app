import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_E1RM_FORMULA,
  DEFAULT_E1RM_REP_CAP,
  PR_REPS,
  PR_WEIGHT_LB,
  bestSetE1rmLb,
  e1rmLb,
  isWithinPrInputLimits,
  sessionVolumeLb,
} from '../../src/progress/e1rm.ts';
import { PR_MARGIN_LB, summarizeStrengthSessions } from '../../src/progress/prs.ts';
import {
  MAX_CHART_POINTS,
  buildWeightChart,
  downsample,
  ema,
  filterRange,
} from '../../src/progress/charts.ts';
import {
  DEFAULT_DISTANCE_UNIT,
  DEFAULT_MASS_UNIT,
  massFromLb,
  massToLb,
  paceSecPerUnit,
  rowSplitSecPer500,
  speedUnitPerHour,
} from '../../src/progress/units.ts';

test('defaults: Epley with a 10-rep cap; units default to lb and mi', () => {
  assert.equal(DEFAULT_E1RM_FORMULA, 'epley');
  assert.equal(DEFAULT_E1RM_REP_CAP, 10);
  assert.equal(DEFAULT_MASS_UNIT, 'lb');
  assert.equal(DEFAULT_DISTANCE_UNIT, 'mi');
});

test('Epley and Brzycki formulas at a known set', () => {
  // 135 lb × 8
  assert.equal(e1rmLb(135, 8, { formula: 'epley' }), 135 * (1 + 8 / 30));
  assert.equal(e1rmLb(135, 8, { formula: 'brzycki' }), (135 * 36) / (37 - 8));
  assert.ok(e1rmLb(135, 8, { formula: 'epley' })! > e1rmLb(135, 8, { formula: 'brzycki' })!);
});

test('sets over the cap or outside input limits have no e1RM', () => {
  assert.equal(e1rmLb(135, 11, { cap: 10 }), null);
  assert.equal(e1rmLb(135, 10, { cap: 10 }), 135 * (1 + 10 / 30));
  assert.equal(e1rmLb(49, 5), null);
  assert.equal(e1rmLb(701, 5), null);
  assert.equal(e1rmLb(135, 0), null);
  assert.equal(e1rmLb(135, 51), null);
  assert.equal(isWithinPrInputLimits(50, 1), true);
  assert.equal(isWithinPrInputLimits(700, 50), true);
  assert.equal(isWithinPrInputLimits(PR_WEIGHT_LB.min - 1, 5), false);
  assert.equal(isWithinPrInputLimits(135, PR_REPS.max + 1), false);
});

test('excludeFromPrs drops a set from e1RM but volume still counts it', () => {
  const sets = [
    { weightLb: 135, reps: 8, excludeFromPrs: true },
    { weightLb: 185, reps: 3 },
  ];
  assert.equal(bestSetE1rmLb(sets), e1rmLb(185, 3));
  assert.equal(sessionVolumeLb(sets), 135 * 8 + 185 * 3);
});

test('a session is a PR only when e1RM beats the previous best by more than 0.5 lb', () => {
  const sessions = [
    { performedOn: '2026-01-01', sets: [{ weightLb: 185, reps: 5 }] },
    { performedOn: '2026-01-08', sets: [{ weightLb: 185, reps: 5 }] }, // same e1RM
    { performedOn: '2026-01-15', sets: [{ weightLb: 186, reps: 5 }] }, // clearly over 0.5 lb
  ];
  const rows = summarizeStrengthSessions(sessions);
  assert.equal(rows[0]!.isPr, true); // first eligible session is a PR
  assert.equal(rows[1]!.isPr, false);
  assert.equal(rows[2]!.isPr, true);
  assert.ok(rows[2]!.e1rmLb! - rows[0]!.e1rmLb! > PR_MARGIN_LB);

  // Exactly +0.5 lb on the e1RM is not a PR.
  const w = 185;
  const r = 5;
  const base = e1rmLb(w, r)!;
  // 0.5 lb e1RM bump at 5 reps Epley: delta_w * (1+5/30) = 0.5 => delta_w = 0.5 / (1+1/6)
  const plusHalf = w + PR_MARGIN_LB / (1 + r / 30);
  const edge = summarizeStrengthSessions([
    { performedOn: '2026-02-01', sets: [{ weightLb: w, reps: r }] },
    { performedOn: '2026-02-08', sets: [{ weightLb: plusHalf, reps: r }] },
  ]);
  assert.equal(edge[1]!.isPr, false);
  assert.ok(Math.abs(edge[1]!.e1rmLb! - base - PR_MARGIN_LB) < 1e-9);
});

test('mass and distance conversions; row splits stay per 500 m', () => {
  assert.ok(Math.abs(massFromLb(massToLb(100, 'kg'), 'kg') - 100) < 1e-6);
  assert.ok(Math.abs(massToLb(100, 'kg') - 100 * 2.20462262) < 1e-6);
  assert.equal(massToLb(100, 'lb'), 100);
  const split = rowSplitSecPer500(120, 1000);
  assert.equal(split, 60);
  const paceMi = paceSecPerUnit(360, 1609.344, 'mi');
  assert.ok(paceMi != null && Math.abs(paceMi - 360) < 1e-9);
  const mph = speedUnitPerHour(3600, 1609.344, 'mi');
  assert.ok(mph != null && Math.abs(mph - 1) < 1e-9);
});

test('weight chart: 10-day EMA, range filter, downsample cap, sparse/empty flags', () => {
  const now = new Date('2026-11-16T00:00:00Z');
  assert.deepEqual(buildWeightChart([], '3M', now), {
    points: [],
    start: null,
    low: null,
    ratePerWeek: null,
    sparse: false,
    empty: true,
    showPrMarkers: false,
  });

  const two = [
    { date: '2026-11-01', value: 180 },
    { date: '2026-11-10', value: 178 },
  ];
  const sparse = buildWeightChart(two, '1M', now);
  assert.equal(sparse.sparse, true);
  assert.equal(sparse.empty, false);
  assert.equal(sparse.showPrMarkers, false);
  assert.equal(sparse.points.length, 2);
  assert.equal(sparse.points[0]!.value, 180);
  // EMA on second point: α = 2/11,  (2/11)*178 + (9/11)*180
  const a = 2 / 11;
  assert.ok(Math.abs(sparse.points[1]!.value - (a * 178 + (1 - a) * 180)) < 1e-9);

  const old = { date: '2025-01-01', value: 200 };
  assert.equal(filterRange([old, ...two], '1M', now).some((p) => p.date === '2025-01-01'), false);
  assert.equal(filterRange([old, ...two], 'All', now)[0]!.date, '2025-01-01');

  const many = Array.from({ length: 200 }, (_, i) => ({
    date: `2026-01-${String((i % 28) + 1).padStart(2, '0')}`,
    value: 180,
  }));
  // dates collide; make unique ISO dates via a monotonic counter
  const unique = Array.from({ length: 200 }, (_, i) => {
    const d = new Date(Date.UTC(2026, 0, 1 + i));
    return { date: d.toISOString().slice(0, 10), value: 180 + i };
  });
  const ds = downsample(unique, MAX_CHART_POINTS);
  assert.ok(ds.length <= MAX_CHART_POINTS);
  assert.equal(ds[0]!.date, unique[0]!.date);
  assert.equal(ds[ds.length - 1]!.date, unique[unique.length - 1]!.date);
});
