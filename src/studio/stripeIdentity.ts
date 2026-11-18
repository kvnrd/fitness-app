/**
 * Stripe Identity is document-only (no selfie / no face geometry).
 * Restricted keys are server-only and must never be EXPO_PUBLIC_*.
 */

export const STRIPE_IDENTITY_VERIFICATION_TYPE = 'document' as const;

const PUBLIC_KEY_NAMES = [
  'EXPO_PUBLIC_STRIPE_RESTRICTED_KEY',
  'EXPO_PUBLIC_STRIPE_SECRET_KEY',
  'EXPO_PUBLIC_STRIPE_KEY',
  'EXPO_PUBLIC_STRIPE_IDENTITY_KEY',
] as const;

const SERVER_KEY_NAMES = ['STRIPE_RESTRICTED_KEY', 'STRIPE_SECRET_KEY'] as const;

export function isDocumentOnlyIdentity(type: string = STRIPE_IDENTITY_VERIFICATION_TYPE): boolean {
  return type === 'document';
}

export function forbidsSelfie(type: string = STRIPE_IDENTITY_VERIFICATION_TYPE): boolean {
  return type !== 'selfie' && type !== 'document_and_selfie';
}

/** Returns the restricted key from server env, or undefined if unset. Rejects public bundle keys. */
export function stripeRestrictedKey(env: NodeJS.ProcessEnv = process.env): string | undefined {
  for (const name of PUBLIC_KEY_NAMES) {
    if (env[name]?.trim()) {
      throw new Error('stripe_key_must_not_be_public');
    }
  }
  for (const name of SERVER_KEY_NAMES) {
    const v = env[name]?.trim();
    if (v) return v;
  }
  return undefined;
}
