import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  BODY_JOINTS,
  FACE_LANDMARK_INDICES,
  LOST_AFTER_MS,
  LiveSession,
  previewPoint,
  MAX_STARRED_VIDEOS,
  RepAnalyzer,
  analyzeSet,
  angleDeg,
  bodyFrameFromPacked,
  canStar,
  compactSkeleton,
  devProPreview,
  formCheckLabEnabled,
  flaggedReps,
  formCheckOutputs,
  isFaceFree,
  jointAngle,
  keepVideoAfterAnalysis,
  metricsOf,
  movementForExercise,
  setCues,
  shareScope,
  toBodyFrame,
  videosToDelete,
  type BodyFrame,
  type BodyJoint,
  type LocalVideo,
  type Point,
  type RawLandmark,
} from '../../src/formCheck/index.ts';

// ---------------------------------------------------------------- synthetic lifters (side view)
const P = (x: number, y: number, v = 0.99): Point => ({ x, y, v });
const rad = (d: number) => (d * Math.PI) / 180;
/** Point at `len` from `from`, at `deg` from straight down (image y grows downward). */
const fromDown = (from: Point, deg: number, len: number): Point =>
  P(from.x - len * Math.sin(rad(deg)), from.y + len * Math.cos(rad(deg)));

function frame(t: number, pts: Partial<Record<BodyJoint, Point>>): BodyFrame {
  return { t, points: pts };
}

/** Squat with the given knee angle and torso lean. */
function squatFrame(t: number, knee: number, leanDeg = 10, hideKnee = false, barShift = 0): BodyFrame {
  const ankle = P(0.5, 0.9);
  const k = P(0.5, 0.7);
  const hip = fromDown(k, knee, 0.2);
  const shoulder = P(hip.x + 0.25 * Math.sin(rad(leanDeg)), hip.y - 0.25 * Math.cos(rad(leanDeg)));
  // The bar stays over mid-foot, as on a real squat.
  const wrist = P(ankle.x - barShift * (180 - knee) / 100, shoulder.y + 0.02);
  const pts: Partial<Record<BodyJoint, Point>> = {
    left_ankle: ankle, left_knee: hideKnee ? P(k.x, k.y, 0.1) : k, left_hip: hip,
    left_shoulder: shoulder, left_wrist: wrist,
  };
  return frame(t, pts);
}

/** Deadlift with the given hip angle (shoulder–hip–knee). */
function deadliftFrame(t: number, hipAngle: number): BodyFrame {
  const knee = P(0.5, 0.75);
  const hip = P(0.5, 0.55);
  const shoulder = fromDown(hip, hipAngle, 0.25);
  return frame(t, { left_knee: knee, left_hip: hip, left_ankle: P(0.5, 0.95), left_shoulder: shoulder, left_wrist: P(0.52, shoulder.y + 0.2) });
}

/** Push-up with the given elbow angle and hip sag (in image units). */
function pushUpFrame(t: number, elbow: number, sag = 0): BodyFrame {
  const shoulder = P(0.3, 0.5);
  const el = P(0.3, 0.62);
  // wrist at `elbow` degrees from the elbow→shoulder ray (which points up).
  const wrist = P(el.x + 0.12 * Math.sin(rad(elbow)), el.y - 0.12 * Math.cos(rad(elbow)));
  return frame(t, { left_shoulder: shoulder, left_elbow: el, left_wrist: wrist, left_hip: P(0.55, 0.5 + sag), left_ankle: P(0.8, 0.5) });
}

/** Angle trajectory: `reps` cycles top→bottom→top, `ms` per rep, at 30 fps. */
function trajectory(reps: number, top: number, bottom: number, ms = 2000, startAtBottom = false): { t: number; a: number }[] {
  const out: { t: number; a: number }[] = [];
  const dt = 1000 / 30;
  const total = reps * ms + 500;
  for (let t = 0; t <= total; t += dt) {
    const phase = Math.min(t, reps * ms) / ms;
    const c = (1 - Math.cos(2 * Math.PI * phase)) / 2; // 0 at top, 1 at bottom
    const s = startAtBottom ? 1 - c : c;
    out.push({ t, a: top - (top - bottom) * s });
  }
  return out;
}

// ---------------------------------------------------------------- face removal
test('face points never make it into a body frame', () => {
  const raw: RawLandmark[] = Array.from({ length: 33 }, (_, i) => ({ x: i / 100, y: i / 100, visibility: 1 }));
  const f = toBodyFrame(raw, 0);
  assert.deepEqual(Object.keys(f.points), [...BODY_JOINTS]);
  assert.equal(f.points.left_shoulder?.x, 0.11, 'index 11 is the first body point');
  for (const i of FACE_LANDMARK_INDICES) {
    assert.ok(!Object.values(f.points).some((p) => p?.x === i / 100), `face index ${i} leaked`);
  }
  assert.ok(isFaceFree([f]));
  assert.ok(!isFaceFree([{ points: { nose: { x: 0, y: 0 } } }]));
});

