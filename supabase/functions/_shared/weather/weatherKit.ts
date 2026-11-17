/**
 * Apple WeatherKit REST helper for the Edge Function.
 * Signing key is server-side only. Coordinates are never logged. Attribution
 * is passed through. Alert fields are unchanged. Forecasts cache for ~10 minutes.
 */
import { roundApproxLocation, type ApproxLocation } from './location.ts';
import { fail, ok, type HandlerResult } from '../http.ts';

export const WEATHER_CACHE_TTL_MS = 10 * 60 * 1000;
export const WEATHERKIT_BASE = 'https://weatherkit.apple.com/api/v1';

export type WeatherKitEnv = {
  teamId: string;
  keyId: string;
  serviceId: string;
  privateKeyPem: string;
};

export type WeatherAttribution = {
  combinedMarkLightURL?: string;
  combinedMarkDarkURL?: string;
  legalPageURL?: string;
  legalAttributionText?: string;
};

export type WeatherCacheEntry = { expiresAt: number; body: Record<string, unknown> };

const COORD_KEY = /^(lat|lon|latitude|longitude|coordinates?|lng)$/i;

export function readWeatherKitEnv(env: Record<string, string | undefined>): WeatherKitEnv | null {
  const teamId = env.WEATHERKIT_TEAM_ID?.trim();
  const keyId = env.WEATHERKIT_KEY_ID?.trim();
  const serviceId = env.WEATHERKIT_SERVICE_ID?.trim();
  const privateKeyPem = env.WEATHERKIT_PRIVATE_KEY?.trim();
  if (!teamId || !keyId || !serviceId || !privateKeyPem) return null;
  return { teamId, keyId, serviceId, privateKeyPem };
}

export function pickAttribution(raw: unknown): WeatherAttribution {
  if (raw == null || typeof raw !== 'object' || Array.isArray(raw)) return {};
  const o = raw as Record<string, unknown>;
  const out: WeatherAttribution = {};
  const copy = (k: keyof WeatherAttribution) => {
    const v = o[k];
    if (typeof v === 'string' && v.trim()) out[k] = v;
  };
  copy('combinedMarkLightURL');
  copy('combinedMarkDarkURL');
  copy('legalPageURL');
  copy('legalAttributionText');
  return out;
}

/** Redact coordinates (and lookalike keys) so they are never written to logs. */
export function sanitizeWeatherLog(value: unknown): unknown {
  if (value == null) return value;
  if (typeof value === 'string') return COORD_KEY.test(value) ? '[redacted]' : value;
  if (typeof value !== 'object') return value;
  if (Array.isArray(value)) return value.map(sanitizeWeatherLog);
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    out[k] = COORD_KEY.test(k) ? '[redacted]' : sanitizeWeatherLog(v);
  }
  return out;
}

export function cacheKey(loc: ApproxLocation, language: string): string {
  return `${loc.lat},${loc.lon},${language}`;
}

export type WeatherFetchDeps = {
  now?: () => number;
  fetch: typeof fetch;
  getToken: () => Promise<string>;
  cache?: Map<string, WeatherCacheEntry>;
};

export async function handleWeatherKitRequest(
  input: unknown,
  deps: WeatherFetchDeps,
): Promise<HandlerResult> {
  if (input == null || typeof input !== 'object' || Array.isArray(input)) return fail(400, 'invalid_request');
  const body = input as Record<string, unknown>;
  const lat = typeof body.lat === 'number' ? body.lat : Number(body.lat);
  const lon = typeof body.lon === 'number' ? body.lon : Number(body.lon);
  const language = typeof body.language === 'string' && body.language.trim() ? body.language.trim() : 'en-US';
  let loc: ApproxLocation;
  try {
    loc = roundApproxLocation(lat, lon);
  } catch {
    return fail(400, 'invalid_location');
  }
  const now = deps.now?.() ?? Date.now();
  const cache = deps.cache ?? new Map();
  const key = cacheKey(loc, language);
  const hit = cache.get(key);
  if (hit && hit.expiresAt > now) return ok(hit.body);

  const token = await deps.getToken();
  const auth = { authorization: `Bearer ${token}` };
  const weatherUrl =
    `${WEATHERKIT_BASE}/weather/${encodeURIComponent(language)}/${loc.lat}/${loc.lon}` +
    `?dataSets=currentWeather,forecastDaily,forecastHourly,weatherAlerts`;
  const attrUrl = `${WEATHERKIT_BASE}/attribution/${encodeURIComponent(language)}`;

  const [weatherRes, attrRes] = await Promise.all([
    deps.fetch(weatherUrl, { headers: auth }),
    deps.fetch(attrUrl, { headers: auth }),
  ]);
  if (!weatherRes.ok) return fail(weatherRes.status === 401 ? 503 : 502, 'weather_unavailable');
  const weather = (await weatherRes.json()) as Record<string, unknown>;
  let attribution: WeatherAttribution = {};
  if (attrRes.ok) {
    try {
      attribution = pickAttribution(await attrRes.json());
    } catch {
      attribution = {};
    }
  }
  if (!attribution.combinedMarkLightURL && !attribution.combinedMarkDarkURL && !attribution.legalPageURL) {
    if (typeof weather.legalAttributionText === 'string') {
      attribution.legalAttributionText = weather.legalAttributionText;
    }
  }
  const alerts = weather.weatherAlerts ?? null;
  const result = {
    currentWeather: weather.currentWeather ?? null,
    forecastDaily: weather.forecastDaily ?? null,
    forecastHourly: weather.forecastHourly ?? null,
    weatherAlerts: alerts,
    attribution,
    location: loc,
  };
  cache.set(key, { expiresAt: now + WEATHER_CACHE_TTL_MS, body: result });
  return ok(result);
}
