#!/usr/bin/env node
// Builds one edition of the site into dist/<edition>/ (or --out DIR).
//
//   node tools/build.mjs adult            the adult edition (piano now, guitar later)
//   node tools/build.mjs <edition> --out /some/dir
//
// An edition is site/ plus editions/<edition>/site.json:
//   name, slug          shown name; slug keys the device storage and the offline cache
//   audience            which drills show (each drill in shared/drills.js lists its audiences)
//   instruments         the instrument tabs that are live
//   description         for the app manifest
// BUILD_VERSION (environment) names the release in the offline cache; default: the time of the build.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const edition = args[0];
const editions = fs.readdirSync(path.join(ROOT, 'editions')).filter(e => fs.existsSync(path.join(ROOT, 'editions', e, 'site.json')));
if (!editions.includes(edition)) {
  console.error(`Usage: node tools/build.mjs <${editions.join('|')}> [--out DIR]`);
  process.exit(1);
}
const outArg = args.indexOf('--out');
const OUT = path.resolve(ROOT, outArg >= 0 ? args[outArg + 1] : path.join('dist', edition));
const cfg = JSON.parse(fs.readFileSync(path.join(ROOT, 'editions', edition, 'site.json'), 'utf8'));
for (const k of ['name', 'slug', 'audience', 'instruments']) if (!cfg[k]) { console.error(`✗ editions/${edition}/site.json has no "${k}"`); process.exit(1); }
if (!/^[a-z0-9-]+$/.test(cfg.slug)) { console.error('✗ slug: lowercase letters, digits and dashes only'); process.exit(1); }

fs.rmSync(OUT, { recursive: true, force: true });
fs.cpSync(path.join(ROOT, 'site'), OUT, { recursive: true, filter: src => path.basename(src) !== '.DS_Store' });
const out = (...p) => path.join(OUT, ...p);
const read = f => fs.readFileSync(f, 'utf8');
const write = (f, s) => fs.writeFileSync(f, s);

// the edition
const info = { name: cfg.name, slug: cfg.slug, audience: cfg.audience, instruments: cfg.instruments };
write(out('shared', 'edition.js'), `// ${cfg.name} (made by tools/build.mjs ${edition}).\nself.EDITION = ${JSON.stringify(info, null, 2)};\n`);

// the app's name and description
const manifest = JSON.parse(read(out('manifest.webmanifest')));
Object.assign(manifest, { name: cfg.name, short_name: cfg.name, ...(cfg.description && { description: cfg.description }) });
write(out('manifest.webmanifest'), JSON.stringify(manifest, null, 2) + '\n');
const walk = dir => fs.readdirSync(dir, { withFileTypes: true }).flatMap(d => d.isDirectory() ? walk(path.join(dir, d.name)) : [path.join(dir, d.name)]);
for (const f of walk(OUT).filter(f => f.endsWith('.html'))) {
  const s = read(f), t = s.replaceAll('<title>Music Academy</title>', `<title>${cfg.name}</title>`);
  if (t !== s) write(f, t);
}

// a fresh offline cache for every release
const version = (process.env.BUILD_VERSION || new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14)).replace(/[^\w.-]/g, '');
const sw = read(out('sw.js'));
if (!sw.includes("const CACHE = 'music-academy-dev';")) throw new Error('sw.js: CACHE line not found');
write(out('sw.js'), sw.replace("const CACHE = 'music-academy-dev';", `const CACHE = '${cfg.slug}-${version}';`));

console.log(`✓ ${cfg.name} (${edition}, ${cfg.audience}: ${cfg.instruments.join(', ')}) → ${path.relative(ROOT, OUT) || OUT}/ · cache ${cfg.slug}-${version}`);
