#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export function parseArgs(argv) {
  const out = { source: 'materials/fogalomtar/glossary.json', site: '.site', phase: 'foundation' };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--source') out.source = argv[++i];
    else if (argv[i] === '--site') out.site = argv[++i];
    else if (argv[i] === '--phase') out.phase = argv[++i];
    else throw new Error(`unknown argument: ${argv[i]}`);
  }
  if (!['foundation', 'final'].includes(out.phase)) throw new Error('--phase must be foundation or final');
  return out;
}

function recordsOf(json) { return json.terms ?? json.entries ?? json.records; }
function array(value) { return Array.isArray(value) ? value : []; }
function pageForRoute(site, route) {
  const relative = route === '/' ? 'index.html' : `${route.replace(/^\//, '')}index.html`;
  return path.join(site, ...relative.split('/'));
}
function teachingContent(html) {
  const main = html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i);
  // The generated shell is outside <main>. Keep authored headings, captions
  // and text equivalents in scope; only omit raw SVG internals because their
  // accessible teaching equivalent is the surrounding HTML figure content.
  return (main?.[1] ?? html).replace(/<svg\b[\s\S]*?<\/svg>/gi, '');
}
const CASE_SUFFIXES = ['', 't', 'at', 'et', 'ot', 'öt', 'nak', 'nek', 'ban', 'ben', 'ba', 'be', 'ból', 'ből', 'ról', 'ről', 'tól', 'től', 'ra', 're', 'hoz', 'hez', 'höz', 'nál', 'nél', 'on', 'en', 'ön', 'ért', 'ig', 'ként', 'kor', 'ul', 'ül', 'vá', 'vé', 'val', 'vel'];
const NUMBER_SUFFIXES = ['k', 'ak', 'ek', 'ok', 'ök'];
const POSSESSIVE_SUFFIXES = ['a', 'e', 'á', 'é', 'ja', 'je', 'já', 'jé', 'am', 'em', 'om', 'öm', 'ad', 'ed', 'od', 'öd', 'unk', 'ünk', 'atok', 'etek', 'otok', 'ötök', 'uk', 'ük', 'aim', 'eim', 'jaim', 'jeim', 'aink', 'eink', 'jaink', 'jeink', 'aitok', 'eitek', 'jaitok', 'jeitek', 'aik', 'eik', 'jaik', 'jeik'];
const HUNGARIAN_MULTIGRAPHS = ['dzs', 'cs', 'dz', 'gy', 'ly', 'ny', 'sz', 'ty', 'zs'];
function isCaseSuffix(base, suffix) {
  if (CASE_SUFFIXES.includes(suffix)) return true;
  const last = [...base].at(-1);
  return Boolean(last && suffix.startsWith(last) && ['al', 'el', 'á', 'é'].includes(suffix.slice(last.length)));
}
function isHungarianInflection(needle, suffix) {
  if (isCaseSuffix(needle, suffix)) return true;
  if (NUMBER_SUFFIXES.some((number) => suffix.startsWith(number) && isCaseSuffix(`${needle}${number}`, suffix.slice(number.length)))) return true;
  return POSSESSIVE_SUFFIXES.some((possessive) => suffix.startsWith(possessive) && isCaseSuffix(`${needle}${possessive}`, suffix.slice(possessive.length)));
}
function assimilatedSurfaceForms(needle) {
  const multigraph = HUNGARIAN_MULTIGRAPHS.find((candidate) => needle.endsWith(candidate));
  if (!multigraph) return [];
  const doubled = `${multigraph[0]}${multigraph}`;
  const stem = needle.slice(0, -multigraph.length);
  return ['al', 'el', 'á', 'é'].map((ending) => `${stem}${doubled}${ending}`);
}
function wholeSurfaceIndex(text, surface) {
  let at = text.indexOf(surface);
  while (at >= 0) {
    const before = at === 0 ? '' : text[at - 1];
    const after = at + surface.length === text.length ? '' : text[at + surface.length];
    if (!/[\p{L}\p{N}]/u.test(before) && !/[\p{L}\p{N}]/u.test(after)) return at;
    at = text.indexOf(surface, at + 1);
  }
  return -1;
}
function firstTermIndex(text, term) {
  const lower = text.toLocaleLowerCase('hu-HU');
  const needle = String(term).toLocaleLowerCase('hu-HU');
  const assimilatedAt = assimilatedSurfaceForms(needle)
    .map((surface) => wholeSurfaceIndex(lower, surface))
    .filter((at) => at >= 0)
    .sort((a, b) => a - b)[0];
  let at = lower.indexOf(needle);
  while (at >= 0) {
    const before = at === 0 ? '' : lower[at - 1];
    const tail = lower.slice(at + needle.length);
    const suffix = tail.match(/^[\p{L}]+/u)?.[0] ?? '';
    if (!/[\p{L}\p{N}]/u.test(before) && isHungarianInflection(needle, suffix)) return Math.min(at, assimilatedAt ?? at);
    at = lower.indexOf(needle, at + 1);
  }
  return assimilatedAt ?? -1;
}
function firstOccurrence(html, candidates) {
  let activeHref = null;
  for (const token of teachingContent(html).replace(/<script\b[\s\S]*?<\/script>/gi, '').replace(/<style\b[\s\S]*?<\/style>/gi, '').match(/<[^>]+>|[^<]+/g) ?? []) {
    if (/^<a\b/i.test(token)) activeHref = token.match(/href=(?:"([^"]*)"|'([^']*)')/i)?.[1] ?? token.match(/href=(?:"([^"]*)"|'([^']*)')/i)?.[2] ?? null;
    else if (/^<\/a/i.test(token)) activeHref = null;
    else if (!token.startsWith('<')) {
      const found = candidates.map((term) => ({ term, at: firstTermIndex(token, term) })).filter(({ at }) => at >= 0).sort((a, b) => a.at - b.at)[0];
      if (found) return { ...found, href: activeHref };
    }
  }
  return null;
}
function exactGlossaryHref(href, slug, route) {
  if (route === '/materials/fogalomtar/' && href?.toLocaleLowerCase('hu-HU') === `#${slug.toLocaleLowerCase('hu-HU')}`) return true;
  return Boolean(href && new RegExp(`fogalomtar/(?:index\\.html)?#${slug}$`, 'i').test(href));
}

