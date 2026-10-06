// Stamps a content-hash version into the service worker and index.html and
// regenerates the list of files to cache offline.
//
//   node scripts/build.mjs          write changes
//   node scripts/build.mjs --check  exit 1 if the committed files are stale
//
// Vercel runs this as the build command, so deploys never ship a stale cache.

import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, writeFileSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../public/', import.meta.url));
const check = process.argv.includes('--check');

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    if (name.startsWith('.')) return [];
    const p = join(dir, name);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
}

const VERSION_ATTR = /data-version="[^"]*"/;
const files = walk(root)
  .map((p) => relative(root, p).split(sep).join('/'))
  .filter((p) => p !== 'sw.js')
  .sort();

const hash = createHash('sha256');
for (const f of files) {
  let content = readFileSync(join(root, f));
  if (f === 'index.html') content = Buffer.from(content.toString('utf8').replace(VERSION_ATTR, 'data-version=""'));
  hash.update(f).update('\0').update(content).update('\0');
}
const version = hash.digest('hex').slice(0, 12);

// index.html is cached as '/', which is how every host serves it.
const urls = ['/', ...files.filter((f) => f !== 'index.html').map((f) => `/${f}`)];
const block = `// <precache>\nconst VERSION = '${version}';\nconst PRECACHE = ${JSON.stringify(urls, null, 2).replace(/"/g, "'")};\n// </precache>`;

const swPath = join(root, 'sw.js');
const sw = readFileSync(swPath, 'utf8');
const nextSw = sw.replace(/\/\/ <precache>[\s\S]*?\/\/ <\/precache>/, block);

const htmlPath = join(root, 'index.html');
const html = readFileSync(htmlPath, 'utf8');
const nextHtml = html.replace(VERSION_ATTR, `data-version="${version}"`);

const stale = nextSw !== sw || nextHtml !== html;
if (check) {
  if (stale) {
    console.error('public/sw.js or public/index.html is out of date. Run: npm run build');
    process.exit(1);
  }
  console.log(`Build is up to date (version ${version}, ${urls.length} files).`);
} else {
  writeFileSync(swPath, nextSw);
  writeFileSync(htmlPath, nextHtml);
  console.log(`Stamped version ${version} with ${urls.length} precached files.`);
}
