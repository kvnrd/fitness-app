// DENO / SUPABASE EDGE RUNTIME ONLY (not type-checked by the app's tsc; see supabase/functions/README.md).
// Wires env secrets, the service-role client, JWT verification and the KMS transport.
import { createClient } from 'npm:@supabase/supabase-js@2.119.0';
import { AwsClient } from 'npm:aws4fetch@1.0.20';
import { fromBase64 } from './bytes.ts';
import { AwsKmsKeyProvider, createKmsHttpApi } from './crypto/awsKms.ts';
import { LocalDevKeyProvider } from './crypto/localDev.ts';
import type { Providers } from './crypto/providers.ts';
import type { Rpc } from './db.ts';
import type { HandlerResult } from './http.ts';

const env = (k: string) => Deno.env.get(k) ?? undefined;

export function serviceRpc(): Rpc {
  const url = env('SUPABASE_URL');
  const key = env('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !key) throw new Error('server_not_configured');
  const client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  return (fn, args) => client.rpc(fn, args) as unknown as ReturnType<Rpc>;
}

/** Verifies the caller's access token with Supabase Auth and returns their user id, or null. */
export async function verifiedUserId(req: Request): Promise<string | null> {
  const auth = req.headers.get('authorization') ?? '';
  const m = /^Bearer\s+(.+)$/i.exec(auth);
  if (!m) return null;
  const url = env('SUPABASE_URL');
  const anon = env('SUPABASE_ANON_KEY');
  if (!url || !anon) return null;
  const client = createClient(url, anon, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error } = await client.auth.getUser(m[1]);
  if (error || !data?.user?.id) return null;
  return data.user.id;
}

/** KEY_PROVIDER=aws-kms (production) or local-dev (local only; refused when APP_ENV=production). */
export function keyProviders(): Providers {
  const providers: Providers = {};
  const keyId = env('AWS_KMS_KEY_ID');
  const region = env('AWS_REGION');
  const akid = env('AWS_ACCESS_KEY_ID');
  const secret = env('AWS_SECRET_ACCESS_KEY');
  if (keyId && region && akid && secret) {
    const aws = new AwsClient({ accessKeyId: akid, secretAccessKey: secret, sessionToken: env('AWS_SESSION_TOKEN'), service: 'kms', region });
    providers['aws-kms'] = new AwsKmsKeyProvider(createKmsHttpApi(region, (u, init) => aws.fetch(u, init)), keyId);
  }
  const dev = env('LOCAL_DEV_MASTER_KEY');
  if (dev && (env('APP_ENV') ?? '').toLowerCase() !== 'production') {
    providers['local-dev'] = new LocalDevKeyProvider(fromBase64(dev), env('APP_ENV'));
  }
  return providers;
}

export const activeProviderId = () => env('KEY_PROVIDER');

export function respond(r: HandlerResult): Response {
  return new Response(JSON.stringify(r.body), {
    status: r.status,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
  });
}

export async function readJson(req: Request): Promise<unknown> {
  const text = await req.text();
  if (text.length > 16_384) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}
