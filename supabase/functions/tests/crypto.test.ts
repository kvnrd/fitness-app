import assert from 'node:assert/strict';
import { test } from 'node:test';
import { fromBase64, fromPgBytea, toBase64, toPgBytea, utf8 } from '../_shared/bytes.ts';
import { AwsKmsKeyProvider, createKmsHttpApi, type KmsApi } from '../_shared/crypto/awsKms.ts';
import { decryptField, encryptField, fieldAad } from '../_shared/crypto/envelope.ts';
import { LocalDevKeyProvider } from '../_shared/crypto/localDev.ts';
import { activeProvider } from '../_shared/crypto/providers.ts';
import { ALICE, BOB, containsBytes, devProvider } from './helpers.ts';

test('envelope: AES-256-GCM round trip, ciphertext has no plaintext bytes', async () => {
  const dek = crypto.getRandomValues(new Uint8Array(32));
  const ct = await encryptField(dek, 'knee pain left', fieldAad(ALICE, 'injury_notes'));
  assert.equal(ct[0], 1);
  assert.ok(!containsBytes(ct, utf8('knee')));
  assert.equal(await decryptField(dek, ct, fieldAad(ALICE, 'injury_notes')), 'knee pain left');
});

test('envelope: a fresh IV every time', async () => {
  const dek = crypto.getRandomValues(new Uint8Array(32));
  const a = await encryptField(dek, 'x', fieldAad(ALICE, 'injury_notes'));
  const b = await encryptField(dek, 'x', fieldAad(ALICE, 'injury_notes'));
  assert.notDeepEqual(a, b);
});

test('envelope: ciphertext is bound to its user and field (AAD)', async () => {
  const dek = crypto.getRandomValues(new Uint8Array(32));
  const ct = await encryptField(dek, 'secret', fieldAad(ALICE, 'injury_notes'));
  await assert.rejects(decryptField(dek, ct, fieldAad(BOB, 'injury_notes')));
  await assert.rejects(decryptField(dek, ct, fieldAad(ALICE, 'health_screen')));
});

test('envelope: tampering and wrong keys are detected', async () => {
  const dek = crypto.getRandomValues(new Uint8Array(32));
  const ct = await encryptField(dek, 'secret', fieldAad(ALICE, 'injury_notes'));
  const bad = ct.slice();
  bad[bad.length - 1] ^= 1;
  await assert.rejects(decryptField(dek, bad, fieldAad(ALICE, 'injury_notes')));
  await assert.rejects(decryptField(crypto.getRandomValues(new Uint8Array(32)), ct, fieldAad(ALICE, 'injury_notes')));
  await assert.rejects(encryptField(new Uint8Array(16), 'x', fieldAad(ALICE, 'injury_notes')), /bad_dek_length/);
});

test('local-dev provider: wraps and unwraps, bound to the user', async () => {
  const p = devProvider();
  const k = await p.generateDataKey({ userId: ALICE });
  assert.equal(k.plaintext.length, 32);
  assert.ok(!containsBytes(k.wrapped, k.plaintext), 'wrapped key must not contain the DEK');
  assert.deepEqual(await p.unwrapDataKey(k.wrapped, k.keyRef, { userId: ALICE }), k.plaintext);
  await assert.rejects(p.unwrapDataKey(k.wrapped, k.keyRef, { userId: BOB }));
});

test('local-dev provider: refuses to run in production', () => {
  assert.throws(() => new LocalDevKeyProvider(new Uint8Array(32), 'production'), /forbidden_in_production/);
  assert.throws(() => new LocalDevKeyProvider(new Uint8Array(32), 'PRODUCTION'), /forbidden_in_production/);
  assert.throws(() => new LocalDevKeyProvider(new Uint8Array(8), 'dev'), /bad_master_key/);
});

