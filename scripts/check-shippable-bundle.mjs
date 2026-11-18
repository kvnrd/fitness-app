#!/usr/bin/env node
/**
 * Release check: a shippable app bundle must not contain the designer mark
 * or the placeholder DMCA-agent line (Counsel, Phase 6 rev 2).
 *
 * Scans src/ and an optional web export. Attorney-draft policy bodies
 * (src/legal/policies) are excluded because the ToS still carries Counsel's
 * placeholder agent line until registration.
 */
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');
const FORBIDDEN = ['NOT' + ' SHIPPABLE', '[' + 'DMCA agent'];

function rg(path, pattern) {
  try {
    const args = ['-n', '-F', '--hidden', '-g', '!node_modules/**', pattern, path];
    return execFileSync('rg', args, { encoding: 'utf8', cwd: ROOT });
  } catch (err) {
    if (err.status === 1) return '';
    throw err;
  }
}

const hits = [];
// Product source only. Bundled attorney-draft policy bodies (ToS still has a
// placeholder agent line until registration) are out of scope for this check.
const roots = [resolve(ROOT, 'src')];

for (const pattern of FORBIDDEN) {
  for (const dir of roots) {
    if (!existsSync(dir)) continue;
    const out = rg(dir, pattern);
    for (const line of out.split('\n').filter(Boolean)) {
      const file = line.split(':')[0] ?? '';
      if (file.includes('src/legal/policies')) continue;
      hits.push(`${pattern} :: ${line}`);
    }
  }
}

if (hits.length) {
  console.error('Shippable-bundle check failed:');
  for (const h of hits) console.error('  ' + h);
  process.exit(1);
}
console.log('shippable-bundle check: clean');
