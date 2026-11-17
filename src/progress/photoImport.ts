/**
 * Progress-photo import (logic only; no picker UI).
 *
 * System picker only (iOS PHPicker / Android Photo Picker). No photo-library
 * permission. HEIC and PNG are re-encoded to JPEG on the device, then stripped
 * of EXIF, XMP, GPS and device data. If any GPS remains, the photo is rejected.
 * Only a user-confirmed date is kept (prefilled from DateTimeOriginal). The
 * original file is never uploaded. The PhotoDNA hook runs on the stripped JPEG
 * before encryption or storage. No face processing.
 */
import { canUploadProgressPhoto } from '../features/progressPhotos.ts';
import { jpegHasGps, readDateTimeOriginal, stripPhotoMetadata } from './exif.ts';
import { resolveImportDate } from './photoDate.ts';
import { hasImportConsent } from './photoConsent.ts';
import { assertNoFaceRecognition, encryptPhoto, type EncryptedPhoto } from './photoCrypto.ts';
import { assertSafetyPassed, runImportSafetyCheck, type PhotoSafetyHook, type PhotoSafetyResult } from './photoSafety.ts';

export const PHOTO_PICKER = 'system_picker' as const;
export const PHOTO_LIBRARY_PERMISSION = false as const;
export const PHOTO_IMPORT_UPLOADS_ORIGINAL = false as const;

export type ImportFormat = 'jpeg' | 'heic' | 'png' | 'unknown';

export type JpegConverter = (
  input: Uint8Array,
  format: Exclude<ImportFormat, 'unknown'>,
) => Promise<{ jpeg: Uint8Array; dateTimeOriginal?: string | null }> | { jpeg: Uint8Array; dateTimeOriginal?: string | null };

export type PreparedImport = {
  encrypted: EncryptedPhoto;
  capturedOn: string;
  prefilledDate: string;
  exifStripped: true;
  mime: 'image/jpeg';
  originalDiscarded: true;
  format: ImportFormat;
};

export function detectImportFormat(bytes: Uint8Array, mime?: string): ImportFormat {
  const kind = (mime ?? '').toLowerCase();
  if (kind.includes('heic') || kind.includes('heif') || isHeic(bytes)) return 'heic';
  if (kind === 'image/png' || isPng(bytes)) return 'png';
  if (kind === 'image/jpeg' || kind === 'image/jpg' || isJpegSig(bytes)) return 'jpeg';
  return 'unknown';
}

function isJpegSig(b: Uint8Array): boolean {
  return b.length >= 2 && b[0] === 0xff && b[1] === 0xd8;
}

function isPng(b: Uint8Array): boolean {
  return (
    b.length >= 8 &&
    b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 &&
    b[4] === 0x0d && b[5] === 0x0a && b[6] === 0x1a && b[7] === 0x0a
  );
}

function isHeic(b: Uint8Array): boolean {
  if (b.length < 12) return false;
  // ISO-BMFF: size + 'ftyp' + brand (heic/heif/mif1/msf1)
  const typ = String.fromCharCode(b[4]!, b[5]!, b[6]!, b[7]!);
  if (typ !== 'ftyp') return false;
  const brand = String.fromCharCode(b[8]!, b[9]!, b[10]!, b[11]!).toLowerCase();
  return brand === 'heic' || brand === 'heif' || brand === 'mif1' || brand === 'msf1';
}

export async function prepareImportedPhoto(
  input: Uint8Array,
  opts: {
    profile: { is_minor: boolean } | null | undefined;
    healthOn: boolean;
    photoOptedIn: boolean;
    importConsentVersion?: string | null;
    keyBytes: Uint8Array;
    mime?: string;
    now?: Date;
    confirmedDate?: string | null;
    convertToJpeg: JpegConverter;
    safetyHook: PhotoSafetyHook;
  },
): Promise<PreparedImport> {
  assertNoFaceRecognition();
  if (!canUploadProgressPhoto({ profile: opts.profile, healthOn: opts.healthOn, photoOptedIn: opts.photoOptedIn })) {
    throw new Error('photo_upload_not_allowed');
  }
  if (!hasImportConsent(opts.importConsentVersion)) {
    throw new Error('import_consent_required');
  }

  const format = detectImportFormat(input, opts.mime);
  if (format === 'unknown') throw new Error('unsupported_photo_type');

  let jpeg = input;
  let dateTimeOriginal = format === 'jpeg' ? readDateTimeOriginal(input) : null;
  if (format !== 'jpeg') {
    const converted = await opts.convertToJpeg(input, format);
    jpeg = converted.jpeg;
    dateTimeOriginal = converted.dateTimeOriginal ?? dateTimeOriginal;
  }

  const stripped = stripPhotoMetadata(jpeg, 'image/jpeg');
  if (jpegHasGps(stripped.bytes)) throw new Error('gps_remains');

  const { date, prefilled } = resolveImportDate({
    dateTimeOriginal,
    confirmed: opts.confirmedDate,
    today: opts.now ?? new Date(),
  });

  const safety: PhotoSafetyResult = await runImportSafetyCheck(stripped.bytes, opts.safetyHook);
  assertSafetyPassed(safety);

  const encrypted = await encryptPhoto(stripped.bytes, opts.keyBytes);
  return {
    encrypted,
    capturedOn: date,
    prefilledDate: prefilled,
    exifStripped: true,
    mime: 'image/jpeg',
    originalDiscarded: true,
    format,
  };
}