test('aws-kms provider: GenerateDataKey/Decrypt with the user encryption context and pinned key id', async () => {
  const calls: { op: string; req: unknown }[] = [];
  const dek = crypto.getRandomValues(new Uint8Array(32));
  const api: KmsApi = {
    async generateDataKey(req) {
      calls.push({ op: 'gen', req });
      return { CiphertextBlob: utf8('kms-wrapped-blob-xyz'), Plaintext: dek, KeyId: 'arn:aws:kms:us-east-1:111122223333:key/abc' };
    },
    async decrypt(req) {
      calls.push({ op: 'dec', req });
      return { Plaintext: dek };
    },
  };
  const p = new AwsKmsKeyProvider(api, 'alias/fitness-health');
  const k = await p.generateDataKey({ userId: ALICE });
  assert.equal(k.keyRef, 'arn:aws:kms:us-east-1:111122223333:key/abc');
  assert.deepEqual(calls[0].req, {
    KeyId: 'alias/fitness-health', KeySpec: 'AES_256',
    EncryptionContext: { app: 'fitness-app', purpose: 'health-dek', user_id: ALICE },
  });
  await p.unwrapDataKey(k.wrapped, k.keyRef, { userId: ALICE });
  const dec = calls[1].req as { KeyId: string; EncryptionContext: Record<string, string> };
  assert.equal(dec.KeyId, k.keyRef);
  assert.equal(dec.EncryptionContext.user_id, ALICE);
  await assert.rejects(p.generateDataKey({ userId: 'someone@example.com' }), /bad_user_id/);
});

test('aws-kms http transport: KMS JSON API shape, errors never echo the body', async () => {
  const seen: { url: string; headers: Record<string, string>; body: unknown }[] = [];
  const api = createKmsHttpApi('us-east-1', async (url, init) => {
    seen.push({ url, headers: init.headers, body: JSON.parse(init.body) });
    if (init.headers['x-amz-target'] === 'TrentService.GenerateDataKey') {
      return { ok: true, status: 200, json: async () => ({ CiphertextBlob: toBase64(utf8('blob')), Plaintext: toBase64(new Uint8Array(32)), KeyId: 'arn:k' }) };
    }
    return { ok: false, status: 400, json: async () => ({ message: 'secret detail' }) };
  });
  const r = await api.generateDataKey({ KeyId: 'alias/k', KeySpec: 'AES_256', EncryptionContext: { user_id: ALICE } });
  assert.equal(seen[0].url, 'https://kms.us-east-1.amazonaws.com/');
  assert.equal(seen[0].headers['content-type'], 'application/x-amz-json-1.1');
  assert.equal(r.Plaintext.length, 32);
  await assert.rejects(api.decrypt({ CiphertextBlob: utf8('blob'), KeyId: 'arn:k', EncryptionContext: {} }), (e: Error) => {
    assert.equal(e.message, 'kms_Decrypt_failed_400');
    return true;
  });
  assert.equal((seen[1].body as { CiphertextBlob: string }).CiphertextBlob, toBase64(utf8('blob')));
  assert.throws(() => createKmsHttpApi('evil.com/', async () => ({ ok: true, status: 200, json: async () => ({}) })), /bad_region/);
});

test('providers: no silent fallback when the configured provider is missing', () => {
  assert.throws(() => activeProvider({}, 'aws-kms'), /key_provider_not_configured/);
  assert.throws(() => activeProvider({ 'local-dev': devProvider() }, undefined), /key_provider_not_configured/);
});

test('bytes: PostgREST bytea and base64 round trips', () => {
  const b = new Uint8Array([0, 1, 254, 255]);
  assert.equal(toPgBytea(b), '\\x0001feff');
  assert.deepEqual(fromPgBytea('\\x0001feff'), b);
  assert.equal(fromPgBytea(null), null);
  assert.throws(() => fromPgBytea('0001'), /bad_bytea/);
  assert.deepEqual(fromBase64(toBase64(b)), b);
});
