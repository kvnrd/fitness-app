import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { canSharePhotoWithCoach, canUploadProgressPhoto, canUseProgressPhotos, FACE_RECOGNITION_ENABLED } from '../../src/features/progressPhotos.ts';
import { DEFAULT_PHOTO_OPT_IN_CHECKED, createPhotoOptInStore } from '../../src/progress/photoOptIn.ts';
import { canCoachViewSharedPhoto, canShareProgressPhoto } from '../../src/progress/photoShare.ts';
import { decryptPhoto, encryptPhoto, generatePhotoKey, assertNoFaceRecognition } from '../../src/progress/photoCrypto.ts';
import { exifPayloadHasGps, stripPhotoMetadata, UnsupportedPhotoTypeError } from '../../src/progress/exif.ts';
import { prepareProgressPhoto } from '../../src/progress/preparePhoto.ts';
import type { KeyValueAdapter } from '../../src/onboarding/deviceSetupStore.ts';

function mem(): KeyValueAdapter {
  const m = new Map<string, string>();
  return {
    getItem: async (k) => m.get(k) ?? null,
    setItem: async (k, v) => void m.set(k, v),
    removeItem: async (k) => void m.delete(k),
  };
}

function u8(...bytes: number[]): Uint8Array {
  return Uint8Array.from(bytes);
}

function concat(...parts: Uint8Array[]): Uint8Array {
  const n = parts.reduce((s, p) => s + p.length, 0);
  const out = new Uint8Array(n);
  let o = 0;
  for (const p of parts) {
    out.set(p, o);
    o += p.length;
  }
  return out;
}

function be16(n: number): number[] {
  return [(n >> 8) & 0xff, n & 0xff];
}

