import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CAMERA_ROLL_SAVE_OPTION,
  PHOTO_APP_SWITCHER_BLUR_ALWAYS_ON,
  PHOTO_COMPARE_CAPTION,
  PHOTO_COMPARE_TRANSFORM,
  PHOTO_LOCK_MODE,
  PHOTO_LOCK_RELOCK_MS,
  canAlignCompare,
  canCropCompare,
  canRotateCompare,
  DEFAULT_CAMERA_ROLL_COPIES,
  defaultPhotoLockOn,
  defaultPhotoPrivacySettings,
  galleryPrivacyLine,
  isPhotoLockOn,
  lockSubtitle,
  photoLockBody,
  planPhotoDeletion,
  shouldRelockPhotos,
} from '../../src/progress/photoPrivacy.ts';
import { TEEN_WEIGHT_PROFILE_ONLY } from '../../src/progress/phase5Flags.ts';
import { createPhotoDeviceStore } from '../../src/progress/photoDeviceStore.ts';
import type { KeyValueAdapter } from '../../src/onboarding/deviceSetupStore.ts';

function mem(): KeyValueAdapter {
  const m = new Map<string, string>();
  return {
    getItem: async (k) => m.get(k) ?? null,
    setItem: async (k, v) => void m.set(k, v),
    removeItem: async (k) => void m.delete(k),
  };
}

test('Kevin flags are explicit and the current defaults are documented', () => {
  assert.equal(PHOTO_LOCK_MODE, 'default_on_setting');
  assert.equal(CAMERA_ROLL_SAVE_OPTION, true);
  assert.equal(TEEN_WEIGHT_PROFILE_ONLY, true);
  assert.equal(defaultPhotoLockOn(), true);
  assert.equal(DEFAULT_CAMERA_ROLL_COPIES, false);
  assert.equal(defaultPhotoPrivacySettings().cameraRollCopies, false);
  assert.equal(isPhotoLockOn(false, 'always_on'), true);
  assert.equal(isPhotoLockOn(false, 'default_on_setting'), false);
});

test('the photo lock re-locks after 1 minute away; app-switcher blur is always on', () => {
  assert.equal(PHOTO_LOCK_RELOCK_MS, 60_000);
  assert.equal(shouldRelockPhotos(1_000, 1_000 + 59_999), false);
  assert.equal(shouldRelockPhotos(1_000, 1_000 + 60_000), true);
  assert.equal(shouldRelockPhotos(null, 90_000), false);
  assert.equal(PHOTO_APP_SWITCHER_BLUR_ALWAYS_ON, true);
  assert.equal(lockSubtitle('default_on_setting'), 'Locks after 1 minute away.');
  assert.match(lockSubtitle('always_on'), /Always on/);
});

test('gallery privacy line is computed from the real lock and camera-roll state', () => {
  const base = { thumbnailBlur: true, cameraRollCopies: false, lock: { lockOn: true, biometric: 'face_id' as const } };
  assert.equal(galleryPrivacyLine(base), 'Private · Face ID · Not in your camera roll');
  assert.equal(
    galleryPrivacyLine({ ...base, lock: { lockOn: true, biometric: 'touch_id' } }),
    'Private · Touch ID · Not in your camera roll',
  );
  assert.equal(
    galleryPrivacyLine({ ...base, lock: { lockOn: true, biometric: 'android' } }),
    'Private · Locked · Not in your camera roll',
  );
  assert.equal(
    galleryPrivacyLine({ ...base, lock: { lockOn: false, biometric: 'face_id' } }),
    'Private · Not locked · Not in your camera roll',
  );
  assert.equal(
    galleryPrivacyLine({ ...base, cameraRollCopies: true }),
    'Private · Face ID · Some copies in your camera roll',
  );
  // always-on mode never reports "Not locked"
  assert.equal(
    galleryPrivacyLine({ ...base, lock: { lockOn: false, biometric: 'face_id' } }, 'always_on'),
    'Private · Face ID · Not in your camera roll',
  );
  assert.match(photoLockBody('touch_id'), /fingerprint/);
  assert.equal(/face or fingerprint/.test(photoLockBody('touch_id')), false);
  assert.match(photoLockBody('android'), /face or fingerprint/);
  assert.match(photoLockBody('face_id'), /face/);
});

test('compare only scales to fit: no crop, rotation, or alignment', () => {
  assert.equal(PHOTO_COMPARE_TRANSFORM, 'scale_to_fit');
  assert.equal(canCropCompare(), false);
  assert.equal(canAlignCompare(), false);
  assert.equal(canRotateCompare(), false);
  assert.equal(PHOTO_COMPARE_CAPTION, 'Shown as taken. Nothing is cropped or lined up for you.');
});

test('turn-off and delete-all share the same deletion plan; delete-all leaves photos enabled', () => {
  assert.deepEqual(planPhotoDeletion('turn_off'), {
    mode: 'turn_off',
    offerExportFirst: true,
    deleteDeviceImmediately: true,
    shredServerWithinDays: 30,
    revokeCoachImmediately: true,
    leavePhotosEnabled: false,
  });
  assert.equal(planPhotoDeletion('delete_all').leavePhotosEnabled, true);
  assert.equal(planPhotoDeletion('delete_all').revokeCoachImmediately, true);
});

test('device photo copies are deleted immediately, independently of the opt-in', async () => {
  const store = createPhotoDeviceStore({ storage: mem() });
  await store.add('u1', { id: 'p1', capturedOn: '2026-11-16' });
  await store.add('u1', { id: 'p2', capturedOn: '2026-11-16' });
  assert.equal((await store.list('u1')).length, 2);
  await store.deleteAllNow('u1');
  assert.deepEqual(await store.list('u1'), []);
});
