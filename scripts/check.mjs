import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const html = readFileSync(resolve(root, 'index.html'), 'utf8');
const content = readFileSync(resolve(root, 'content.js'), 'utf8');
const errors = [];
const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
if (new Set(ids).size !== ids.length) errors.push('Duplicate element IDs');
for (const [, reference] of html.matchAll(/(?:src|href|poster)="([^"]+)"/g)) {
  if (reference.startsWith('#')) {
    if (reference.length > 1 && !ids.includes(reference.slice(1))) errors.push(`Missing anchor ${reference}`);
  } else if (!/^(https?:|mailto:|data:)/.test(reference) && !existsSync(resolve(root, reference.split('?')[0]))) {
    errors.push(`Missing asset ${reference}`);
  }
}
const copy = vm.runInNewContext(`${content}\n({ copy: NCIT_COPY, features: NCIT_FEATURES, scenes: NCIT_SCENES })`);
const translationKeys = [...html.matchAll(/data-i18n(?:-alt|-aria)?="([^"]+)"/g)].map(match => match[1]);
for (const language of ['zh', 'en']) {
  for (const key of translationKeys) if (!copy.copy[language][key]) errors.push(`Missing ${language} translation: ${key}`);
  if (copy.features[language].length !== 4) errors.push(`Invalid ${language} technology features`);
}
for (const scene of Object.values(copy.scenes)) {
  if (!existsSync(resolve(root, scene.image))) errors.push(`Missing scene image: ${scene.image}`);
}
if (!/\bcontrols\b/.test(html.match(/<video[^>]*>/)?.[0] || '')) errors.push('Video controls are missing');
if (/\bautoplay\b/.test(html)) errors.push('Unexpected media autoplay');
if (/(?:TODO|TBD|lorem ipsum|placeholder)/i.test(html)) errors.push('Unfinished page copy');
new vm.Script(readFileSync(resolve(root, 'app.js'), 'utf8'));
if (errors.length) { console.error(errors.join('\n')); process.exit(1); }
console.log(`PASS: ${new Set(translationKeys).size} bilingual keys; local assets, anchors, tab content and JavaScript syntax.`);
