// Key-provider interface for envelope encryption (Counsel C4 / Q9).
//
// A provider creates a fresh 256-bit data key (DEK) per user and returns it twice: in plaintext (used
// in memory by the server function, then wiped) and WRAPPED (encrypted by the provider's master key,
// which never leaves the provider). Only the wrapped form is stored in Postgres.
//
// `context` is bound to the wrapped key (AWS KMS EncryptionContext / AES-GCM AAD), so a wrapped key
// copied onto another user's row will not unwrap.

export type KeyProviderId = 'aws-kms' | 'local-dev';

export interface DataKeyContext {
  /** The user the DEK belongs to. Pseudonymous id only; never an email or name. */
  userId: string;
}

export interface GeneratedDataKey {
  plaintext: Uint8Array; // 32 bytes. Caller must wipe() it after use.
  wrapped: Uint8Array;
  keyRef: string; // which master key wrapped it (KMS key ARN / local id). Not secret.
}

export interface KeyProvider {
  readonly id: KeyProviderId;
  generateDataKey(ctx: DataKeyContext): Promise<GeneratedDataKey>;
  unwrapDataKey(wrapped: Uint8Array, keyRef: string, ctx: DataKeyContext): Promise<Uint8Array>;
}

export function encryptionContext(ctx: DataKeyContext): Record<string, string> {
  if (!/^[0-9a-f-]{36}$/i.test(ctx.userId)) throw new Error('bad_user_id');
  return { app: 'fitness-app', purpose: 'health-dek', user_id: ctx.userId };
}
