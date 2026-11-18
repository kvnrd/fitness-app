/**
 * Strip GPS, device, and timestamp metadata from a progress photo before encrypting
 * and uploading. JPEG only for this pass; other types are rejected so we never
 * store a file whose metadata we cannot strip.
 *
 * Server-side re-strip is defence in depth. If the file is encrypted on the phone
 * with a device key the server cannot re-strip without a decrypt path — see
 * docs/phase-5-progress.md (open question for Counsel).
 */

export const ALLOWED_PHOTO_MIME = ['image/jpeg'] as const;
export type AllowedPhotoMime = (typeof ALLOWED_PHOTO_MIME)[number];

export class UnsupportedPhotoTypeError extends Error {
  readonly code = 'unsupported_photo_type' as const;
  constructor() {
    super('Only JPEG progress photos are accepted so metadata can be stripped');
    this.name = 'UnsupportedPhotoTypeError';
  }
}

const SOI = 0xffd8;
const EOI = 0xffd9;
const SOS = 0xffda;
const APP0 = 0xffe0;
const APP15 = 0xffef;
const COM = 0xfffe;

function be16(b: Uint8Array, i: number): number {
  return (b[i]! << 8) | b[i + 1]!;
}

function isJpeg(b: Uint8Array): boolean {
  return b.length >= 4 && be16(b, 0) === SOI;
}

/** True when an APP1 EXIF payload looks like it carries a GPS IFD (tag 0x8825). */
export function exifPayloadHasGps(payload: Uint8Array): boolean {
  // payload may start with "Exif\0\0" then a TIFF header.
  let off = 0;
  if (payload.length >= 6 && payload[0] === 0x45 && payload[1] === 0x78 && payload[2] === 0x69 && payload[3] === 0x66) {
    off = 6;
  }
  const tiff = payload.subarray(off);
  if (tiff.length < 8) return false;
  const le = tiff[0] === 0x49 && tiff[1] === 0x49;
  const be = tiff[0] === 0x4d && tiff[1] === 0x4d;
  if (!le && !be) {
    // Fall back to a byte search for the GPS IFD tag.
    return findTag(payload, 0x8825);
  }
  const u16 = (i: number) => (le ? tiff[i]! | (tiff[i + 1]! << 8) : (tiff[i]! << 8) | tiff[i + 1]!);
  const u32 = (i: number) =>
    le
      ? tiff[i]! | (tiff[i + 1]! << 8) | (tiff[i + 2]! << 16) | (tiff[i + 3]! << 24)
      : (tiff[i]! << 24) | (tiff[i + 1]! << 16) | (tiff[i + 2]! << 8) | tiff[i + 3]!;
  const ifd0 = u32(4);
  if (ifd0 + 2 > tiff.length) return findTag(payload, 0x8825);
  const n = u16(ifd0);
  for (let k = 0; k < n; k++) {
    const e = ifd0 + 2 + k * 12;
    if (e + 2 > tiff.length) break;
    if (u16(e) === 0x8825) return true;
  }
  return false;
}

function findTag(bytes: Uint8Array, tag: number): boolean {
  const hi = (tag >> 8) & 0xff;
  const lo = tag & 0xff;
  for (let i = 0; i < bytes.length - 1; i++) {
    if ((bytes[i] === hi && bytes[i + 1] === lo) || (bytes[i] === lo && bytes[i + 1] === hi)) return true;
  }
  return false;
}

export type StripResult = {
  bytes: Uint8Array;
  stripped: boolean;
  hadLocation: boolean;
  mime: AllowedPhotoMime;
};

/**
 * Drop APP1–APP15 and COM segments (EXIF, XMP, IPTC, GPS, device, timestamps).
 * Keep SOI, APP0 (JFIF), and the rest of the image stream.
 */
export function stripPhotoMetadata(input: Uint8Array, mime?: string): StripResult {
  const kind = (mime ?? 'image/jpeg').toLowerCase();
  if (kind !== 'image/jpeg' && kind !== 'image/jpg') throw new UnsupportedPhotoTypeError();
  if (!isJpeg(input)) throw new UnsupportedPhotoTypeError();

  const out = new Uint8Array(input.length);
  let w = 0;
  const write = (s: Uint8Array) => {
    out.set(s, w);
    w += s.length;
  };
  write(input.subarray(0, 2)); // SOI

  let i = 2;
  let stripped = false;
  let hadLocation = false;

  while (i + 1 < input.length) {
    if (input[i] !== 0xff) {
      // Unexpected: copy the remainder.
      write(input.subarray(i));
      break;
    }
    // Skip fill bytes 0xFF 0xFF
    while (i + 1 < input.length && input[i] === 0xff && input[i + 1] === 0xff) i++;
    if (i + 1 >= input.length) break;
    const marker = be16(input, i);
    if (marker === EOI) {
      write(input.subarray(i, i + 2));
      break;
    }
    if (marker === SOS) {
      // Start of scan: remainder is entropy-coded data + EOI.
      write(input.subarray(i));
      break;
    }
    // Standalone markers (RSTn, TEM) have no length.
    if ((marker >= 0xffd0 && marker <= 0xffd7) || marker === 0xff01) {
      write(input.subarray(i, i + 2));
      i += 2;
      continue;
    }
    if (i + 3 >= input.length) {
      write(input.subarray(i));
      break;
    }
    const len = be16(input, i + 2);
    const end = i + 2 + len;
    if (len < 2 || end > input.length) {
      write(input.subarray(i));
      break;
    }
    const drop = (marker >= APP0 + 1 && marker <= APP15) || marker === COM;
    if (drop) {
      stripped = true;
      if (marker === 0xffe1) hadLocation = hadLocation || exifPayloadHasGps(input.subarray(i + 4, end));
    } else {
      write(input.subarray(i, end));
    }
    i = end;
  }

  return { bytes: out.subarray(0, w), stripped, hadLocation, mime: 'image/jpeg' };
}