test('body-only and packed inputs decode; other lengths are refused', () => {
  const body = Array.from({ length: 22 }, () => ({ x: 0.5, y: 0.5, visibility: 0.9 }));
  assert.equal(Object.keys(toBodyFrame(body, 0).points).length, 22);
  const packed = new Float32Array(66).fill(0.5);
  assert.equal(bodyFrameFromPacked(packed, 0).points.right_foot_index?.y, 0.5);
  assert.throws(() => toBodyFrame(Array.from({ length: 39 }, () => ({ x: 0, y: 0 })), 0));
  assert.throws(() => bodyFrameFromPacked(new Float32Array(99), 0));
});

// ---------------------------------------------------------------- angles
test('angle math', () => {
  assert.equal(Math.round(angleDeg(P(0, 1), P(0, 0), P(1, 0))!), 90);
  assert.equal(Math.round(angleDeg(P(0, 1), P(0, 0), P(0, -1))!), 180);
  assert.equal(angleDeg(P(0, 0), P(0, 0), P(1, 0)), null);
  assert.equal(Math.round(jointAngle(squatFrame(0, 120), 'knee')!), 120);
  assert.equal(jointAngle(squatFrame(0, 120, 10, true), 'knee'), null, 'low-visibility knee is missing');
});

// ---------------------------------------------------------------- rep counting
test('counts full squats with no flags', () => {
  const a = analyzeSet('squat', trajectory(5, 175, 75).map(({ t, a }) => squatFrame(t, a)));
  assert.equal(a.reps.length, 5);
  assert.deepEqual(a.reps.map((r) => r.flags), [[], [], [], [], []]);
  assert.ok(a.reps.every((r) => r.bottomAngle < 85 && r.topAngle > 165));
  assert.deepEqual(setCues(a), []);
});

test('half squats count but are flagged short and cued', () => {
  const a = analyzeSet('squat', trajectory(4, 175, 105).map(({ t, a }) => squatFrame(t, a)));
  assert.equal(a.reps.length, 4);
  assert.ok(a.reps.every((r) => r.flags.includes('depth_short')));
  assert.deepEqual(setCues(a), ['cue_depth']);
  assert.deepEqual(flaggedReps(a), [1, 2, 3, 4]);
});

test('torso lean is flagged at the bottom', () => {
  const a = analyzeSet('squat', trajectory(3, 175, 75).map(({ t, a }) => squatFrame(t, a, a < 100 ? 65 : 20)));
  assert.equal(a.reps.length, 3);
  assert.ok(a.reps.every((r) => r.flags.includes('torso_lean')));
});

test('bar drifting off mid-foot is flagged', () => {
  const a = analyzeSet('squat', trajectory(3, 175, 75).map(({ t, a }) => squatFrame(t, a, 10, false, 0.1)));
  assert.equal(a.reps.length, 3);
  assert.ok(a.reps.every((r) => r.flags.includes('bar_drift')));
  assert.ok(a.barDrift !== null && a.barDrift > 0.25);
  assert.deepEqual(setCues(a), ['cue_bar_close']);
});

test('wobbling at the top is not a rep', () => {
  const frames: BodyFrame[] = [];
  for (let i = 0; i < 300; i++) frames.push(squatFrame(i * 33, 165 + 10 * Math.sin(i / 3)));
  assert.equal(analyzeSet('squat', frames).reps.length, 0);
});

test('a fast bounce under minRepMs is ignored', () => {
  const a = analyzeSet('squat', trajectory(1, 175, 75, 300).map(({ t, a }) => squatFrame(t, a)));
  assert.equal(a.reps.length, 0);
});

test('live count goes up during the set', () => {
  const r = new RepAnalyzer('squat');
  const seen: number[] = [];
  for (const { t, a } of trajectory(3, 175, 75)) {
    r.push(squatFrame(t, a));
    if (seen.at(-1) !== r.count) seen.push(r.count);
  }
  assert.deepEqual(seen, [0, 1, 2, 3]);
  assert.equal(r.finish().reps.length, 3);
});

test('out-of-order frames are dropped', () => {
  const r = new RepAnalyzer('squat');
  r.push(squatFrame(100, 170));
  r.push(squatFrame(50, 70));
  r.push(squatFrame(100, 70));
  assert.equal(r.finish().reps.length, 0);
});

