import { writeFileSync } from 'node:fs';
import { GENERATED, loadAll, renderGenerated } from './policyLib.mjs';

const all = loadAll();
writeFileSync(GENERATED, renderGenerated(all));
for (const p of all) console.log(`${p.id}: ${p.version} sha256=${p.sha256.slice(0, 12)}…`);