/** Minimal 1×1 JPEG with a JFIF APP0, an EXIF APP1 that carries GPS IFD tag 0x8825, and a scan. */
function jpegWithGps(): Uint8Array {
  const jfif = u8(
    0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00,
  );
  // Exif\0\0 + TIFF BE, IFD0 at 8, one entry: GPSInfo (0x8825)
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

test('feature is hidden for minors and anyone without a profile; adults can see it', () => {
  assert.equal(canUseProgressPhotos(null), false);
  assert.equal(canUseProgressPhotos({ is_minor: true }), false);
  assert.equal(canUseProgressPhotos({ is_minor: false }), true);
});

test('first-use opt-in defaults off and is never pre-checked', async () => {
  assert.equal(DEFAULT_PHOTO_OPT_IN_CHECKED, false);
  const store = createPhotoOptInStore({ storage: mem() });
  assert.deepEqual(await store.load('u1'), { optedIn: false, at: null });
  const on = await store.set('u1', true);
  assert.equal(on.optedIn, true);
  assert.ok(on.at != null);
  assert.deepEqual(await store.set('u1', false), { optedIn: false, at: null });
  assert.deepEqual(await store.load('u1'), { optedIn: false, at: null });
});

test('upload requires an adult, health on, and an explicit photo opt-in', () => {
  const adult = { is_minor: false };
  assert.equal(canUploadProgressPhoto({ profile: adult, healthOn: true, photoOptedIn: true }), true);
  assert.equal(canUploadProgressPhoto({ profile: adult, healthOn: true, photoOptedIn: false }), false);
  assert.equal(canUploadProgressPhoto({ profile: adult, healthOn: false, photoOptedIn: true }), false);
  assert.equal(canUploadProgressPhoto({ profile: { is_minor: true }, healthOn: true, photoOptedIn: true }), false);
});

test('EXIF and GPS are stripped from a JPEG; non-JPEG is rejected', () => {
  const src = jpegWithGps();
  assert.ok(src.byteLength > 20);
  // Confirm the fixture really contains the GPS tag in APP1.
  const app1start = [...src].findIndex((_, i) => src[i] === 0xff && src[i + 1] === 0xe1);
  assert.ok(app1start > 0);
  const app1len = (src[app1start + 2]! << 8) | src[app1start + 3]!;
  const payload = src.subarray(app1start + 4, app1start + 2 + app1len);
  assert.equal(exifPayloadHasGps(payload), true);

  const out = stripPhotoMetadata(src, 'image/jpeg');
  assert.equal(out.hadLocation, true);
  assert.equal(out.stripped, true);
  assert.equal(out.mime, 'image/jpeg');
  assert.equal([...out.bytes].some((_, i) => out.bytes[i] === 0xff && out.bytes[i + 1] === 0xe1), false);
  assert.equal(exifPayloadHasGps(out.bytes), false);
  // Image markers remain.
  assert.equal(out.bytes[0], 0xff);
  assert.equal(out.bytes[1], 0xd8);
  assert.equal(out.bytes[out.bytes.length - 2], 0xff);
  assert.equal(out.bytes[out.bytes.length - 1], 0xd9);

  assert.throws(() => stripPhotoMetadata(u8(0x89, 0x50, 0x4e, 0x47), 'image/png'), UnsupportedPhotoTypeError);
  assert.throws(() => stripPhotoMetadata(src, 'image/heic'), UnsupportedPhotoTypeError);
});

test('photos are encrypted on the phone and face recognition stays off', async () => {
  assert.equal(FACE_RECOGNITION_ENABLED, false);
  assert.doesNotThrow(() => assertNoFaceRecognition());
  const key = generatePhotoKey();
  const plain = jpegWithGps();
  const enc = await encryptPhoto(plain, key);
  assert.ok(enc.ciphertext.byteLength > 0);
  assert.notDeepEqual([...enc.ciphertext.slice(0, 16)], [...plain.slice(0, 16)]);
  const back = await decryptPhoto(enc, key);
  assert.deepEqual([...back], [...plain]);
});

test('coach sharing is opt-in, 1:1 only, and never for minors or plan followers', () => {
  const ok = {
    isMinor: false,
    healthOn: true,
    photoOptedIn: true,
    photoShareOptedIn: true,
    coachIsApprovedAdult: true,
    hasActiveOneToOneCoach: true,
    isPlanFollowerOnly: false,
  };
  assert.equal(canShareProgressPhoto(ok), true);
  assert.equal(canShareProgressPhoto({ ...ok, isMinor: true }), false);
  assert.equal(canShareProgressPhoto({ ...ok, photoOptedIn: false }), false);
  assert.equal(canShareProgressPhoto({ ...ok, photoShareOptedIn: false }), false);
  assert.equal(canShareProgressPhoto({ ...ok, coachIsApprovedAdult: false }), false);
  assert.equal(canShareProgressPhoto({ ...ok, hasActiveOneToOneCoach: false }), false);
  assert.equal(canShareProgressPhoto({ ...ok, isPlanFollowerOnly: true }), false);
  assert.equal(canShareProgressPhoto({ ...ok, healthOn: false }), false);
  assert.equal(canSharePhotoWithCoach({ is_minor: false }, ok), true);
  assert.equal(canCoachViewSharedPhoto({ shareRevoked: false, relationshipActive: true, athleteAllows: true }), true);
  assert.equal(canCoachViewSharedPhoto({ shareRevoked: true, relationshipActive: true, athleteAllows: true }), false);
  assert.equal(canCoachViewSharedPhoto({ shareRevoked: false, relationshipActive: false, athleteAllows: true }), false);
});

test('prepare strips, encrypts, and refuses minors or missing opt-in', async () => {
  const key = generatePhotoKey();
  const src = jpegWithGps();
  const prepared = await prepareProgressPhoto(src, {
    profile: { is_minor: false },
    healthOn: true,
    photoOptedIn: true,
    keyBytes: key,
    now: new Date('2026-11-16T18:00:00Z'),
  });
  assert.equal(prepared.capturedOn, '2026-11-16');
  assert.equal(prepared.exifStripped, true);
  assert.equal(prepared.hadLocation, true);
  const plain = await decryptPhoto(prepared.encrypted, key);
  assert.equal([...plain].some((_, i) => plain[i] === 0xff && plain[i + 1] === 0xe1), false);

  await assert.rejects(
    () => prepareProgressPhoto(src, { profile: { is_minor: true }, healthOn: true, photoOptedIn: true, keyBytes: key }),
    /photo_upload_not_allowed/,
  );
  await assert.rejects(
    () => prepareProgressPhoto(src, { profile: { is_minor: false }, healthOn: true, photoOptedIn: false, keyBytes: key }),
    /photo_upload_not_allowed/,
  );
});

test('the photo path does not import a face-recognition library', () => {
  const src = readFileSync(new URL('../../src/progress/preparePhoto.ts', import.meta.url), 'utf8')
    + readFileSync(new URL('../../src/progress/photoCrypto.ts', import.meta.url), 'utf8')
    + readFileSync(new URL('../../src/features/progressPhotos.ts', import.meta.url), 'utf8');
  assert.equal(/from ['"][^'"]*(face-api|photodna|rekognition|FaceDetector)['"]/i.test(src), false);
  assert.match(src, /FACE_RECOGNITION_ENABLED/);
  assert.match(src, /assertNoFaceRecognition/);
});
