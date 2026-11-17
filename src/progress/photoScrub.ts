/**
 * Photos, thumbnails, and photo metadata must never reach Anthropic / ai-plan,
 * analytics, crash reports, or session replays (Counsel phase5-review §2).
 */
export const PHOTO_EXTERNAL_BLOCKLIST = ['anthropic', 'ai-plan', 'analytics', 'crash', 'session_replay'] as const;
export type PhotoExternalDestination = (typeof PHOTO_EXTERNAL_BLOCKLIST)[number];

const PHOTO_KEY = /photo|thumbnail|thumbs?|storage_path|exif|image_uri|imageuri|image_url|imageurl|camera_roll|progress.photos|progress_photos/i;

export function isPhotoLeakingKey(key: string): boolean {
  return PHOTO_KEY.test(key);
}

export type Jsonish = null | boolean | number | string | Jsonish[] | { [k: string]: Jsonish };

/** Drop any key that looks like a photo or its metadata. Recurses into objects and arrays. */
export function scrubPhotoFields<T>(input: T): T {
  return scrub(input) as T;
}

function scrub(input: unknown): unknown {
  if (Array.isArray(input)) return input.map(scrub);
  if (input === null || typeof input !== 'object') return input;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(input as Record<string, unknown>)) {
    if (isPhotoLeakingKey(k)) continue;
    out[k] = scrub(v);
  }
  return out;
}

export function payloadContainsPhotoData(input: unknown): boolean {
  if (Array.isArray(input)) return input.some(payloadContainsPhotoData);
  if (input === null || typeof input !== 'object') return false;
  for (const [k, v] of Object.entries(input as Record<string, unknown>)) {
    if (isPhotoLeakingKey(k)) return true;
    if (payloadContainsPhotoData(v)) return true;
  }
  return false;
}

/**
 * External sinks must only receive a scrubbed payload. Throws if a photo field
 * would still be present after scrubbing (should be impossible) or if the caller
 * tries to send the unscrubbed original.
 */
export function assertPhotoSafeForExternal(destination: PhotoExternalDestination, payload: unknown): void {
  if (!(PHOTO_EXTERNAL_BLOCKLIST as readonly string[]).includes(destination)) {
    throw new Error('unknown_photo_destination');
  }
  if (payloadContainsPhotoData(payload)) {
    throw new Error('photo_data_not_allowed');
  }
}
