import { readFileSync, existsSync, statSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const read = file => readFileSync(resolve(root,file),'utf8');
const errors = [];
function checkHtml(file) {
  const html = read(file);
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
  if (new Set(ids).size !== ids.length) errors.push(`${file}: duplicate IDs`);
  for (const [,reference] of html.matchAll(/(?:src|href|poster)="([^"]+)"/g)) {
    if (reference.startsWith('#')) {
      if (reference.length>1 && !ids.includes(reference.slice(1))) errors.push(`${file}: missing anchor ${reference}`);
    } else if (!/^(https?:|mailto:|data:)/.test(reference) && !existsSync(resolve(root,reference.split('?')[0]))) errors.push(`${file}: missing ${reference}`);
  }
  if (/\bautoplay\b/.test(html)) errors.push(`${file}: unexpected autoplay attribute`);
  return html;
}
const galleryHtml = checkHtml('index.html');
const originalHtml = checkHtml('previous.html');
const original = vm.runInNewContext(`${read('content.js')}\n({copy:NCIT_COPY,features:NCIT_FEATURES,scenes:NCIT_SCENES})`);
for (const [,key] of originalHtml.matchAll(/data-i18n(?:-alt|-aria)?="([^"]+)"/g)) {
  for (const lang of ['zh','en']) if(!original.copy[lang][key])errors.push(`Archive: missing ${lang}/${key}`);
}
const gallery = vm.runInNewContext(`${read('gallery/templates.js')}\n({templates:TEMPLATES,copy:GALLERY_COPY})`);
for (const [,key] of galleryHtml.matchAll(/data-t="([^"]+)"/g)) {
  for (const lang of ['zh','en'])if(!gallery.copy[lang][key])errors.push(`Gallery: missing ${lang}/${key}`);
}
const zhKeys=Object.keys(gallery.copy.zh).sort().join();
if(zhKeys!==Object.keys(gallery.copy.en).sort().join())errors.push('Gallery language keys differ');
if(gallery.templates.length!==6)errors.push('Expected six templates');
if(new Set(gallery.templates.map(t=>t.id)).size!==6)errors.push('Duplicate template IDs');
for(const template of gallery.templates){
  for(const key of ['demo','source','license'])if(!template[key].startsWith('https://'))errors.push(`${template.id}: missing verified ${key}`);
  for(const extension of ['webp','mp4']){
    const file=resolve(root,`gallery/media/${template.id}.${extension}`);
    if(!existsSync(file)||statSync(file).size===0)errors.push(`${template.id}: missing ${extension} preview`);
  }
  for(const lang of ['zh','en'])for(const key of ['style','summary','motion','fit','terms','badge'])if(!template[lang][key])errors.push(`${template.id}: missing ${lang}/${key}`);
}
for(const file of ['app.js','content.js','gallery/templates.js','gallery/gallery.js'])new vm.Script(read(file));
if(errors.length){console.error(errors.join('\n'));process.exit(1)}
console.log('PASS: six real templates, 12 preview media, bilingual gallery, archive, local assets, anchors and JavaScript syntax.');