export function validateGlossary({ source, site, phase }) {
  const failures = [];
  let json;
  try { json = JSON.parse(fs.readFileSync(source, 'utf8')); } catch (error) { return [`cannot read glossary: ${error.message}`]; }
  if (json.schemaVersion !== 2) failures.push('schemaVersion must be 2');
  if (typeof json.registryVersion !== 'string' || !/^2\.\d+\.\d+$/.test(json.registryVersion)) failures.push('registryVersion must be a 2.x.x semantic version');
  const records = recordsOf(json);
  if (!Array.isArray(records) || records.length === 0) return [...failures, 'glossary must contain a non-empty terms/entries/records array'];
  const slugs = new Map();
  const aliases = new Map();
  for (const [index, record] of records.entries()) {
    const label = `term[${index}]`;
    for (const key of ['slug', 'preferred', 'english', 'definitionHu']) if (typeof record[key] !== 'string' || !record[key].trim()) failures.push(`${label}: missing ${key}`);
    for (const key of ['aliases', 'avoid', 'related', 'usedIn']) if (!Array.isArray(record[key])) failures.push(`${label}: ${key} must be an array`);
    if (record.slug && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(record.slug)) failures.push(`${label}: invalid slug ${record.slug}`);
    const slugKey = record.slug?.toLowerCase();
    if (slugKey && slugs.has(slugKey)) failures.push(`${label}: duplicate slug ${record.slug}`);
    if (slugKey) slugs.set(slugKey, record);
    for (const alias of array(record.aliases)) {
      if (typeof alias !== 'string' || !alias.trim()) { failures.push(`${label}: empty alias`); continue; }
      const key = alias.toLocaleLowerCase('hu-HU');
      if (aliases.has(key)) failures.push(`${label}: duplicate alias ${alias}`);
      aliases.set(key, record.slug);
    }
  }
  for (const record of records) {
    for (const target of [...array(record.related)]) if (!slugs.has(String(target).toLowerCase())) failures.push(`${record.slug}: unknown related slug ${target}`);
    // Foundation proves the accepted registry itself. The not-yet-authored
    // routes are neutral fixtures, so usedIn/first-use belongs exclusively to
    // the final phase.
    if (phase === 'foundation') continue;
    for (const route of array(record.usedIn)) {
      if (typeof route !== 'string' || !route.startsWith('/')) { failures.push(`${record.slug}: invalid usedIn route ${route}`); continue; }
      const page = pageForRoute(site, route);
      if (!fs.existsSync(page)) { failures.push(`${record.slug}: usedIn page missing ${route}`); continue; }
      const html = fs.readFileSync(page, 'utf8');
      const candidates = [record.preferred, record.english, ...array(record.aliases)].filter(Boolean);
      const found = firstOccurrence(html, candidates);
      if (!found) { failures.push(`${record.slug}: usedIn page does not use the term: ${route}`); continue; }
      if (!exactGlossaryHref(found.href, record.slug, route)) failures.push(`${record.slug}: first use is not linked to its exact glossary anchor on ${route}`);
    }
  }
  return failures;
}

async function main() {
  try {
    const opts = parseArgs(process.argv.slice(2));
    const failures = validateGlossary({ ...opts, source: path.resolve(opts.source), site: path.resolve(opts.site) });
    if (failures.length) { console.error(failures.map((x) => `FAIL: ${x}`).join('\n')); process.exitCode = 1; }
    else console.log(`glossary: PASS (${opts.phase})`);
  } catch (error) { console.error(`glossary: ${error.message}`); process.exitCode = 2; }
}
if (path.resolve(process.argv[1] ?? '') === fileURLToPath(import.meta.url)) main();
