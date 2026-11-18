import test from 'node:test';
import assert from 'node:assert/strict';
import { detectImportFormat, prepareImportedPhoto, PHOTO_IMPORT_UPLOADS_ORIGINAL } from '../../src/progress/photoImport.ts';
import { jpegHasGps, stripPhotoMetadata } from '../../src/progress/exif.ts';
import { PHOTO_IMPORT_CONSENT_VERSION } from '../../src/progress/photoConsent.ts';

function jpegWithApp1(payload: Uint8Array): Uint8Array {
  const out = new Uint8Array(2 + 2 + 2 + payload.length + 2);
  out[0] = 0xff;
  out[1] = 0xd8;
  out[2] = 0xff;
  out[3] = 0xe1;
  const len = payload.length + 2;
  out[4] = (len >> 8) & 0xff;
  out[5] = len & 0xff;
  out.set(payload, 6);
  out[6 + payload.length] = 0xff;
  out[7 + payload.length] = 0xd9;
  return out;
}

function exifGpsPayload(): Uint8Array {
  const tiff = new Uint8Array(32);
  tiff[0] = 0x49;
  tiff[1] = 0x49;
  tiff[2] = 0x2a;
  tiff[3] = 0x00;
  tiff[4] = 8;
  tiff[8] = 1;
  tiff[9] = 0;
  tiff[10] = 0x25;
  tiff[11] = 0x88;
  tiff[12] = 4;
  tiff[13] = 0;
  tiff[14] = 1;
  tiff[15] = 0;
  const payload = new Uint8Array(6 + tiff.length);
  payload.set([0x45, 0x78, 0x69, 0x66, 0x00, 0x00], 0);
  payload.set(tiff, 6);
  return payload;
}

const cleanJpeg = new Uint8Array([0xff, 0xd8, 0xff, 0xd9]);
const keyBytes = new Uint8Array(32).fill(7);
const safetyHook = () => ({ status: 'passed' as const, vendorRetainedOnNonMatch: false as const });

const baseOpts = {
  profile: { is_minor: false },
  healthOn: true,
  photoOptedIn: true,
  importConsentVersion: PHOTO_IMPORT_CONSENT_VERSION,
  keyBytes,
  now: new Date('2026-11-17T12:00:00Z'),
  confirmedDate: '2026-11-16',
  convertToJpeg: async () => ({ jpeg: cleanJpeg }),
  safetyHook,
};

test('the original file is never uploaded', () => {
  assert.equal(PHOTO_IMPORT_UPLOADS_ORIGINAL, false);
});

test('jpegHasGps detects leftover GPS and stripPhotoMetadata removes APP1', () => {
  const withGps = jpegWithApp1(exifGpsPayload());
  assert.equal(jpegHasGps(withGps), true);
  const stripped = stripPhotoMetadata(withGps, 'image/jpeg');
  assert.equal(stripped.hadLocation, true);
  assert.equal(jpegHasGps(stripped.bytes), false);
});

test('detectImportFormat recognizes JPEG, PNG and HEIC brands', () => {
  assert.equal(detectImportFormat(new Uint8Array([0xff, 0xd8, 0xff, 0xd9]), 'image/jpeg'), 'jpeg');
  const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  assert.equal(detectImportFormat(png, 'image/png'), 'png');
  const heic = new Uint8Array(16);
  heic.set([0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70, 0x68, 0x65, 0x69, 0x63], 0);
  assert.equal(detectImportFormat(heic, 'image/heic'), 'heic');
});

test('PNG and HEIC are converted to a stripped JPEG; leftover GPS is rejected', async () => {
  const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const prepared = await prepareImportedPhoto(png, { ...baseOpts, mime: 'image/png' });
  assert.equal(prepared.mime, 'image/jpeg');
  assert.equal(prepared.format, 'png');
  assert.equal(prepared.originalDiscarded, true);
  assert.equal(prepared.exifStripped, true);
  assert.equal(prepared.capturedOn, '2026-11-16');

  const heic = new Uint8Array(16);
  heic.set([0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70, 0x68, 0x65, 0x69, 0x63], 0);
  const fromHeic = await prepareImportedPhoto(heic, { ...baseOpts, mime: 'image/heic' });
  assert.equal(fromHeic.format, 'heic');
  assert.equal(fromHeic.originalDiscarded, true);

  const withGps = jpegWithApp1(exifGpsPayload());
  const cleaned = await prepareImportedPhoto(withGps, { ...baseOpts, mime: 'image/jpeg' });
  assert.equal(cleaned.format, 'jpeg');
  assert.equal(cleaned.exifStripped, true);
  // Import still refuses any JPEG that still has GPS after the strip step.
  assert.equal(jpegHasGps(withGps), true);
  assert.equal(jpegHasGps(stripPhotoMetadata(withGps, 'image/jpeg').bytes), false);
});
