/**
 * Prepare a progress photo for upload: refuse minors, require opt-in and health,
 * strip EXIF/location, encrypt on the phone, never run face recognition.
 */
import { canUploadProgressPhoto } from '../features/progressPhotos.ts';
import { captureDateForStore, stripPhotoMetadata } from './exif.ts';
import { assertNoFaceRecognition, encryptPhoto, type EncryptedPhoto } from './photoCrypto.ts';

export type PreparedPhoto = {
  encrypted: EncryptedPhoto;
  capturedOn: string;
  exifStripped: boolean;
  hadLocation: boolean;
  mime: 'image/jpeg';
};

export async function prepareProgressPhoto(
  input: Uint8Array,
  opts: {
    profile: { is_minor: boolean } | null | undefined;
    healthOn: boolean;
    photoOptedIn: boolean;
    keyBytes: Uint8Array;
    mime?: string;
    now?: Date;
  },
): Promise<PreparedPhoto> {
  assertNoFaceRecognition();
  if (!canUploadProgressPhoto({ profile: opts.profile, healthOn: opts.healthOn, photoOptedIn: opts.photoOptedIn })) {
    throw new Error('photo_upload_not_allowed');
  }
  const stripped = stripPhotoMetadata(input, opts.mime);
  const encrypted = await encryptPhoto(stripped.bytes, opts.keyBytes);
  return {
    encrypted,
    capturedOn: captureDateForStore(opts.now ?? new Date()),
    exifStripped: true,
    hadLocation: stripped.hadLocation,
    mime: 'image/jpeg',
  };
}
