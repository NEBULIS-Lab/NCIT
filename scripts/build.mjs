import { spawnSync } from 'node:child_process';
import { writeFile, cp } from 'node:fs/promises';
for (const config of ['vite.config.ts','vite.demo.config.ts']) {
  const result = spawnSync(process.execPath, ['node_modules/vite/bin/vite.js','build','--config',config], {stdio:'inherit'});
  if (result.status !== 0) process.exit(result.status || 1);
}
await writeFile('.site/.nojekyll','');
await cp('THIRD_PARTY_NOTICES.md','.site/THIRD_PARTY_NOTICES.md');
console.log('Built NCIT and self-contained Demo1 in .site/');
