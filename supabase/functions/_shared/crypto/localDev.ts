// LOCAL / TEST ONLY key provider. Wraps DEKs with AES-256-GCM under a master key passed in from the
// server function's environment (LOCAL_DEV_MASTER_KEY, base64 32 bytes). It refuses to run when
// APP_ENV is "production". It exists so the full flow can be tested without AWS; it gives none of the
// "key stored separately from the data" protection Counsel requires, so production MUST use aws-kms.
import { utf8 } from '../bytes.ts';
import { encryptionContext, type DataKeyContext, type GeneratedDataKey, type KeyProvider } from './keyProvider.ts';

const KEY_REF = 'local-dev:v1';

export class LocalDevKeyProvider implements KeyProvider {
  readonly id = 'local-dev' as const;
  private readonly master: Uint8Array;

  constructor(master: Uint8Array, appEnv: string | undefined) {
    if ((appEnv ?? '').toLowerCase() === 'production') throw new Error('local_dev_provider_forbidden_in_production');
    if (master.length !== 32) throw new Error('local_dev_bad_master_key');
    this.master = master;
  }

  private aad(ctx: DataKeyContext): Uint8Array {
    return utf8(JSON.stringify(encryptionContext(ctx)));
  }

  private async key(usage: KeyUsage[]): Promise<CryptoKey> {
    return crypto.subtle.importKey('raw', this.master as BufferSource, { name: 'AES-GCM' }, false, usage);
  }

  async generateDataKey(ctx: DataKeyContext): Promise<GeneratedDataKey> {
    const plaintext = crypto.getRandomValues(new Uint8Array(32));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const ct = new Uint8Array(
      await crypto.subtle.encrypt({ name: 'AES-GCM', iv: iv as BufferSource, additionalData: this.aad(ctx) as BufferSource }, await this.key(['encrypt']), plaintext as BufferSource),
    );
    const wrapped = new Uint8Array(12 + ct.length);
    wrapped.set(iv);
    wrapped.set(ct, 12);
    return { plaintext, wrapped, keyRef: KEY_REF };
  }

  async unwrapDataKey(wrapped: Uint8Array, keyRef: string, ctx: DataKeyContext): Promise<Uint8Array> {
    if (keyRef !== KEY_REF) throw new Error('local_dev_unknown_key_ref');
    const pt = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: wrapped.slice(0, 12) as BufferSource, additionalData: this.aad(ctx) as BufferSource },
      await this.key(['decrypt']),
      wrapped.slice(12) as BufferSource,
    );
    return new Uint8Array(pt);
  }
}
