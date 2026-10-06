import { cpSync, mkdirSync, rmSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const output = resolve(root, '.site');
rmSync(output, { recursive: true, force: true });
mkdirSync(output, { recursive: true });
for (const file of ['index.html', 'previous.html', 'gallery', 'styles.css', 'app.js', 'content.js', '.nojekyll', 'assets']) {
  cpSync(resolve(root, file), resolve(output, file), { recursive: true });
}
console.log('Static website packaged in .site/');
