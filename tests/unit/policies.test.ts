import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { GENERATED, POLICY_DIR, loadAll, renderGenerated } from '../../scripts/policyLib.mjs';
import { COACH_TERMS_DOC, HEALTH_POLICY_DOC, PRIVACY_POLICY_DOC, TERMS_DOC } from '../../src/legal/policies/policies.generated.ts';

const docs = { privacy: PRIVACY_POLICY_DOC, health: HEALTH_POLICY_DOC, terms: TERMS_DOC, coach_terms: COACH_TERMS_DOC };

test('generated file is current (run `npm run policies` if this fails)', () => {
  assert.equal(readFileSync(GENERATED, 'utf8'), renderGenerated());
});

test('hashes recompute from the .md files', () => {
  for (const p of loadAll()) {
    const g = docs[p.id as keyof typeof docs];
    assert.equal(g.sha256, createHash('sha256').update(p.body, 'utf8').digest('hex'));
    assert.equal(g.sha256, p.sha256);
    assert.equal(g.body, p.body);
    assert.match(g.sha256, /^[0-9a-f]{64}$/);
  }
});

test('drafting-notes block never ships', () => {
  for (const g of Object.values(docs)) {
    assert.ok(!/Drafting notes/i.test(g.body));
    assert.ok(!/delete this block before publishing/i.test(g.body));
    assert.ok(!/^>\s*\*\*Changelog/m.test(g.body));
    assert.ok(g.body.startsWith('# '));
  }
});

test('versions parsed', () => {
  assert.equal(PRIVACY_POLICY_DOC.version, 'v0.4 DRAFT');
  assert.equal(HEALTH_POLICY_DOC.version, 'v0.4 DRAFT');
  assert.equal(TERMS_DOC.version, 'v0.4 DRAFT');
  assert.equal(COACH_TERMS_DOC.version, 'v0.1 DRAFT');
  assert.match(PRIVACY_POLICY_DOC.title, /Privacy Policy/);
  assert.match(TERMS_DOC.title, /Terms of Service/);
  assert.match(COACH_TERMS_DOC.title, /Coach Terms/);
});

test('body is the source minus only the notes block', () => {
  for (const p of loadAll()) {
    const src = readFileSync(`${POLICY_DIR}/${p.file}`, 'utf8');
    assert.ok(src.length > p.body.length);
    assert.ok(p.body.includes('## 1.') || p.body.length > 500);
  }
});

import { parseBlocks, parseInline } from '../../src/components/markdownParse.ts';

test('markdown parser handles the policy bodies without losing text', () => {
  for (const [id, g] of Object.entries(docs)) {
    const blocks = parseBlocks(g.body);
    assert.ok(blocks.some((b) => b.t === 'heading'), id);
    assert.ok(blocks.some((b) => b.t === 'list'), id);
    assert.ok(blocks.some((b) => b.t === 'hr'), id);
    if (id !== 'terms' && id !== 'coach_terms') assert.ok(blocks.some((b) => b.t === 'table'), id);
    assert.ok(!JSON.stringify(blocks).includes('**'), 'unparsed bold markers left over in ' + id);
  }
});

test('inline: bold, italic, links, bare urls', () => {
  assert.deepEqual(parseInline('a **b** c'), [{ t: 'text', s: 'a ' }, { t: 'bold', c: [{ t: 'text', s: 'b' }] }, { t: 'text', s: ' c' }]);
  assert.deepEqual(parseInline('[x](/privacy-policy)'), [{ t: 'link', href: '/privacy-policy', c: [{ t: 'text', s: 'x' }] }]);
  assert.equal((parseInline('see https://a.gov/x.')[1] as { href: string }).href, 'https://a.gov/x');
  assert.equal((parseInline('an *emphasis* here')[1] as { t: string }).t, 'italic');
});
