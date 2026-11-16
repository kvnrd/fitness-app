# Server functions (Supabase Edge Functions, Deno)

| Function | What it does | Secrets it needs (function env only, never `EXPO_PUBLIC_*`) |
|---|---|---|
| `health-record` | Encrypts/decrypts health fields with a per-user data key unwrapped by KMS. The only place health plaintext exists. | `SUPABASE_SERVICE_ROLE_KEY` (auto), `KEY_PROVIDER=aws-kms`, `AWS_KMS_KEY_ID`, `AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` |
| `ai-plan` | Builds a training plan with Anthropic's Messages API (backend only), from enum inputs + age band + injury category. | the KMS ones above, `ANTHROPIC_API_KEY`, `ANTHROPIC_MODEL`, optional `ANTHROPIC_ZDR=true` |

Layout:

- `_shared/` is plain TypeScript with explicit `.ts` imports and erasable syntax only, so the same files run in Deno and in Node's test runner.
- `_shared/runtime.ts` is the only Deno-specific file (env, service client, JWT check, KMS transport via `aws4fetch`).
- `*/index.ts` are thin entry points.

Checks:

```bash
cd supabase/functions
npm test                     # node --test, no network: KMS and Anthropic are mocked
npx tsc -p tsconfig.json     # types for _shared + tests
deno check health-record/index.ts ai-plan/index.ts   # entry points (needs Deno)
```

`local-dev` key provider: for local runs only (`KEY_PROVIDER=local-dev`, `LOCAL_DEV_MASTER_KEY` = base64 of 32 random bytes). It refuses to start when `APP_ENV=production` and gives none of the protection Counsel requires. Production uses `aws-kms`.
