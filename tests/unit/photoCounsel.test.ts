import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';
import {
  CUBI_FORBIDDEN_FEATURES,
  FACE_POSE_POINTS,
  PHOTO_ALIGNMENT_MODES,
  bodyOnlyPosePoints,
  isAllowedAlignmentMode,
  shouldStorePosePoints,
} from '../../src/progress/photoAlignment.ts';
import {
  PHOTO_EXTERNAL_BLOCKLIST,
  assertPhotoSafeForExternal,
  payloadContainsPhotoData,
  scrubPhotoFields,
} from '../../src/progress/photoScrub.ts';
import { assertCrashAnalyticsSafe } from '../../src/analytics/guards.ts';
import {
  DEFAULT_PHOTO_OPT_IN_CHECKED,
  DEFAULT_PHOTO_SHARE_OPT_IN_CHECKED,
  photoSheetContinue,
  photoSheetDismissed,
  shouldAutoRepromptPhotos,
} from '../../src/progress/photoConsent.ts';
import { FACE_RECOGNITION_ENABLED } from '../../src/progress/photoCrypto.ts';
import { error, warn } from '../../src/utils/log.ts';

const ROOT = new URL('../../', import.meta.url).pathname;

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name === '.git' || name === 'dist' || name === '.expo') continue;
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) walk(p, out);
    else if (/\.(ts|tsx|js|json)$/.test(name)) out.push(p);
  }
  return out;
}

test('CUBI: only overlay, whole-image, or body-only pose alignment is allowed; face points are discarded and not stored', () => {
  assert.deepEqual([...PHOTO_ALIGNMENT_MODES], ['overlay', 'whole_image', 'on_device_body_pose']);
  assert.equal(isAllowedAlignmentMode('overlay'), true);
  assert.equal(isAllowedAlignmentMode('face_landmarks'), false);
  assert.equal(FACE_RECOGNITION_ENABLED, false);
  assert.ok(CUBI_FORBIDDEN_FEATURES.includes('face_detection'));
  assert.ok(CUBI_FORBIDDEN_FEATURES.includes('auto_crop'));
  assert.ok(CUBI_FORBIDDEN_FEATURES.includes('face_blur'));
  assert.ok(CUBI_FORBIDDEN_FEATURES.includes('body_measurements_from_photos'));
  const kept = bodyOnlyPosePoints([
    { name: 'left_shoulder', x: 1, y: 2 },
    { name: 'nose', x: 3, y: 4 },
    { name: 'left_eye', x: 5, y: 6 },
    { name: 'right_hip', x: 7, y: 8 },
    { name: 'Mouth-Left', x: 9, y: 10 },
  ]);
  assert.deepEqual(kept.map((p) => p.name), ['left_shoulder', 'right_hip']);
  assert.equal(shouldStorePosePoints(), false);
  assert.ok(FACE_POSE_POINTS.includes('nose'));
});

test('CUBI: no forbidden face or measurement dependency or API is imported', () => {
  const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')) as {
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
  };
  const deps = { ...pkg.dependencies, ...pkg.devDependencies };
  const bannedDep = /face-api|blazeface|facemesh|face-landmarks|rekognition|photodna|mlkit-face|vision-camera-face|mediapipe-face|tensorflow.*face/i;
  for (const name of Object.keys(deps)) {
    assert.equal(bannedDep.test(name), false, name);
  }
  const importRe =
    /from ['"][^'"]*(face-api|blazeface|facemesh|FaceDetector|rekognition|photodna|mlkit-face|vision-camera-face-detector|mediapipe\/face)['"]/i;
  for (const file of walk(join(ROOT, 'src')).concat(walk(join(ROOT, 'supabase/functions')))) {
    if (file.endsWith('.json')) continue;
    const src = readFileSync(file, 'utf8');
    assert.equal(importRe.test(src), false, file);
  }
});