test('deadlifts start at the bottom and flag a soft lockout', () => {
  const soft = analyzeSet('deadlift', trajectory(3, 160, 80, 2000, true).map(({ t, a }) => deadliftFrame(t, a)));
  assert.equal(soft.reps.length, 3);
  assert.ok(soft.reps.every((r) => r.flags.includes('lockout_incomplete')));
  assert.deepEqual(setCues(soft), ['cue_finish_lockout']);
  const full = analyzeSet('deadlift', trajectory(3, 178, 80, 2000, true).map(({ t, a }) => deadliftFrame(t, a)));
  assert.equal(full.reps.length, 3);
  assert.ok(full.reps.every((r) => !r.flags.includes('lockout_incomplete')));
});

test('push-ups: sagging hips are flagged, a straight line is not', () => {
  const sag = analyzeSet('push_up', trajectory(3, 170, 75).map(({ t, a }) => pushUpFrame(t, a, 0.08)));
  assert.equal(sag.reps.length, 3);
  assert.ok(sag.reps.every((r) => r.flags.includes('hip_sag')));
  const good = analyzeSet('push_up', trajectory(3, 170, 75).map(({ t, a }) => pushUpFrame(t, a, 0)));
  assert.ok(good.reps.every((r) => r.flags.length === 0));
  assert.equal(good.barDrift, null, 'no bar on push-ups');
});

test('losing the knee for much of a rep marks low confidence and asks for a better angle', () => {
  const frames = trajectory(3, 175, 75).map(({ t, a }, i) => squatFrame(t, a, 10, i % 2 === 0));
  const a = analyzeSet('squat', frames);
  assert.ok(a.reps.length >= 1);
  assert.ok(a.reps.every((r) => r.flags.includes('low_confidence')));
  assert.deepEqual(setCues(a), ['cue_film_angle']);
  assert.deepEqual(flaggedReps(a), [], 'low confidence alone is not a flagged rep');
});

test('a flag on one rep of five earns no cue', () => {
  const a = analyzeSet('squat', trajectory(5, 175, 75).map(({ t, a }) => squatFrame(t, a)));
  a.reps[2].flags.push('depth_short');
  assert.deepEqual(setCues(a), []);
});

// ---------------------------------------------------------------- exercise mapping
test('plan exercise names map to supported movements', () => {
  const cases: [string, string | null][] = [
    ['Back Squat', 'squat'], ['Goblet squat', 'squat'], ['Romanian Deadlift', 'deadlift'], ['RDL', 'deadlift'],
    ['Incline Bench Press', 'bench_press'], ['Overhead Press', 'overhead_press'], ['Seated shoulder press', 'overhead_press'],
    ['Push-ups', 'push_up'], ['Lat Pulldown', null], ['Leg Press', null], ['Easy run', null],
  ];
  for (const [name, m] of cases) assert.equal(movementForExercise(name), m, name);
});

// ---------------------------------------------------------------- Pro split
test('rep count is free; the rest is Pro', () => {
  assert.deepEqual(formCheckOutputs(false), { repCount: true, angles: false, flaggedReps: false, barPath: false, cues: false });
  assert.ok(Object.values(formCheckOutputs(true)).every(Boolean));
  assert.equal(devProPreview({ EXPO_PUBLIC_DEV_FORM_CHECK_PRO: '1' }), true);
  assert.equal(devProPreview({ EXPO_PUBLIC_DEV_FORM_CHECK_PRO: '1', EXPO_PUBLIC_ENV: 'production' }), false);
  assert.equal(devProPreview({}), false);
});

// ---------------------------------------------------------------- retention
const day = 86_400_000;
const now = new Date('2026-11-27T12:00:00Z');
const ago = (d: number) => new Date(now.getTime() - d * day).toISOString();

test('adult videos go after 90 days unless starred', () => {
  const v: LocalVideo[] = [
    { id: 'a', recordedAt: ago(89), starred: false },
    { id: 'b', recordedAt: ago(90), starred: false },
    { id: 'c', recordedAt: ago(400), starred: true },
  ];
  assert.deepEqual(videosToDelete(v, now, false), ['b']);
  assert.equal(keepVideoAfterAnalysis(false), true);
});

test('a minor keeps no video', () => {
  assert.equal(keepVideoAfterAnalysis(true), false);
  assert.deepEqual(videosToDelete([{ id: 'x', recordedAt: ago(0), starred: true }], now, true), ['x']);
  assert.deepEqual(canStar([{ id: 'x', recordedAt: ago(0), starred: false }], 'x', now, true), { ok: false, reason: 'minor' });
});

test('at most 20 starred videos', () => {
  const v: LocalVideo[] = Array.from({ length: MAX_STARRED_VIDEOS }, (_, i) => ({ id: `s${i}`, recordedAt: ago(1), starred: true }));
  v.push({ id: 'new', recordedAt: ago(1), starred: false }, { id: 'old', recordedAt: ago(95), starred: false });
  assert.deepEqual(canStar(v, 'new', now, false), { ok: false, reason: 'star_limit' });
  assert.deepEqual(canStar(v, 's3', now, false), { ok: true }, 'already starred');
  assert.deepEqual(canStar(v.slice(1), 'new', now, false), { ok: true });
  assert.deepEqual(canStar(v.slice(1), 'old', now, false), { ok: false, reason: 'expired' });
});

