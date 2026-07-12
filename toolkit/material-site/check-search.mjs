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
function routeOf(entry) {
  const explicit = entry.route ?? entry.href ?? entry.url ?? entry.id;
  if (explicit) return explicit;
  if (typeof entry.path !== 'string') return null;
  const normalized = entry.path.replaceAll('\\', '/');
  return normalized === 'index.html' ? '/' : `/${normalized.replace(/index\.html$/, '')}`;
}
function readIndex(file) {
  const text = fs.readFileSync(file, 'utf8');
  if (file.toLowerCase().endsWith('.json')) return JSON.parse(text);
  const match = text.match(/(?:window\.)?WorkshopSearchIndex\s*=\s*([\s\S]*?)\s*;?\s*$/);
  if (!match) throw new Error('search-index.js must assign JSON data to window.WorkshopSearchIndex');
  let expression = match[1].replace(/;\s*$/, '').trim();
  if (expression.startsWith('Object.freeze(') && expression.endsWith(')')) expression = expression.slice('Object.freeze('.length, -1);
  return JSON.parse(expression);
}
function stripTags(value) { return value.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/gi, ' ').replace(/&amp;/gi, '&').replace(/\s+/g, ' ').trim(); }
function glossaryFromHtml(file) {
  if (!fs.existsSync(file)) return [];
  const html = fs.readFileSync(file, 'utf8');
  const records = [];
  for (const match of html.matchAll(/<article\b([^>]*\bclass=["'][^"']*\bterm-card\b[^"']*["'][^>]*)>([\s\S]*?)<\/article>/gi)) {
    const attrs = match[1]; const body = match[2];
    const slug = attrs.match(/\bid=["']([^"']+)["']/i)?.[1];
    const localSearch = attrs.match(/\bdata-search=["']([^"']*)["']/i)?.[1] ?? '';
    const preferred = stripTags(body.match(/<h2\b[^>]*>([\s\S]*?)<\/h2>/i)?.[1] ?? '');
    const english = stripTags(body.match(/<p\b[^>]*class=["'][^"']*\benglish\b[^"']*["'][^>]*>([\s\S]*?)<\/p>/i)?.[1] ?? '');
    const aliasBlock = body.match(/<dt>\s*M[áa]s alakok\s*<\/dt>\s*<dd\b[^>]*>([\s\S]*?)<\/dd>/i)?.[1] ?? '';
    const aliases = [...aliasBlock.matchAll(/<span\b[^>]*class=["'][^"']*\bpill\b[^"']*["'][^>]*>([\s\S]*?)<\/span>/gi)].map((item) => stripTags(item[1])).filter(Boolean);
    if (slug && preferred && english) records.push({ slug, preferred, english, aliases, localSearch });
  }
  return records;
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
    const hasText = (typeof (entry.text ?? entry.content) === 'string' && (entry.text ?? entry.content).trim()) || (Array.isArray(entry.headings) && entry.headings.length > 0);
    if (!hasText) failures.push(`entry[${index}]: missing searchable text/headings`);
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
  const glossaryFile = path.join(site, 'materials/fogalomtar/glossary.json');
  const glossaryHtml = path.join(site, 'materials/fogalomtar/index.html');
  let terms = [];
  if (fs.existsSync(glossaryFile)) {
    try { const glossary = JSON.parse(fs.readFileSync(glossaryFile, 'utf8')); terms = glossary.terms ?? glossary.entries ?? glossary.records ?? []; }
    catch (error) { failures.push(`cannot read glossary search contract: ${error.message}`); }
  } else terms = glossaryFromHtml(glossaryHtml);
  if (phase === 'final' && terms.length === 0) failures.push('final search smoke requires a generated glossary registry or semantic term cards');
  if (terms.length > 0) {
    for (const record of terms) {
      for (const query of [record.preferred, record.english, ...(Array.isArray(record.aliases) ? record.aliases : [])].filter(Boolean)) {
        const normalized = String(query).toLocaleLowerCase('hu-HU');
        const exactOwners = entries.filter((entry) => [...(Array.isArray(entry.terms) ? entry.terms : []), ...(Array.isArray(entry.aliases) ? entry.aliases : [])].some((term) => String(term).toLocaleLowerCase('hu-HU') === normalized)).map(routeOf);
        if (exactOwners.length !== 1 || exactOwners[0] !== '/materials/fogalomtar/') failures.push(`glossary query "${query}" must have exactly one canonical owner in the shared search index: /materials/fogalomtar/`);
      }
    }
  }
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
