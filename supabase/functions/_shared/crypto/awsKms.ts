// AWS KMS adapter. The master key (a KMS symmetric key) never leaves AWS; we call GenerateDataKey and
// Decrypt with an EncryptionContext bound to the user. Transport is injected (`KmsApi`) so tests never
// touch AWS. `createKmsHttpApi` maps the two calls onto the KMS JSON API; the caller supplies a
// SigV4-signing fetch (aws4fetch in the Edge Function).
import { fromBase64, toBase64 } from '../bytes.ts';
import { encryptionContext, type DataKeyContext, type GeneratedDataKey, type KeyProvider } from './keyProvider.ts';

export interface KmsApi {
  generateDataKey(req: { KeyId: string; KeySpec: 'AES_256'; EncryptionContext: Record<string, string> }): Promise<{
    CiphertextBlob: Uint8Array;
    Plaintext: Uint8Array;
    KeyId: string;
  }>;
  decrypt(req: { CiphertextBlob: Uint8Array; KeyId: string; EncryptionContext: Record<string, string> }): Promise<{ Plaintext: Uint8Array }>;
}

export class AwsKmsKeyProvider implements KeyProvider {
  readonly id = 'aws-kms' as const;
  private readonly api: KmsApi;
  private readonly keyId: string;

  constructor(api: KmsApi, keyId: string) {
    if (!keyId) throw new Error('kms_key_id_missing');
    this.api = api;
    this.keyId = keyId;
  }

  async generateDataKey(ctx: DataKeyContext): Promise<GeneratedDataKey> {
    const r = await this.api.generateDataKey({ KeyId: this.keyId, KeySpec: 'AES_256', EncryptionContext: encryptionContext(ctx) });
    if (r.Plaintext.length !== 32) throw new Error('kms_bad_key');
    return { plaintext: r.Plaintext, wrapped: r.CiphertextBlob, keyRef: r.KeyId };
  }

  async unwrapDataKey(wrapped: Uint8Array, keyRef: string, ctx: DataKeyContext): Promise<Uint8Array> {
    // KeyId pins the call to the key that wrapped it (KMS rejects a mismatch).
    const r = await this.api.decrypt({ CiphertextBlob: wrapped, KeyId: keyRef, EncryptionContext: encryptionContext(ctx) });
    if (r.Plaintext.length !== 32) throw new Error('kms_bad_key');
    return r.Plaintext;
  }
}

export type SignedFetch = (url: string, init: { method: 'POST'; headers: Record<string, string>; body: string }) => Promise<{
  ok: boolean;
  status: number;
  json(): Promise<unknown>;
}>;

export function createKmsHttpApi(region: string, signedFetch: SignedFetch): KmsApi {
  if (!/^[a-z]{2}(-[a-z]+)+-\d$/.test(region)) throw new Error('kms_bad_region');
  const url = `https://kms.${region}.amazonaws.com/`;
  async function call(target: 'GenerateDataKey' | 'Decrypt', body: Record<string, unknown>): Promise<Record<string, unknown>> {
    const res = await signedFetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/x-amz-json-1.1', 'x-amz-target': `TrentService.${target}` },
      body: JSON.stringify(body),
    });
    // Never include the response body in errors: it can echo request details.
    if (!res.ok) throw new Error(`kms_${target}_failed_${res.status}`);
    return (await res.json()) as Record<string, unknown>;
  }
  return {
    async generateDataKey(req) {
      const r = await call('GenerateDataKey', req);
      return { CiphertextBlob: fromBase64(String(r.CiphertextBlob)), Plaintext: fromBase64(String(r.Plaintext)), KeyId: String(r.KeyId) };
    },
    async decrypt(req) {
      const r = await call('Decrypt', { ...req, CiphertextBlob: toBase64(req.CiphertextBlob) });
      return { Plaintext: fromBase64(String(r.Plaintext)) };
    },
  };
}
