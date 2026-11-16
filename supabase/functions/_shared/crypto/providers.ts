// Picks the key provider(s) from the server function's environment. Production: aws-kms only.
import type { KeyProvider, KeyProviderId } from './keyProvider.ts';

export type Providers = Partial<Record<KeyProviderId, KeyProvider>>;

/** The provider used for NEW data keys. Existing rows are opened with the provider named on the row. */
export function activeProvider(providers: Providers, configured: string | undefined): KeyProvider {
  const id = (configured ?? '') as KeyProviderId;
  const p = providers[id];
  if (!p) throw new Error('key_provider_not_configured');
  return p;
}

export function providerFor(providers: Providers, id: string): KeyProvider {
  const p = providers[id as KeyProviderId];
  if (!p) throw new Error('key_provider_unavailable');
  return p;
}
