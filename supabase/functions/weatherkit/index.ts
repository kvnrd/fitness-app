// POST /functions/v1/weatherkit  {"lat","lon","language"?}
// Apple WeatherKit REST. The signing key stays in this function's environment.
// Logs never include coordinates.
import { fail } from '../_shared/http.ts';
import { readJson, respond, verifiedUserId } from '../_shared/runtime.ts';
import { handleWeatherKitRequest, readWeatherKitEnv, sanitizeWeatherLog } from '../_shared/weather/weatherKit.ts';

Deno.serve(async (req) => {
  if (req.method !== 'POST') return respond(fail(405, 'method_not_allowed'));
  const actor = await verifiedUserId(req);
  if (!actor) return respond(fail(401, 'not_authenticated'));
  const cfg = readWeatherKitEnv({
    WEATHERKIT_TEAM_ID: Deno.env.get('WEATHERKIT_TEAM_ID') ?? undefined,
    WEATHERKIT_KEY_ID: Deno.env.get('WEATHERKIT_KEY_ID') ?? undefined,
    WEATHERKIT_SERVICE_ID: Deno.env.get('WEATHERKIT_SERVICE_ID') ?? undefined,
    WEATHERKIT_PRIVATE_KEY: Deno.env.get('WEATHERKIT_PRIVATE_KEY') ?? undefined,
  });
  if (!cfg) return respond(fail(503, 'weather_not_configured'));
  try {
    const { createWeatherKitToken } = await import('../_shared/weather/jwt.ts');
    const result = await handleWeatherKitRequest(await readJson(req), {
      fetch,
      getToken: () => createWeatherKitToken(cfg),
    });
    return respond(result);
  } catch (e) {
    console.error('weatherkit_error', sanitizeWeatherLog(e instanceof Error ? { message: e.message } : { error: 'unknown' }));
    return respond(fail(500, 'server_error'));
  }
});
