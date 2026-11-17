import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, extname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createAnalyticsInstallId } from '../../src/analytics/installId.ts';
import {
  CRASH_ANALYTICS_VENDOR_ATTACHES_USER_IDS,
  assertCrashAnalyticsSafe,
  reportCrash,
  trackAnalyticsEvent,
} from '../../src/analytics/guards.ts';
import { DATA_EXPORT_CRASH_REPORTS_LINE, DATA_EXPORT_FOOTER } from '../../src/progress/dataExportPackage.ts';
import type { KeyValueAdapter } from '../../src/onboarding/deviceSetupStore.ts';

function mem(): KeyValueAdapter & { m: Map<string, string> } {
  const m = new Map<string, string>();
  return {
    m,
    getItem: async (k) => m.get(k) ?? null,
    setItem: async (k, v) => void m.set(k, v),
    removeItem: async (k) => void m.delete(k),
  };
}

test('the analytics install ID resets on sign-out and deletion and is never a user id', async () => {
  const storage = mem();
  let n = 0;
  const ids = createAnalyticsInstallId(storage, () => `install-${String(++n).padStart(16, '0')}`);
  const first = await ids.getOrCreate();
  assert.equal(await ids.getOrCreate(), first);
  const afterSignOut = await ids.reset();
  assert.notEqual(afterSignOut, first);
  assert.equal(await ids.getOrCreate(), afterSignOut);
  const afterDeletion = await ids.reset();
  assert.notEqual(afterDeletion, afterSignOut);
  assert.match(afterDeletion, /^install-/);
});

test('crash and analytics events may not include user ID, email, or name', () => {
  assert.doesNotThrow(() => assertCrashAnalyticsSafe({ event: 'session_start', properties: { installId: 'aaaaaaaaaaaaaaaa', appVersion: '1.0.0' } }));
  assert.doesNotThrow(() => trackAnalyticsEvent('session_start', { installId: 'aaaaaaaaaaaaaaaa' }));
  assert.doesNotThrow(() => reportCrash(new Error('boom'), { installId: 'aaaaaaaaaaaaaaaa' }));
  assert.throws(() => assertCrashAnalyticsSafe({ userId: 'u1' }), /crash_analytics_user_identifier/);
  assert.throws(() => assertCrashAnalyticsSafe({ user_id: 'u1' }), /crash_analytics_user_identifier/);
  assert.throws(() => assertCrashAnalyticsSafe({ email: 'a@b.com' }), /crash_analytics_user_identifier/);
  assert.throws(() => assertCrashAnalyticsSafe({ name: 'Sam' }), /crash_analytics_user_identifier/);
  assert.throws(() => assertCrashAnalyticsSafe({ displayName: 'Sam' }), /crash_analytics_user_identifier/);
  assert.throws(() => assertCrashAnalyticsSafe({ note: 'reach me at a@b.com' }), /email/);
  assert.throws(() => trackAnalyticsEvent('tap', { userId: 'u1' }), /crash_analytics_user_identifier/);
  assert.throws(
    () => assertCrashAnalyticsSafe({ installId: 'aaaaaaaaaaaaaaaa', email: 'a@b.com' }),
    /crash_analytics_user_identifier/,
  );
});

const VENDOR_PKG = /^(?:@sentry\/|sentry-expo|@bugsnag\/|bugsnag|@datadog\/|@crashlytics|@react-native-firebase\/(?:crashlytics|analytics)|firebase(?:-admin)?|@amplitude\/|amplitude-js|posthog-react-native|posthog-js|mixpanel-browser|mixpanel-react-native|@segment\/|expo-firebase-analytics|expo-insights)$/;
const FORBIDDEN_CALL = /\b(?:Sentry\.setUser|Bugsnag\.setUser|crashlytics\(\)\.setUserId|analytics\(\)\.setUserId|setUserId\(|identifyUser|Amplitude\.getInstance\(\)\.setUserId|posthog\.identify|mixpanel\.identify|segment\.identify|FirebaseAnalytics\.setUserId)\b/;

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '../..');

function walk(dir: string, acc: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name === '.git' || name === 'dist' || name === 'coverage') continue;
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) walk(full, acc);
    else acc.push(full);
  }
  return acc;
}

test('no vendor SDK is configured to attach user IDs, so crash reports stay out of the export footer', () => {
  assert.equal(CRASH_ANALYTICS_VENDOR_ATTACHES_USER_IDS, false);
  assert.equal(DATA_EXPORT_CRASH_REPORTS_LINE, false);
  assert.equal(/crash/i.test(DATA_EXPORT_FOOTER), false);

  const pkg = JSON.parse(readFileSync(join(repoRoot, 'package.json'), 'utf8')) as {
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
  };
  const deps = { ...pkg.dependencies, ...pkg.devDependencies };
  const vendorDeps = Object.keys(deps).filter((k) => VENDOR_PKG.test(k));
  assert.deepEqual(vendorDeps, []);

  const hits: string[] = [];
  for (const file of walk(repoRoot)) {
    const rel = relative(repoRoot, file).replaceAll('\\', '/');
    if (rel.startsWith('legal/') || rel.startsWith('src/legal/') || rel.startsWith('docs/') || rel.startsWith('tests/')) continue;
    if (!['.ts', '.tsx', '.js', '.jsx', '.json', '.kt', '.swift', '.m', '.gradle'].includes(extname(file))) continue;
    if (rel === 'package-lock.json' || rel === 'package.json') continue;
    const text = readFileSync(file, 'utf8');
    if (FORBIDDEN_CALL.test(text)) hits.push(rel);
  }
  assert.deepEqual(hits, []);
});
