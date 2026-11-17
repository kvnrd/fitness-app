import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { test } from 'node:test';
import {
  consentMetaHmac,
  consentMetaPepperFromEnv,
  consentMetaSetLocalSql,
  hashConsentMeta,
} from '../_shared/consentMeta.ts';

const pepper = 'test-only-consent-meta-pepper-edge-0001';
const env = { CONSENT_META_PEPPER: pepper, CONSENT_META_PEPPER_VERSION: 'edge-v1' };
const nodeHmac = (domain: string, value: string) =>
  createHmac('sha256', pepper).update(`${domain}:${value}`, 'utf8').digest('hex');

test('consent-meta HMAC matches node:crypto HMAC-SHA-256 over domain:value', async () => {
  assert.equal(await consentMetaHmac(pepper, 'ip', '203.0.113.10'), nodeHmac('ip', '203.0.113.10'));
  assert.equal(await consentMetaHmac(pepper, 'device', 'dev-1'), nodeHmac('device', 'dev-1'));
});

test('hashConsentMeta returns hashes and the pepper version when the edge secret is set', async () => {
  const out = await hashConsentMeta('203.0.113.10', 'dev-1', env);
  assert.equal(out.pepperMissing, false);
  assert.equal(out.pepperVersion, 'edge-v1');
  assert.equal(out.ipHash, nodeHmac('ip', '203.0.113.10'));
  assert.equal(out.deviceHash, nodeHmac('device', 'dev-1'));
});

test('hashConsentMeta writes null hashes and pepperMissing when the secret is absent', async () => {
  const out = await hashConsentMeta('203.0.113.10', 'dev-1', {});
  assert.deepEqual(out, { ipHash: null, deviceHash: null, pepperVersion: null, pepperMissing: true });
});

test('hashConsentMeta does not include the raw IP on the result object', async () => {
  const out = await hashConsentMeta('203.0.113.10', 'dev-1', env);
  assert.ok(!JSON.stringify(out).includes('203.0.113.10'));
});

test('consentMetaPepperFromEnv reads the dedicated secret, not a trainer-code name', () => {
  assert.equal(consentMetaPepperFromEnv({ TRAINER_CODE_PEPPER: 'nope' }), null);
  assert.deepEqual(consentMetaPepperFromEnv(env), { pepper, version: 'edge-v1' });
});

test('consentMetaSetLocalSql is a local-only SET of the pepper and version', () => {
  const sql = consentMetaSetLocalSql({ pepper: "edge'pepper", version: 'edge-v1' });
  assert.match(sql, /app\.consent_meta_pepper/);
  assert.match(sql, /app\.consent_meta_pepper_version/);
  assert.ok(sql.includes("edge''pepper"));
  assert.ok(sql.includes(', true)'));
});
