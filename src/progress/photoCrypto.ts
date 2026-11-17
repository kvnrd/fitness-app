/**
 * On-phone encryption for progress photos. AES-256-GCM, random IV per file.
 * The key stays in SecureStore (never AsyncStorage, never the server).
 * No face-recognition API is imported or called from this path.
 */
export const FACE_RECOGNITION_ENABLED = false as const;

export function assertNoFaceRecognition(): void {
  if (FACE_RECOGNITION_ENABLED) {
    throw new Error('face recognition is not allowed');
  }
}

const IV_LEN = 12;
const KEY_LEN = 32;

function subtle(): SubtleCrypto {
  const c = globalThis.crypto;
  if (!c?.subtle) throw new Error('Web Crypto is required to encrypt progress photos');
  return c.subtle;
}

export function generatePhotoKey(): Uint8Array {
  const key = new Uint8Array(KEY_LEN);
  globalThis.crypto.getRandomValues(key);
  return key;
}

async function importKey(keyBytes: Uint8Array): Promise<CryptoKey> {
  if (keyBytes.byteLength !== KEY_LEN) throw new Error('progress photo key must be 32 bytes');
  return subtle().importKey('raw', keyBytes.slice(), { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']);
}

export type EncryptedPhoto = { ciphertext: Uint8Array; iv: Uint8Array };

export async function encryptPhoto(plain: Uint8Array, keyBytes: Uint8Array): Promise<EncryptedPhoto> {
  assertNoFaceRecognition();
  const iv = new Uint8Array(IV_LEN);
  globalThis.crypto.getRandomValues(iv);
  const buf = await subtle().encrypt({ name: 'AES-GCM', iv }, await importKey(keyBytes), plain);
  return { ciphertext: new Uint8Array(buf), iv };
}

export async function decryptPhoto(enc: EncryptedPhoto, keyBytes: Uint8Array): Promise<Uint8Array> {
  assertNoFaceRecognition();
  const buf = await subtle().decrypt({ name: 'AES-GCM', iv: enc.iv }, await importKey(keyBytes), enc.ciphertext);
  return new Uint8Array(buf);
}
