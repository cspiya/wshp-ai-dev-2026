#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export function parseArgs(argv) {
  const out = { site: '.site', phase: 'foundation' };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--site') out.site = argv[++i];
    else if (argv[i] === '--phase') out.phase = argv[++i];
    else throw new Error(`unknown argument: ${argv[i]}`);
  }
  if (!['foundation', 'final'].includes(out.phase)) throw new Error('--phase must be foundation or final');
  return out;
}
function walk(dir) { return fs.existsSync(dir) ? fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]) : []; }
function canonicalRoute(site, file) {
  const rel = path.relative(site, file).replaceAll('\\', '/');
  return rel === 'index.html' ? '/' : `/${rel.replace(/index\.html$/, '')}`;
}
function entriesOf(json) { return Array.isArray(json) ? json : json.entries ?? json.pages ?? json.documents; }
function routeOf(entry) { return entry.route ?? entry.href ?? entry.url ?? entry.id; }
function readIndex(file) {
  const text = fs.readFileSync(file, 'utf8');
  if (file.toLowerCase().endsWith('.json')) return JSON.parse(text);
  const match = text.match(/(?:window\.)?WorkshopSearchIndex\s*=\s*([\s\S]*?)\s*;?\s*$/);
  if (!match) throw new Error('search-index.js must assign JSON data to window.WorkshopSearchIndex');
  return JSON.parse(match[1].replace(/;\s*$/, ''));
}

export function validateSearch({ site, phase }) {
  const failures = [];
  const candidates = [path.join(site, 'assets/search-index.js'), path.join(site, 'assets/search-index.json'), path.join(site, 'search-index.json')];
  const indexFile = candidates.find(fs.existsSync);
  if (!indexFile) return ['search index missing (assets/search-index.json or search-index.json)'];
  let entries;
  try { entries = entriesOf(readIndex(indexFile)); } catch (error) { return [`invalid search index: ${error.message}`]; }
  if (!Array.isArray(entries) || entries.length === 0) return ['search index must contain a non-empty entries/pages/documents array'];
  const routes = new Map();
  const exactTerms = new Map();
  for (const [index, entry] of entries.entries()) {
    const route = routeOf(entry);
    if (typeof route !== 'string' || !route.startsWith('/')) { failures.push(`entry[${index}]: invalid route`); continue; }
    const key = route.toLowerCase();
    if (routes.has(key)) failures.push(`entry[${index}]: duplicate route ${route}`);
    routes.set(key, entry);
    if (typeof entry.title !== 'string' || !entry.title.trim()) failures.push(`entry[${index}]: missing title`);
    if (typeof (entry.text ?? entry.content) !== 'string' || !(entry.text ?? entry.content).trim()) failures.push(`entry[${index}]: missing searchable text`);
    const terms = [entry.title, ...(Array.isArray(entry.aliases) ? entry.aliases : [])].filter(Boolean);
    for (const term of terms) {
      const normalized = String(term).trim().toLocaleLowerCase('hu-HU');
      if (!normalized) continue;
      if (!exactTerms.has(normalized)) exactTerms.set(normalized, new Set());
      exactTerms.get(normalized).add(route);
    }
  }
  const pages = walk(site).filter((f) => f.toLowerCase().endsWith('.html'));
  const pageRoutes = new Set(pages.map((page) => canonicalRoute(site, page).toLowerCase()));
  for (const page of pages) {
    const html = fs.readFileSync(page, 'utf8');
    if (/http-equiv=["']refresh["']/i.test(html) || /data-search-exclude/i.test(html)) continue;
    const route = canonicalRoute(site, page).toLowerCase();
    if (!routes.has(route)) failures.push(`search index missing page ${route}`);
  }
  for (const route of routes.keys()) if (!pageRoutes.has(route)) failures.push(`search index route has no generated page ${route}`);
  for (const [term, resultRoutes] of exactTerms) if (resultRoutes.size !== 1 && term.length > 2) failures.push(`ambiguous exact search term "${term}" resolves to ${resultRoutes.size} routes`);
  if (phase === 'final' && routes.size !== pages.filter((p) => !/http-equiv=["']refresh["']/i.test(fs.readFileSync(p, 'utf8')) && !/data-search-exclude/i.test(fs.readFileSync(p, 'utf8'))).length) failures.push('final search index contains missing or extra canonical pages');
  return failures;
}

async function main() {
  try {
    const opts = parseArgs(process.argv.slice(2));
    const failures = validateSearch({ ...opts, site: path.resolve(opts.site) });
    if (failures.length) { console.error(failures.map((x) => `FAIL: ${x}`).join('\n')); process.exitCode = 1; }
    else console.log(`search: PASS (${opts.phase})`);
  } catch (error) { console.error(`search: ${error.message}`); process.exitCode = 2; }
}
if (path.resolve(process.argv[1] ?? '') === fileURLToPath(import.meta.url)) main();