test('photos and metadata are scrubbed out of analytics, crash, replay, and ai-plan payloads', () => {
  const dirty = {
    screen: 'progress',
    photo: 'file:///progress/1.jpg',
    thumbnail: 'data:image/jpeg;base64,aaa',
    storage_path: 'uid/p5.jpg',
    exif: { gps: '1,2' },
    imageUri: 'https://example.test/p.jpg',
    user: { id: 'u1', progress_photos: [{ id: 'p' }] },
    events: [{ photo_url: 'x' }, { op: 'save' }],
  };
  assert.equal(payloadContainsPhotoData(dirty), true);
  const clean = scrubPhotoFields(dirty);
  assert.equal(payloadContainsPhotoData(clean), false);
  assert.equal(clean.screen, 'progress');
  assert.equal('photo' in clean, false);
  assert.equal('thumbnail' in clean, false);
  assert.deepEqual(clean.events, [{}, { op: 'save' }]);
  assert.deepEqual(clean.user, { id: 'u1' });
  assert.doesNotThrow(() => assertPhotoSafeForExternal('analytics', clean));
  assert.doesNotThrow(() => assertPhotoSafeForExternal('ai-plan', clean));
  assert.doesNotThrow(() => assertPhotoSafeForExternal('crash', clean));
  assert.doesNotThrow(() => assertPhotoSafeForExternal('session_replay', clean));
  assert.doesNotThrow(() => assertPhotoSafeForExternal('anthropic', clean));
  assert.throws(() => assertPhotoSafeForExternal('analytics', dirty), /photo_data_not_allowed/);
  assert.deepEqual([...PHOTO_EXTERNAL_BLOCKLIST], ['anthropic', 'ai-plan', 'analytics', 'crash', 'session_replay']);
});

test('the safe logger never prints photo fields', () => {
  const lines: string[] = [];
  const origW = console.warn;
  const origE = console.error;
  console.warn = (m?: unknown) => void lines.push(String(m));
  console.error = (m?: unknown) => void lines.push(String(m));
  try {
    warn('failed', { screen: 'photos', op: 'upload', photo: 'secret.jpg', storage_path: 'a/b.jpg' } as never);
    error('failed', { code: 'x', thumbnail: 'data:' } as never);
  } finally {
    console.warn = origW;
    console.error = origE;
  }
  const text = lines.join('\n');
  assert.match(text, /screen=photos/);
  assert.match(text, /op=upload/);
  assert.equal(/secret\.jpg|storage_path|thumbnail|data:/.test(text), false);
});

test('Continue logs on or off with version and hash; Not now logs dismissed; no automatic re-prompts', () => {
  assert.equal(DEFAULT_PHOTO_OPT_IN_CHECKED, false);
  assert.equal(DEFAULT_PHOTO_SHARE_OPT_IN_CHECKED, false);
  assert.equal(shouldAutoRepromptPhotos(), false);
  const hash = 'ab'.repeat(32);
  assert.deepEqual(photoSheetContinue('progress_photos', true, 'photos-v1', hash), {
    kind: 'progress_photos',
    decision: 'on',
    version: 'photos-v1',
    textHash: hash,
  });
  assert.deepEqual(photoSheetContinue('photo_coach_sharing', false, 'share-v1', hash), {
    kind: 'photo_coach_sharing',
    decision: 'off',
    version: 'share-v1',
    textHash: hash,
  });
  assert.deepEqual(photoSheetDismissed('progress_photos'), { kind: 'progress_photos', decision: 'dismissed' });
  assert.throws(() => photoSheetContinue('progress_photos', true, 'photos-v1', 'nope'), /invalid_text_hash/);
  assert.throws(() => photoSheetContinue('progress_photos', false, '', hash), /invalid_text_version/);
});

test('ToS §12: health info, photos and messages are not sent to AI, analytics, or crash reports', () => {
  for (const sink of ['anthropic', 'ai-plan', 'analytics', 'crash'] as const) {
    assert.throws(() => assertPhotoSafeForExternal(sink, { photo_id: 'p1', storage_path: '/p.jpg' }), /photo_data_not_allowed/);
  }
  assert.throws(() => assertCrashAnalyticsSafe({ event: 'message_sent', body: 'hey coach', email: 'a@b.com' }), /crash_analytics_user_identifier/);
  assert.doesNotThrow(() => assertCrashAnalyticsSafe({ event: 'session_start', properties: { installId: 'aaaaaaaaaaaaaaaa' } }));
});
