// SQL test runner. NOT part of the Expo app.
//   node run.mjs                      -> PGlite (in-memory, Postgres WASM) with a test-only pgcrypto stub
//   DATABASE_URL=postgres://... node run.mjs  -> real psql + real pgcrypto (CI). The database name
//                                        must end in "_test": the runner DROPS and recreates its schemas.
// Exit code 1 on any failed assertion or error.
import { readFileSync, readdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const migDir = join(here, '..', 'migrations');
const read = (p) => readFileSync(p, 'utf8');
const migrations = readdirSync(migDir).filter((f) => f.endsWith('.sql')).sort().map((f) => [f, read(join(migDir, f))]);

// Test files run in this order after the migrations, sharing one database and tests.results.
const TEST_FILES = ['rls.sql', 'phase2b.sql', 'phase3.sql', 'phase4.sql', 'phase5.sql'];

const RESET = `
  drop schema if exists public cascade; drop schema if exists private cascade; drop schema if exists app cascade;
  drop schema if exists tests cascade; drop schema if exists auth cascade; drop schema if exists extensions cascade;
  create schema public; grant usage on schema public to public;`;
const RESULTS = `select n, passed, name, detail from tests.results order by n`;

function report(rows) {
  let failed = 0;
  for (const r of rows) {
    if (!r.passed) failed++;
    console.log(`${r.passed ? 'PASS' : 'FAIL'}  ${r.name}${r.passed ? '' : '  -- ' + r.detail}`);
  }
  console.log(`\n${rows.length - failed} passed, ${failed} failed, ${rows.length} total`);
  if (rows.length === 0) { console.log('FAIL: no assertions ran'); return 1; }
  return failed ? 1 : 0;
}

async function runPglite() {
  const { PGlite } = await import('@electric-sql/pglite');
  const db = new PGlite();
  console.log('Backend: PGlite (pgcrypto STUB, not real encryption)');
  await db.exec(read(join(here, 'pgcrypto_stub.sql')));
  await db.exec(read(join(here, 'auth_stub.sql')));
  for (const [f, sql] of migrations) { console.log('migrate', f); await db.exec(sql); }
  for (const f of TEST_FILES) { console.log('test', f); await db.exec(read(join(here, f))); }
  const { rows } = await db.query(RESULTS);
  return report(rows);
}

function psql(url, args, input) {
  const r = spawnSync('psql', [url, '-X', '-q', '-v', 'ON_ERROR_STOP=1', ...args], { input, encoding: 'utf8' });
  if (r.status !== 0) { console.error(r.stderr || r.stdout); throw new Error('psql failed'); }
  return r.stdout;
}

function runPsql(url) {
  const dbName = new URL(url).pathname.replace(/^\//, '');
  if (!dbName.endsWith('_test') && process.env.ALLOW_DESTRUCTIVE_TEST_DB !== '1') {
    console.error(`Refusing: database "${dbName}" does not end in _test (the runner drops schemas).`);
    return 1;
  }
  console.log('Backend: psql (real pgcrypto)');
  psql(url, [], RESET);
  psql(url, [], read(join(here, 'auth_stub.sql')));
  for (const [f, sql] of migrations) { console.log('migrate', f); psql(url, [], sql); }
  for (const f of TEST_FILES) { console.log('test', f); psql(url, [], read(join(here, f))); }
  const out = psql(url, ['-t', '-A', '-F', '\t'], `select n, passed, name, detail from tests.results order by n`);
  const rows = out.trim().split('\n').filter(Boolean).map((l) => {
    const [n, passed, name, detail] = l.split('\t');
    return { n, passed: passed === 't', name, detail };
  });
  return report(rows);
}

try {
  const code = process.env.DATABASE_URL ? runPsql(process.env.DATABASE_URL) : await runPglite();
  process.exit(code);
} catch (e) {
  console.error('ERROR:', e.message);
  process.exit(1);
}
