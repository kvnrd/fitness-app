import test from 'node:test';
import assert from 'node:assert/strict';
import { roundApproxLocation } from '../../src/weather/location.ts';
import { weatherKitRequest, WEATHERKIT_KEY_IS_CLIENT_SIDE } from '../../src/weather/weatherKit.ts';
import { AWS_REGION, KMS_REGION } from '../../src/config/region.ts';
import { posthogEnabled, sentryEnabled, POSTHOG_RETENTION_DAYS, SENTRY_RETENTION_DAYS } from '../../src/analytics/vendors.ts';
import { isSupportedWearable, OTHER_WEARABLES_AVAILABLE, WEARABLE_SOURCES } from '../../src/wearables/sources.ts';

test('location is rounded to about a 1-mile grid and the client never holds the signing key', () => {
  assert.equal(WEATHERKIT_KEY_IS_CLIENT_SIDE, false);
  const a = roundApproxLocation(37.774929, -122.419418);
  const b = roundApproxLocation(37.7752, -122.4191);
  assert.deepEqual(a, b);
  assert.deepEqual(roundApproxLocation(a.lat, a.lon), a);
  const far = roundApproxLocation(37.79, -122.44);
  assert.notDeepEqual(a, far);
  const req = weatherKitRequest(39.7392, -104.9903);
  assert.equal(req.location.lat, roundApproxLocation(39.7392, -104.9903).lat);
  assert.throws(() => roundApproxLocation(100, 0));
});

test('region is AWS us-west-1 and KMS is in the same region', () => {
  assert.equal(AWS_REGION, 'us-west-1');
  assert.equal(KMS_REGION, 'us-west-1');
});

test('PostHog and Sentry stay off without env keys; retention matches the published policy', () => {
  assert.equal(posthogEnabled({} as NodeJS.ProcessEnv), false);
  assert.equal(sentryEnabled({} as NodeJS.ProcessEnv), false);
  assert.equal(posthogEnabled({ EXPO_PUBLIC_POSTHOG_KEY: 'phc_test' } as NodeJS.ProcessEnv), true);
  assert.equal(sentryEnabled({ EXPO_PUBLIC_SENTRY_DSN: 'https://example@o.ingest.sentry.io/1' } as NodeJS.ProcessEnv), true);
  assert.equal(POSTHOG_RETENTION_DAYS, 365);
  assert.equal(SENTRY_RETENTION_DAYS, 90);
});

test('only Apple Health and Garmin are supported wearables', () => {
  assert.deepEqual(WEARABLE_SOURCES, ['apple_health', 'garmin']);
  assert.equal(OTHER_WEARABLES_AVAILABLE, false);
  assert.equal(isSupportedWearable('apple_health'), true);
  assert.equal(isSupportedWearable('strava'), false);
});
