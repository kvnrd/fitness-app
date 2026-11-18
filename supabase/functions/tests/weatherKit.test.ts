import test from 'node:test';
import assert from 'node:assert/strict';
import { handleWeatherKitRequest, pickAttribution, sanitizeWeatherLog, WEATHER_CACHE_TTL_MS } from '../_shared/weather/weatherKit.ts';
import { roundApproxLocation } from '../_shared/weather/location.ts';

test('WeatherKit rounds location, caches briefly, passes alerts through, and never logs coordinates', async () => {
  const rounded = roundApproxLocation(37.774929, -122.419418);
  let weatherHits = 0;
  const fetchFn = (async (input: RequestInfo | URL) => {
    const url = String(input);
    if (url.includes('/attribution/')) {
      return new Response(
        JSON.stringify({
          combinedMarkLightURL: 'https://example.com/light.svg',
          combinedMarkDarkURL: 'https://example.com/dark.svg',
          legalPageURL: 'https://developer.apple.com/weatherkit/legal',
        }),
        { status: 200 },
      );
    }
    weatherHits += 1;
    assert.match(url, new RegExp(`/${rounded.lat}/${rounded.lon}`));
    return new Response(
      JSON.stringify({
        currentWeather: { temperature: 12 },
        weatherAlerts: { alerts: [{ id: 'a1', severity: 'severe', description: 'Wind' }] },
      }),
      { status: 200 },
    );
  }) as typeof fetch;

  const cache = new Map();
  let now = 1_000;
  const first = await handleWeatherKitRequest(
    { lat: 37.774929, lon: -122.419418, language: 'en-US' },
    { fetch: fetchFn, getToken: async () => 'token', cache, now: () => now },
  );
  assert.equal(first.status, 200);
  assert.deepEqual(first.body.location, rounded);
  assert.deepEqual((first.body.weatherAlerts as { alerts: unknown[] }).alerts, [{ id: 'a1', severity: 'severe', description: 'Wind' }]);
  assert.equal((first.body.attribution as { legalPageURL: string }).legalPageURL, 'https://developer.apple.com/weatherkit/legal');

  const second = await handleWeatherKitRequest(
    { lat: 37.7751, lon: -122.4193, language: 'en-US' },
    { fetch: fetchFn, getToken: async () => 'token', cache, now: () => now + 60_000 },
  );
  assert.equal(second.status, 200);
  assert.equal(weatherHits, 1, 'same rounded cell is served from the 10-minute cache');

  now += WEATHER_CACHE_TTL_MS + 1;
  const third = await handleWeatherKitRequest(
    { lat: 37.774929, lon: -122.419418, language: 'en-US' },
    { fetch: fetchFn, getToken: async () => 'token', cache, now: () => now },
  );
  assert.equal(third.status, 200);
  assert.equal(weatherHits, 2);

  const cleaned = sanitizeWeatherLog({ lat: 37.77, lon: -122.41, message: 'ok', nested: { latitude: 1, longitude: 2 } });
  assert.deepEqual(cleaned, { lat: '[redacted]', lon: '[redacted]', message: 'ok', nested: { latitude: '[redacted]', longitude: '[redacted]' } });
});

test('attribution falls back to legalAttributionText when marks are missing', () => {
  assert.deepEqual(pickAttribution({ legalAttributionText: 'Weather data from Apple Weather' }), {
    legalAttributionText: 'Weather data from Apple Weather',
  });
});
