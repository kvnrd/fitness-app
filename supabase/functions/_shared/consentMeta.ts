/**
 * Preferred production path for consent-row IP / device hashing.
 *
 * Use CONSENT_META_PEPPER (edge secret) or a KMS HMAC key — never private.encryption_keys
 * and never the trainer-code pepper. The database trigger will hash with this pepper if the
 * caller SET LOCAL app.consent_meta_pepper / app.consent_meta_pepper_version in the same
 * transaction, or fall back to private.consent_meta_dev_pepper (dev only). If no pepper is
 * available, hashes are left null and an audit event is raised with the user id only (no IP).
 *
 * A DB-stored pepper is a dev fallback, not the production path.
 */
const PEPPER_ENV = 'CONSENT_META_PEPPER';
const VERSION_ENV = 'CONSENT_META_PEPPER_VERSION';

export type ConsentMetaHashes = {
  ipHash: string | null;
  deviceHash: string | null;
  pepperVersion: string | null;
  pepperMissing: boolean;
};

export function consentMetaPepperFromEnv(
  env: Record<string, string | undefined> = process.env,
): { pepper: string; version: string } | null {
  const pepper = env[PEPPER_ENV]?.trim() ?? '';
  if (!pepper) return null;
  const version = env[VERSION_ENV]?.trim() || 'edge-v1';
  return { pepper, version };
}

/** HMAC-SHA-256 hex, matching production pgcrypto hmac(data, key, 'sha256') over UTF-8 `domain:value`. */
export async function consentMetaHmac(pepper: string, domain: string, value: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(pepper),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(`${domain}:${value}`));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Hash an IP and optional device id. Never logs or returns the raw IP.
 * When the pepper is missing, hashes are null and pepperMissing is true — callers must
 * raise an alert/log event that contains the user id only, never the IP.
 */
export async function hashConsentMeta(
  ip: string | null | undefined,
  deviceId: string | null | undefined,
  env: Record<string, string | undefined> = process.env,
): Promise<ConsentMetaHashes> {
  const cfg = consentMetaPepperFromEnv(env);
  if (!cfg) {
    return { ipHash: null, deviceHash: null, pepperVersion: null, pepperMissing: true };
  }
  const ipValue = ip?.trim() ? ip.trim().slice(0, 64) : '';
  const devValue = deviceId?.trim() ? deviceId.trim().slice(0, 200) : '';
  return {
    ipHash: ipValue ? await consentMetaHmac(cfg.pepper, 'ip', ipValue) : null,
    deviceHash: devValue ? await consentMetaHmac(cfg.pepper, 'device', devValue) : null,
    pepperVersion: cfg.version,
    pepperMissing: false,
  };
}

/** Session GUC statements so a SQL consent write in this transaction uses the edge pepper. */
export function consentMetaSetLocalSql(cfg: { pepper: string; version: string }): string {
  const q = (s: string) => `'${s.replace(/'/g, "''")}'`;
  return (
    `select set_config('app.consent_meta_pepper', ${q(cfg.pepper)}, true); ` +
    `select set_config('app.consent_meta_pepper_version', ${q(cfg.version)}, true)`
  );
}