// ---------------------------------------------------------------- sharing
test('coach sharing: own coach only; minors never share video and need the parent', () => {
  assert.deepEqual(shareScope({ ownerIsMinor: false, isOwnActiveCoach: false, ownerOptIn: true }), { allowed: false });
  assert.deepEqual(shareScope({ ownerIsMinor: false, isOwnActiveCoach: true, ownerOptIn: false }), { allowed: false });
  assert.deepEqual(shareScope({ ownerIsMinor: false, isOwnActiveCoach: true, ownerOptIn: true }), { allowed: true, video: true, skeleton: true, metrics: true });
  assert.deepEqual(shareScope({ ownerIsMinor: true, isOwnActiveCoach: true, ownerOptIn: true }), { allowed: false });
  assert.deepEqual(shareScope({ ownerIsMinor: true, isOwnActiveCoach: true, ownerOptIn: true, parentOptIn: false }), { allowed: false });
  assert.deepEqual(shareScope({ ownerIsMinor: true, isOwnActiveCoach: true, ownerOptIn: true, parentOptIn: true }), { allowed: true, video: false, skeleton: true, metrics: true });
});

test('shared skeleton is body-only and downsampled; metrics carry no identity', () => {
  const frames = trajectory(2, 175, 75).map(({ t, a }) => squatFrame(t, a));
  const sk = compactSkeleton(frames);
  assert.ok(sk.every((f) => f.p.length === BODY_JOINTS.length * 3));
  const seconds = frames.at(-1)!.t / 1000;
  assert.ok(sk.length <= Math.ceil(seconds * 10) + 1 && sk.length >= Math.floor(seconds * 7));
  const m = metricsOf(analyzeSet('squat', frames));
  assert.deepEqual(Object.keys(m).sort(), ['barDrift', 'movement', 'repCount', 'reps']);
  assert.equal(m.repCount, 2);
});

// ---------------------------------------------------------------- live session (native events → analyzer)

function packed(f: BodyFrame): number[] {
  const out: number[] = [];
  for (const j of BODY_JOINTS) {
    const p = f.points[j];
    out.push(p?.x ?? 0, p?.y ?? 0, p?.v ?? 0);
  }
  return out;
}

test('live session counts reps from native packed events', () => {
  const s = new LiveSession('squat');
  assert.equal(s.tracking, 'waiting');
  for (const { t, a } of trajectory(3, 175, 75)) s.onPose({ t, p: packed(squatFrame(t, a)) });
  assert.equal(s.tracking, 'tracking');
  assert.equal(s.repCount, 3);
  const { analysis, frames } = s.finish();
  assert.equal(analysis.reps.length, 3);
  assert.ok(frames.length > 100);
  assert.equal(s.finish().frames.length, 0, 'frames are handed over once, then dropped');
});

test('live session drops malformed events and notices when the lifter leaves the frame', () => {
  const s = new LiveSession('squat');
  s.onPose({ t: 0, p: new Array(99).fill(0.5) }); // 33 × 3: a payload that could carry face points
  assert.equal(s.rejectedFrames, 1);
  assert.equal(s.tracking, 'waiting');
  s.onPose({ t: 100, p: packed(squatFrame(100, 170)) });
  s.onNoPose({ t: 100 + LOST_AFTER_MS + 1 });
  assert.equal(s.tracking, 'lost');
});

test('preview mapping follows aspect fill (cropped edges map off-screen)', () => {
  // 1080×1920 frame on a 430×932 view: height-limited? scale = max(430/1080, 932/1920) = 0.4854
  const frame = { w: 1080, h: 1920 }, view = { w: 430, h: 932 };
  const c = previewPoint(0.5, 0.5, frame, view)!;
  assert.ok(Math.abs(c.x - 215) < 0.01 && Math.abs(c.y - 466) < 0.01, 'center stays centered');
  assert.equal(previewPoint(0.01, 0.5, frame, view), null, 'left edge is cropped away');
  assert.equal(previewPoint(0.5, 0.5, { w: 0, h: 0 }, view), null);
});

test('the dev lab is off unless its flag is set, and never in production', () => {
  assert.equal(formCheckLabEnabled({}), false);
  assert.equal(formCheckLabEnabled({ EXPO_PUBLIC_FORM_CHECK_LAB: '1' }), true);
  assert.equal(formCheckLabEnabled({ EXPO_PUBLIC_FORM_CHECK_LAB: '1', EXPO_PUBLIC_ENV: 'production' }), false);
});
