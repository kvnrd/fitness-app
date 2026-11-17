import test from 'node:test';
import assert from 'node:assert/strict';
import { exifPayloadHasGps } from '../../src/progress/exif.ts';
import {
  PHOTO_EXPORT_AUTO_DELETE,
  PHOTO_EXPORT_BURN_IN,
  PHOTO_EXPORT_DELIVERY,
  PHOTO_EXPORT_FORMAT,
  PHOTO_EXPORT_PASSWORD,
  exportFileName,
  exportLeavesPhotosInPlace,
  planPhotoExport,
} from '../../src/progress/photoExport.ts';
import {
  PHOTO_PURGE_DEADLINE_GUARANTEED,
  PHOTO_PURGE_DAYS,
  TEEN_WEIGHT_CLEAR_PURGE_DEADLINE_GUARANTEED,
  canShowPurgeDate,
  deleteAllPhotosToast,
  formatPurgeDate,
  purgeDate,
  teenClearWeightToast,
  turnOffPhotosToast,
} from '../../src/progress/purgeToasts.ts';
import { lockRequireLabel } from '../../src/progress/photoPrivacy.ts';

function u8(...bytes: number[]): Uint8Array { return Uint8Array.from(bytes); }
function concat(...parts: Uint8Array[]): Uint8Array {
  const n = parts.reduce((s, p) => s + p.length, 0);
  const out = new Uint8Array(n);
  let o = 0;
  for (const p of parts) { out.set(p, o); o += p.length; }
  return out;
}
function be16(n: number): number[] { return [(n >> 8) & 0xff, n & 0xff]; }
function jpegWithGps(): Uint8Array {
  const jfif = u8(0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00);
  const exifBody = u8(
    0x45, 0x78, 0x69, 0x66, 0x00, 0x00,
    0x4d, 0x4d, 0x00, 0x2a,
    0x00, 0x00, 0x00, 0x08,
    0x00, 0x01,
    0x88, 0x25, 0x00, 0x04, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x1a,
    0x00, 0x00, 0x00, 0x00,
  );
  const app1 = u8(0xff, 0xe1, ...be16(exifBody.length + 2), ...exifBody);
  const sof = u8(0xff, 0xc0, 0x00, 0x0b, 0x08, 0x00, 0x01, 0x00, 0x01, 0x01, 0x01, 0x11, 0x00);
  const sos = u8(0xff, 0xda, 0x00, 0x08, 0x01, 0x01, 0x00, 0x00, 0x3f, 0x00, 0x00, 0xff, 0xd9);
  return concat(u8(0xff, 0xd8), jfif, app1, sof, sos);
}

test('export is one ZIP via the system save dialog, with no password and no auto-delete', () => {
  assert.equal(PHOTO_EXPORT_FORMAT, 'zip');
  assert.equal(PHOTO_EXPORT_DELIVERY, 'system_save_dialog');
  assert.equal(PHOTO_EXPORT_PASSWORD, false);
  assert.equal(PHOTO_EXPORT_AUTO_DELETE, false);
  assert.equal(PHOTO_EXPORT_BURN_IN, false);
  assert.equal(exportLeavesPhotosInPlace(), true);
  assert.equal(exportFileName('2026-11-14', 'front'), '2026-11-14-front.jpg');
});

test('export strips location and device metadata again, and never burns in weight or dates', () => {
  const src = jpegWithGps();
  assert.equal(exifPayloadHasGps(src), true);
  const plan = planPhotoExport({
    photos: [
      { capturedOn: '2026-11-14', pose: 'front', bytes: src, weightLabel: '182 lb' },
      { capturedOn: '2026-11-16', pose: 'side', bytes: src, weightLabel: '181 lb' },
    ],
    showWeightOnLabels: false,
    exportedOn: '2026-11-16',
  });
  assert.equal(plan.format, 'zip');
  assert.equal(plan.password, false);
  assert.equal(plan.autoDeleteAfterExport, false);
  assert.equal(plan.burnIn, false);
  assert.deepEqual(plan.files.map((f) => f.name), ['2026-11-14-front.jpg', '2026-11-16-side.jpg', 'README.txt']);
  for (const f of plan.files.filter((x) => x.name.endsWith('.jpg'))) {
    assert.equal(exifPayloadHasGps(f.bytes), false);
  }
  assert.equal(plan.readme.includes("isn't locked or encrypted"), true);
  assert.equal(plan.files.some((f) => f.name.endsWith('-label.txt')), false);

  const withLabels = planPhotoExport({
    photos: [{ capturedOn: '2026-11-14', pose: 'front', bytes: src, weightLabel: '182 lb' }],
    showWeightOnLabels: true,
  });
  assert.ok(withLabels.files.some((f) => f.name === '2026-11-14-front-label.txt'));
  const label = withLabels.files.find((f) => f.name.endsWith('-label.txt'))!;
  assert.equal(new TextDecoder().decode(label.bytes), '182 lb');
});

test('purge {date} is request + 30 days and is shown only when the job guarantees it', () => {
  assert.equal(PHOTO_PURGE_DAYS, 30);
  assert.equal(PHOTO_PURGE_DEADLINE_GUARANTEED, true);
  assert.equal(canShowPurgeDate(true), true);
  assert.equal(canShowPurgeDate(false), false);
  const requestAt = new Date(Date.UTC(2026, 10, 16));
  assert.equal(formatPurgeDate(purgeDate(requestAt)), '2026-12-16');
  const on = turnOffPhotosToast({ requestAt, guaranteed: true, coachFirstName: 'Sam' });
  assert.match(on, /by 2026-12-16/);
  assert.match(on, /Sam can't see them anymore/);
  const off = turnOffPhotosToast({ requestAt, guaranteed: false });
  assert.equal(/by 2026-12-16/.test(off), false);
  assert.match(off, /within 30 days/);
  assert.match(deleteAllPhotosToast({ requestAt, guaranteed: true }), /by 2026-12-16/);
  assert.equal(TEEN_WEIGHT_CLEAR_PURGE_DEADLINE_GUARANTEED, false);
  assert.equal(/by 2026-12-16/.test(teenClearWeightToast({ requestAt, guaranteed: false })), false);
  assert.match(teenClearWeightToast({ requestAt, guaranteed: true }), /by 2026-12-16/);
});

test('Android lock row says Require phone unlock', () => {
  assert.equal(lockRequireLabel('touch_id'), 'Require Touch ID');
  assert.equal(lockRequireLabel('face_id'), 'Require Face ID');
  assert.equal(lockRequireLabel('android'), 'Require phone unlock');
});