/** Store our own capture date (ISO date or null if unknown). Never take it from EXIF. */
export function captureDateForStore(now: Date = new Date()): string {
  return now.toISOString().slice(0, 10);
}

/** Scan a JPEG (or an EXIF payload) for a remaining GPS IFD pointer. */
export function jpegHasGps(bytes: Uint8Array): boolean {
  if (!isJpeg(bytes)) {
    return findTag(bytes, 0x8825);
  }
  let i = 2;
  while (i + 3 < bytes.length) {
    if (bytes[i] !== 0xff) break;
    while (i + 1 < bytes.length && bytes[i] === 0xff && bytes[i + 1] === 0xff) i++;
    if (i + 1 >= bytes.length) break;
    const marker = be16(bytes, i);
    if (marker === EOI || marker === SOS) break;
    if ((marker >= 0xffd0 && marker <= 0xffd7) || marker === 0xff01) {
      i += 2;
      continue;
    }
    const len = be16(bytes, i + 2);
    const end = i + 2 + len;
    if (len < 2 || end > bytes.length) break;
    if (marker === 0xffe1 && exifPayloadHasGps(bytes.subarray(i + 4, end))) return true;
    i = end;
  }
  return false;
}

/**
 * Read DateTimeOriginal (0x9003) from a JPEG APP1 EXIF payload, on the phone only.
 * Returns the raw EXIF ASCII value (usually "YYYY:MM:DD HH:MM:SS") or null.
 */
export function readDateTimeOriginal(bytes: Uint8Array): string | null {
  if (!isJpeg(bytes)) return null;
  let i = 2;
  while (i + 3 < bytes.length) {
    if (bytes[i] !== 0xff) break;
    while (i + 1 < bytes.length && bytes[i] === 0xff && bytes[i + 1] === 0xff) i++;
    if (i + 1 >= bytes.length) break;
    const marker = be16(bytes, i);
    if (marker === EOI || marker === SOS) break;
    if ((marker >= 0xffd0 && marker <= 0xffd7) || marker === 0xff01) {
      i += 2;
      continue;
    }
    const len = be16(bytes, i + 2);
    const end = i + 2 + len;
    if (len < 2 || end > bytes.length) break;
    if (marker === 0xffe1) {
      const v = dateTimeOriginalFromExif(bytes.subarray(i + 4, end));
      if (v) return v;
    }
    i = end;
  }
  return null;
}

function dateTimeOriginalFromExif(payload: Uint8Array): string | null {
  let off = 0;
  if (payload.length >= 6 && payload[0] === 0x45 && payload[1] === 0x78 && payload[2] === 0x69 && payload[3] === 0x66) {
    off = 6;
  }
  const tiff = payload.subarray(off);
  if (tiff.length < 8) return null;
  const le = tiff[0] === 0x49 && tiff[1] === 0x49;
  const be = tiff[0] === 0x4d && tiff[1] === 0x4d;
  if (!le && !be) return null;
  const u16 = (i: number) => (le ? tiff[i]! | (tiff[i + 1]! << 8) : (tiff[i]! << 8) | tiff[i + 1]!);
  const u32 = (i: number) =>
    le
      ? tiff[i]! | (tiff[i + 1]! << 8) | (tiff[i + 2]! << 16) | (tiff[i + 3]! << 24)
      : (tiff[i]! << 24) | (tiff[i + 1]! << 16) | (tiff[i + 2]! << 8) | tiff[i + 3]!;
  const readIfd = (ifd: number, want: number): { type: number; count: number; value: number } | null => {
    if (ifd + 2 > tiff.length) return null;
    const n = u16(ifd);
    for (let k = 0; k < n; k++) {
      const e = ifd + 2 + k * 12;
      if (e + 12 > tiff.length) break;
      if (u16(e) === want) return { type: u16(e + 2), count: u32(e + 4), value: u32(e + 8) };
    }
    return null;
  };
  const ifd0 = u32(4);
  const exifPtr = readIfd(ifd0, 0x8769);
  if (!exifPtr) return null;
  const tag = readIfd(exifPtr.value, 0x9003);
  if (!tag || tag.count < 11) return null;
  const start = tag.count <= 4 ? null : tag.value;
  if (start == null || start + 10 > tiff.length) return null;
  return String.fromCharCode(...tiff.subarray(start, start + 19)).replace(/\x00+$/g, '').trim() || null;
}
