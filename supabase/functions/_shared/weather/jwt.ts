import type { WeatherKitEnv } from './weatherKit.ts';

function b64url(data: Uint8Array): string {
  let s = '';
  for (const b of data) s += String.fromCharCode(b);
  return btoa(s).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');
}

function pemToPkcs8(pem: string): Uint8Array {
  const b64 = pem.replace(/-----BEGIN [A-Z ]+-----/, '').replace(/-----END [A-Z ]+-----/, '').replace(/\s+/g, '');
  const raw = atob(b64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

export async function createWeatherKitToken(cfg: WeatherKitEnv, now = Date.now()): Promise<string> {
  const header = { alg: 'ES256', kid: cfg.keyId, id: `${cfg.teamId}.${cfg.serviceId}` };
  const iat = Math.floor(now / 1000);
  const payload = { iss: cfg.teamId, iat, exp: iat + 60 * 30, sub: cfg.serviceId };
  const enc = new TextEncoder();
  const signingInput = `${b64url(enc.encode(JSON.stringify(header)))}.${b64url(enc.encode(JSON.stringify(payload)))}`;
  const key = await crypto.subtle.importKey(
    'pkcs8',
    pemToPkcs8(cfg.privateKeyPem) as BufferSource,
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['sign'],
  );
  const sig = new Uint8Array(await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, key, enc.encode(signingInput)));
  return `${signingInput}.${b64url(sig)}`;
}
