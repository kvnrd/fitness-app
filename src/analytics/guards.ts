/**
 * Counsel Rev 5: fail if a crash or analytics event includes a user identifier.
 * Allowed: a random install ID, device/app version, and event names. Never a
 * user ID, email, or name, and never an install ID joined to account data.
 */
export const CRASH_ANALYTICS_VENDOR_ATTACHES_USER_IDS = false;

const FORBIDDEN_KEY = /^(user[_-]?id|uid|account[_-]?id|email|e-?mail|display[_-]?name|full[_-]?name|first[_-]?name|last[_-]?name|user[_-]?name|phone|birth[_-]?date|date[_-]?of[_-]?birth)$/i;
const EMAIL_VALUE = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;
const ACCOUNT_JOIN_KEYS = new Set(['installid', 'install_id', 'anonymousid', 'anonymous_id']);

export function assertCrashAnalyticsSafe(payload: unknown, path = 'payload'): void {
  if (payload == null) return;
  if (Array.isArray(payload)) {
    payload.forEach((v, i) => assertCrashAnalyticsSafe(v, `${path}[${i}]`));
    return;
  }
  if (typeof payload !== 'object') {
    if (typeof payload === 'string' && EMAIL_VALUE.test(payload)) {
      throw new Error(`crash_analytics_user_identifier: ${path} looks like an email`);
    }
    return;
  }
  const rec = payload as Record<string, unknown>;
  const keys = Object.keys(rec);
  const hasInstall = keys.some((k) => ACCOUNT_JOIN_KEYS.has(k.toLowerCase()));
  for (const [k, v] of Object.entries(rec)) {
    if (FORBIDDEN_KEY.test(k) || k.toLowerCase() === 'name') {
      throw new Error(`crash_analytics_user_identifier: ${path}.${k}`);
    }
    if (hasInstall && FORBIDDEN_KEY.test(k)) {
      throw new Error(`crash_analytics_joined_to_account: ${path}.${k}`);
    }
    assertCrashAnalyticsSafe(v, `${path}.${k}`);
  }
}

/** Single path for product analytics. No vendor is wired; the guard still runs. */
export function trackAnalyticsEvent(event: string, properties: Record<string, unknown> = {}): void {
  if (FORBIDDEN_KEY.test(event) || event.toLowerCase() === 'name') {
    throw new Error(`crash_analytics_user_identifier: event`);
  }
  assertCrashAnalyticsSafe({ event, properties });
}

/** Single path for crash reports. No vendor is wired; the guard still runs. */
export function reportCrash(error: unknown, properties: Record<string, unknown> = {}): void {
  assertCrashAnalyticsSafe({ error: error instanceof Error ? error.message : String(error), properties });
}
