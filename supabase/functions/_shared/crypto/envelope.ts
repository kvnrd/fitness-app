// Field encryption with a per-user data key: AES-256-GCM, random 96-bit IV, AAD binds the ciphertext
// to its user and field so it cannot be moved to another row or column.
// Format v1: [0x01][12-byte IV][ciphertext || 16-byte tag]
import { fromUtf8, utf8 } from '../bytes.ts';

const VERSION = 1;
const IV_LEN = 12;

export type HealthField = 'injury_notes' | 'health_screen' | 'injury_category' | 'weight_goal';

export function fieldAad(userId: string, field: HealthField): Uint8Array {
  return utf8(`fitness-app/health/v${VERSION}/${userId}/${field}`);
}

async function importDek(dek: Uint8Array, usage: KeyUsage[]): Promise<CryptoKey> {
  if (dek.length !== 32) throw new Error('bad_dek_length');
  return crypto.subtle.importKey('raw', dek as BufferSource, { name: 'AES-GCM' }, false, usage);
}

export async function encryptField(dek: Uint8Array, plaintext: string, aad: Uint8Array): Promise<Uint8Array> {
  const key = await importDek(dek, ['encrypt']);
  const iv = crypto.getRandomValues(new Uint8Array(IV_LEN));
  const ct = new Uint8Array(
    await crypto.subtle.encrypt({ name: 'AES-GCM', iv: iv as BufferSource, additionalData: aad as BufferSource, tagLength: 128 }, key, utf8(plaintext) as BufferSource),
  );
  const out = new Uint8Array(1 + IV_LEN + ct.length);
  out[0] = VERSION;
  out.set(iv, 1);
  out.set(ct, 1 + IV_LEN);
  return out;
}

export async function decryptField(dek: Uint8Array, blob: Uint8Array, aad: Uint8Array): Promise<string> {
  if (blob.length < 1 + IV_LEN + 16 || blob[0] !== VERSION) throw new Error('bad_ciphertext');
  const key = await importDek(dek, ['decrypt']);
  const pt = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: blob.slice(1, 1 + IV_LEN) as BufferSource, additionalData: aad as BufferSource, tagLength: 128 },
    key,
    blob.slice(1 + IV_LEN) as BufferSource,
  );
  return fromUtf8(new Uint8Array(pt));
}
