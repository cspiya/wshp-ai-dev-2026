#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

export function parseArgs(argv) {
  const out = { source: '.', site: '.site', phase: 'foundation' };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--source') out.source = argv[++i];
    else if (argv[i] === '--site') out.site = argv[++i];
    else if (argv[i] === '--phase') out.phase = argv[++i];
    else throw new Error(`unknown argument: ${argv[i]}`);
  }
  if (!['foundation', 'final'].includes(out.phase)) throw new Error('--phase must be foundation or final');
  return out;
}

function walk(dir, result = []) {
  if (!fs.existsSync(dir)) return result;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (['.git', '.site', 'node_modules', 'fixtures'].includes(entry.name)) continue;
    const full = path.join(dir, entry.name);
    entry.isDirectory() ? walk(full, result) : result.push(full);
  }
  return result;
}
function participantHtml(source) {
  let relativeFiles;
  try { relativeFiles = execFileSync('git', ['-C', source, 'ls-files', '*.html'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).split(/\r?\n/).filter(Boolean); }
  catch { relativeFiles = walk(source).filter((f) => f.toLowerCase().endsWith('.html')).map((f) => path.relative(source, f).replaceAll('\\', '/')); }
  return relativeFiles.filter((file) => file === 'index.html' || file.startsWith('materials/') || file === 'toolkit/index.html' || file.startsWith('toolkit/utmutatok/') || file === 'participant-starter/index.html' || file === 'reference-app/index.html');
}

export function readManifest(source) {
  const filename = path.join(source, 'toolkit/material-site/site-manifest.json');
  const json = JSON.parse(fs.readFileSync(filename, 'utf8'));
  const routes = Array.isArray(json) ? json : json.routes;
  if (!Array.isArray(routes) || routes.length === 0) throw new Error('manifest must contain a non-empty routes array');
  return routes;
}

function readManifestDocument(source) {
  const filename = path.join(source, 'toolkit/material-site/site-manifest.json');
  const json = JSON.parse(fs.readFileSync(filename, 'utf8'));
  const document = Array.isArray(json) ? { routes: json } : json;
  if (!Array.isArray(document.routes) || document.routes.length === 0) throw new Error('manifest must contain a non-empty routes array');
  return document;
}

const VISUAL_TYPES = new Set(['key-concept', 'process', 'cycle', 'structure', 'relationship', 'decision', 'timeline', 'quantitative-data']);
const OVERVIEW_CATEGORIES = new Set(['page-purpose', 'learner-value', 'main-relationships', 'learner-output-or-decision']);
export const FROZEN_ROUTES = new Map([
  ['/', { source: 'index.html', output: 'index.html', parent: null, order: 0, owner: 'SHELL-BUILD' }],
  ['/materials/', { source: 'materials/index.html', output: 'materials/index.html', parent: '/', order: 1, owner: 'MATERIALS-HUB' }],
  ['/materials/felkeszules/', { source: 'materials/felkeszules/index.html', output: 'materials/felkeszules/index.html', parent: '/materials/', order: 1, owner: 'MATERIALS-HUB' }],
  ['/materials/napirend/', { source: 'materials/napirend/index.html', output: 'materials/napirend/index.html', parent: '/materials/', order: 2, owner: 'MATERIALS-HUB' }],
  ['/materials/modszertan/', { source: 'materials/modszertan/index.html', output: 'materials/modszertan/index.html', parent: '/materials/', order: 3, owner: 'MATERIALS-HUB' }],
  ['/materials/agent-ready-repo/', { source: 'materials/agent-ready-repo/index.html', output: 'materials/agent-ready-repo/index.html', parent: '/materials/', order: 4, owner: 'MATERIALS-HUB' }],
  ['/materials/minoseg/', { source: 'materials/minoseg/index.html', output: 'materials/minoseg/index.html', parent: '/materials/', order: 5, owner: 'MATERIALS-HUB' }],
  ['/materials/eszkozok/', { source: 'materials/eszkozok/index.html', output: 'materials/eszkozok/index.html', parent: '/materials/', order: 6, owner: 'MATERIALS-HUB' }],
  ['/materials/fogalomtar/', { source: 'materials/fogalomtar/index.html', output: 'materials/fogalomtar/index.html', parent: '/materials/', order: 7, owner: 'GLOSSARY' }],
  ['/materials/modulok/', { source: 'materials/modulok/index.html', output: 'materials/modulok/index.html', parent: '/materials/', order: 8, owner: 'MATERIALS-HUB' }],
  ['/materials/modulok/01-agentikus-fejlesztes/', { source: 'materials/modulok/01-agentikus-fejlesztes/index.html', output: 'materials/modulok/01-agentikus-fejlesztes/index.html', parent: '/materials/modulok/', order: 1, owner: 'MODULE-01' }],
  ['/materials/modulok/02-repo-felkeszitese/', { source: 'materials/modulok/02-repo-felkeszitese/index.html', output: 'materials/modulok/02-repo-felkeszitese/index.html', parent: '/materials/modulok/', order: 2, owner: 'MODULE-02' }],
  ['/materials/modulok/03-specifikacio/', { source: 'materials/modulok/03-specifikacio/index.html', output: 'materials/modulok/03-specifikacio/index.html', parent: '/materials/modulok/', order: 3, owner: 'MODULE-03' }],
  ['/materials/modulok/04-fuggetlen-review/', { source: 'materials/modulok/04-fuggetlen-review/index.html', output: 'materials/modulok/04-fuggetlen-review/index.html', parent: '/materials/modulok/', order: 4, owner: 'MODULE-04' }],
  ['/materials/modulok/05-szabalyok-es-kapuk/', { source: 'materials/modulok/05-szabalyok-es-kapuk/index.html', output: 'materials/modulok/05-szabalyok-es-kapuk/index.html', parent: '/materials/modulok/', order: 5, owner: 'MODULE-05' }],
  ['/materials/modulok/06-rendszerellenorzes/', { source: 'materials/modulok/06-rendszerellenorzes/index.html', output: 'materials/modulok/06-rendszerellenorzes/index.html', parent: '/materials/modulok/', order: 6, owner: 'MODULE-06' }],
  ['/materials/modulok/07-legacy-rendszer/', { source: 'materials/modulok/07-legacy-rendszer/index.html', output: 'materials/modulok/07-legacy-rendszer/index.html', parent: '/materials/modulok/', order: 7, owner: 'MODULE-07' }],
  ['/materials/modulok/08-csapatbevezetes/', { source: 'materials/modulok/08-csapatbevezetes/index.html', output: 'materials/modulok/08-csapatbevezetes/index.html', parent: '/materials/modulok/', order: 8, owner: 'MODULE-08' }],
  ['/materials/epitesi-naplo/', { source: 'materials/epitesi-naplo/index.html', output: 'materials/epitesi-naplo/index.html', parent: '/materials/', order: 9, owner: 'JOURNAL' }],
  ['/materials/epitesi-naplo/01-repoinditas/', { source: 'materials/epitesi-naplo/01-repoinditas/index.html', output: 'materials/epitesi-naplo/01-repoinditas/index.html', parent: '/materials/epitesi-naplo/', order: 1, owner: 'JOURNAL' }],
  ['/materials/epitesi-naplo/02-elso-vertical-slice/', { source: 'materials/epitesi-naplo/02-elso-vertical-slice/index.html', output: 'materials/epitesi-naplo/02-elso-vertical-slice/index.html', parent: '/materials/epitesi-naplo/', order: 2, owner: 'JOURNAL' }],
  ['/materials/epitesi-naplo/03-rug-es-preview/', { source: 'materials/epitesi-naplo/03-rug-es-preview/index.html', output: 'materials/epitesi-naplo/03-rug-es-preview/index.html', parent: '/materials/epitesi-naplo/', order: 3, owner: 'JOURNAL' }],
  ['/materials/epitesi-naplo/04-gepi-ellenorzes/', { source: 'materials/epitesi-naplo/04-gepi-ellenorzes/index.html', output: 'materials/epitesi-naplo/04-gepi-ellenorzes/index.html', parent: '/materials/epitesi-naplo/', order: 4, owner: 'JOURNAL' }],
  ['/toolkit/', { source: 'toolkit/index.html', output: 'toolkit/index.html', parent: '/', order: 2, owner: 'TOOLKIT-WEB' }],
  ['/toolkit/utmutatok/repo-szabalyok/', { source: 'toolkit/utmutatok/repo-szabalyok/index.html', output: 'toolkit/utmutatok/repo-szabalyok/index.html', parent: '/toolkit/', order: 1, owner: 'TOOLKIT-WEB' }],
  ['/toolkit/utmutatok/specifikacio/', { source: 'toolkit/utmutatok/specifikacio/index.html', output: 'toolkit/utmutatok/specifikacio/index.html', parent: '/toolkit/', order: 2, owner: 'TOOLKIT-WEB' }],
  ['/toolkit/utmutatok/fuggetlen-review/', { source: 'toolkit/utmutatok/fuggetlen-review/index.html', output: 'toolkit/utmutatok/fuggetlen-review/index.html', parent: '/toolkit/', order: 3, owner: 'TOOLKIT-WEB' }],
  ['/toolkit/utmutatok/automatizalt-kapuk/', { source: 'toolkit/utmutatok/automatizalt-kapuk/index.html', output: 'toolkit/utmutatok/automatizalt-kapuk/index.html', parent: '/toolkit/', order: 4, owner: 'TOOLKIT-WEB' }],
  ['/toolkit/utmutatok/projektmemoria/', { source: 'toolkit/utmutatok/projektmemoria/index.html', output: 'toolkit/utmutatok/projektmemoria/index.html', parent: '/toolkit/', order: 5, owner: 'TOOLKIT-WEB' }],
  ['/toolkit/utmutatok/legacy-es-bevezetes/', { source: 'toolkit/utmutatok/legacy-es-bevezetes/index.html', output: 'toolkit/utmutatok/legacy-es-bevezetes/index.html', parent: '/toolkit/', order: 6, owner: 'TOOLKIT-WEB' }],
  ['/participant-starter/', { source: 'participant-starter/index.html', output: 'participant-starter/index.html', parent: '/', order: 3, owner: 'STARTER-WEB' }],
  ['/reference-app/', { source: 'reference-app/index.html', output: 'reference-app/index.html', parent: '/', order: 4, owner: 'REFERENCE-WEB' }],
]);
export const FROZEN_PRESENTATION = new Map(Object.entries({
  '/': ['AI-assisted fejlesztési workshop', null],
  '/materials/': ['Tananyag és haladási térkép', null],
  '/materials/felkeszules/': ['Felkészülés a workshopra', 'setup-guide.md stub'],
  '/materials/napirend/': ['A workshop menete', 'agenda.md stub'],
  '/materials/modszertan/': ['Mit építünk, és hogyan ellenőrizzük?', 'big-picture.md stub'],
  '/materials/agent-ready-repo/': ['Az agent-ready repo felépítése', 'agent-ready-repo.md stub'],
  '/materials/minoseg/': ['Közös mérnöki minőség', 'mernoki-standardok.md stub'],
  '/materials/eszkozok/': ['Pluginek, skillek és automatizálás', 'plugins-es-skillek.md stub'],
  '/materials/fogalomtar/': ['Fejlesztői fogalomtár', 'fogalomtar.md stub'],
  '/materials/modulok/': ['A workshop nyolc modulja', 'notebooks/README.md'],
  '/materials/modulok/01-agentikus-fejlesztes/': ['1. Agentikus fejlesztés: szerepek és korlátok', 'notebooks/00-bevezeto.html'],
  '/materials/modulok/02-repo-felkeszitese/': ['2. A repo felkészítése AI-agentekkel végzett fejlesztésre', 'notebooks/01-greenfield-setup.html'],
  '/materials/modulok/03-specifikacio/': ['3. Specifikációból végrehajtható terv', 'notebooks/02-spec-driven.html'],
  '/materials/modulok/04-fuggetlen-review/': ['4. Független review és javítási ciklus', 'notebooks/03-orchestrator-rug.html'],
  '/materials/modulok/05-szabalyok-es-kapuk/': ['5. Szabályok, skillek és automatizált kapuk', 'notebooks/04-rules-skills-hooks.html'],
  '/materials/modulok/06-rendszerellenorzes/': ['6. Ellenőrzés a böngészőtől az adatbázisig', 'notebooks/05-qa-e2e-token.html'],
  '/materials/modulok/07-legacy-rendszer/': ['7. Legacy rendszer biztonságos változtatása', 'notebooks/06-legacy-dotnet.html'],
  '/materials/modulok/08-csapatbevezetes/': ['8. Csapatszintű bevezetés', 'notebooks/07-team-adoption.html'],
  '/materials/epitesi-naplo/': ['Építési napló: döntések és tanulságok', 'journal README merged'],
  '/materials/epitesi-naplo/01-repoinditas/': ['1. Repoindítás', 'day-1.md stub'],
  '/materials/epitesi-naplo/02-elso-vertical-slice/': ['2. Az első vertical slice', 'day-2.md stub'],
  '/materials/epitesi-naplo/03-rug-es-preview/': ['3. RUG és preview', 'day-3.md stub'],
  '/materials/epitesi-naplo/04-gepi-ellenorzes/': ['4. Gépi ellenőrzések', 'day-4.md stub'],
  '/toolkit/': ['Hazavihető fejlesztési toolkit', 'toolkit/README.md'],
  '/toolkit/utmutatok/repo-szabalyok/': ['A repo célja és szabályai', '#repo-szabalyok'],
  '/toolkit/utmutatok/specifikacio/': ['Jóváhagyható specifikáció', '#specifikacio'],
  '/toolkit/utmutatok/fuggetlen-review/': ['Független review és javítás', '#fuggetlen-review'],
  '/toolkit/utmutatok/automatizalt-kapuk/': ['Automatizált minőségi kapuk', '#automatizalt-kapuk'],
  '/toolkit/utmutatok/projektmemoria/': ['Projektmemória és visszakeresés', '#projektmemoria'],
  '/toolkit/utmutatok/legacy-es-bevezetes/': ['Legacy és csapatszintű bevezetés', '#legacy-es-bevezetes'],
  '/participant-starter/': ['Résztvevői starter', 'participant-starter/README.md'],
  '/reference-app/': ['Referenciaalkalmazás', 'reference-app/README.md'],
}));

export const FROZEN_COMPATIBILITY_OUTPUTS = new Set([
  'materials/notebooks/00-bevezeto.html',
  'materials/notebooks/01-greenfield-setup.html',
  'materials/notebooks/02-spec-driven.html',
  'materials/notebooks/03-orchestrator-rug.html',
  'materials/notebooks/04-rules-skills-hooks.html',
  'materials/notebooks/05-qa-e2e-token.html',
  'materials/notebooks/06-legacy-dotnet.html',
  'materials/notebooks/07-team-adoption.html',
]);

function safeCompatibilityOutput(output) {
  return typeof output === 'string' && output.endsWith('.html') && !path.posix.isAbsolute(output) && !output.includes('\\') && !output.split('/').some((segment) => ['', '.', '..'].includes(segment)) && !/^[a-z][a-z0-9+.-]*:/i.test(output);
}

function validateCompatibilityRoutes(document, routes, routeIds, outputs, site, phase, failures) {
  const block = document.compatibilityRoutes;
  if (!block || block.sunset !== '2026-08-15') failures.push('compatibilityRoutes.sunset must be 2026-08-15');
  if (!Array.isArray(block?.routes) || block.routes.length !== FROZEN_COMPATIBILITY_OUTPUTS.size) {
    failures.push(`compatibilityRoutes.routes must contain exactly ${FROZEN_COMPATIBILITY_OUTPUTS.size} routes`);
    return new Set();
  }
  const seen = new Set();
  for (const [index, compat] of block.routes.entries()) {
    const label = `compatibilityRoutes.routes[${index}]`;
    if (!safeCompatibilityOutput(compat.output)) failures.push(`${label}: unsafe compatibility output ${compat.output ?? '?'}`);
    const output = typeof compat.output === 'string' ? compat.output.replaceAll('\\', '/').toLowerCase() : '';
    if (seen.has(output)) failures.push(`${label}: duplicate compatibility output ${compat.output}`);
    seen.add(output);
    if (outputs.has(output)) failures.push(`${label}: compatibility output collides with canonical output ${compat.output}`);
    if (!routeIds.has(String(compat.canonical).toLowerCase())) failures.push(`${label}: canonical target is not a manifest route: ${compat.canonical ?? '?'}`);
    if (!FROZEN_COMPATIBILITY_OUTPUTS.has(compat.output)) failures.push(`${label}: unexpected compatibility output ${compat.output ?? '?'}`);
    const alias = typeof compat.output === 'string' && compat.output.startsWith('materials/') ? compat.output.slice('materials/'.length) : null;
    const canonicalRoute = routes.find((route) => route.alias === alias);
    if (canonicalRoute && compat.canonical !== canonicalRoute.id) failures.push(`${label}: wrong canonical target for ${compat.output}; expected ${canonicalRoute.id}`);
    else if (!canonicalRoute && FROZEN_COMPATIBILITY_OUTPUTS.has(compat.output)) failures.push(`${label}: no canonical route owns legacy alias ${alias}`);
    if (phase === 'final' && safeCompatibilityOutput(compat.output) && !fs.existsSync(path.join(site, compat.output))) failures.push(`${label}: final compatibility output missing: ${compat.output}`);
  }
  for (const output of FROZEN_COMPATIBILITY_OUTPUTS) if (!seen.has(output.toLowerCase())) failures.push(`missing compatibility output: ${output}`);
  return seen;
}

function validateVisualContract(route, label, failures, canonicalSlugs) {
  if (typeof route.overviewQuestion !== 'string' || !route.overviewQuestion.trim()) failures.push(`${label}: missing overviewQuestion`);
  if (typeof route.overviewDiagramId !== 'string' || !route.overviewDiagramId.trim()) failures.push(`${label}: missing overviewDiagramId`);
  if (!Array.isArray(route.overviewCovers) || route.overviewCovers.length !== OVERVIEW_CATEGORIES.size || route.overviewCovers.some((value) => !OVERVIEW_CATEGORIES.has(value)) || new Set(route.overviewCovers).size !== OVERVIEW_CATEGORIES.size) failures.push(`${label}: overviewCovers must contain the four required big-picture categories exactly once`);
  if (!Array.isArray(route.visualQuestions) || route.visualQuestions.length === 0) { failures.push(`${label}: visualQuestions must be non-empty`); return; }
  const questionIds = new Set();
  const diagramIds = new Set();
  for (const [questionIndex, question] of route.visualQuestions.entries()) {
    const qLabel = `${label}.visualQuestions[${questionIndex}]`;
    for (const key of ['id', 'question', 'diagramId', 'takeaway']) if (typeof question[key] !== 'string' || !question[key].trim()) failures.push(`${qLabel}: missing ${key}`);
    if (question.id && questionIds.has(question.id)) failures.push(`${qLabel}: duplicate question id ${question.id}`); else if (question.id) questionIds.add(question.id);
    if (question.diagramId && diagramIds.has(question.diagramId)) failures.push(`${qLabel}: duplicate diagram id ${question.diagramId}`); else if (question.diagramId) diagramIds.add(question.diagramId);
    if (!VISUAL_TYPES.has(question.type)) failures.push(`${qLabel}: invalid visual question type ${question.type}`);
    if (!['page-local', 'shared'].includes(question.coverage)) failures.push(`${qLabel}: coverage must be page-local or shared`);
    if (!Array.isArray(question.glossarySlugs) || question.glossarySlugs.length === 0 || question.glossarySlugs.some((slug) => typeof slug !== 'string' || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug))) failures.push(`${qLabel}: glossarySlugs must contain canonical slugs`);
    else if (canonicalSlugs) for (const slug of question.glossarySlugs) if (!canonicalSlugs.has(slug)) failures.push(`${qLabel}: unknown glossary slug ${slug}`);
    if (question.coverage === 'shared' && (typeof question.sharedHref !== 'string' || !question.sharedHref.includes(`#${question.diagramId}`))) failures.push(`${qLabel}: shared coverage needs a canonical sharedHref ending in its diagram anchor`);
    if (question.coverage === 'page-local' && question.sharedHref != null) failures.push(`${qLabel}: page-local coverage cannot declare sharedHref`);
    if (question.type === 'quantitative-data' && (typeof question.quantitativeSource !== 'string' || !question.quantitativeSource.trim())) failures.push(`${qLabel}: quantitative-data requires quantitativeSource`);
  }
  const overviewMatches = route.visualQuestions.filter((question) => question.diagramId === route.overviewDiagramId);
  if (overviewMatches.length !== 1) failures.push(`${label}: overviewDiagramId must identify exactly one declared visual question`);
  else if (overviewMatches[0].coverage !== 'page-local') failures.push(`${label}: overview visual must be page-local`);
}

export function validateManifest({ source, site, phase }) {
  const failures = [];
  let document;
  try { document = readManifestDocument(source); } catch (error) { return [error.message]; }
  const routes = document.routes;
  let canonicalSlugs = null;
  const glossaryFile = path.join(source, 'materials/fogalomtar/glossary.json');
  if (fs.existsSync(glossaryFile)) {
    try { const json = JSON.parse(fs.readFileSync(glossaryFile, 'utf8')); canonicalSlugs = new Set((json.terms ?? json.entries ?? json.records ?? []).map((record) => record.slug)); }
    catch (error) { failures.push(`cannot read glossary registry for visual coverage: ${error.message}`); }
  }
  const routeIds = new Set();
  const outputs = new Set();
  const sources = new Set();
  const orders = new Set();
  const forwards = new Set();
  if (routes.length !== FROZEN_ROUTES.size) failures.push(`manifest must contain exactly ${FROZEN_ROUTES.size} frozen canonical routes`);
  for (const [index, route] of routes.entries()) {
    const label = `route[${index}]`;
    for (const key of ['id', 'source', 'output', 'title', 'owner']) {
      if (typeof route[key] !== 'string' || route[key].trim() === '') failures.push(`${label}: missing ${key}`);
    }
    validateVisualContract(route, label, failures, canonicalSlugs);
    const frozen = FROZEN_ROUTES.get(route.id);
    if (!frozen) failures.push(`${label}: route is not in the frozen canonical table: ${route.id}`);
    else for (const key of ['source', 'output', 'parent', 'order', 'owner']) if (route[key] !== frozen[key]) failures.push(`${label}: frozen ${key} mismatch for ${route.id}; expected ${frozen[key]}`);
    const presentation = FROZEN_PRESENTATION.get(route.id);
    if (presentation && (route.title !== presentation[0] || (route.alias ?? null) !== presentation[1])) failures.push(`${label}: frozen title/alias mismatch for ${route.id}`);
    if (!Number.isInteger(route.order) || route.order < 0) failures.push(`${label}: order must be a non-negative integer`);
    if (route.id && (!route.id.startsWith('/') || (route.id !== '/' && !route.id.endsWith('/')))) failures.push(`${label}: route id must be a canonical directory route`);
    for (const [value, set, name] of [[route.id, routeIds, 'route id'], [route.output, outputs, 'output'], [route.source, sources, 'source']]) {
      if (value && set.has(value.toLowerCase())) failures.push(`${label}: duplicate ${name} ${value}`);
      if (value) set.add(value.toLowerCase());
    }
    const parent = route.parent ?? (route.id === '/' ? null : '/');
    const orderKey = `${parent}|${route.order}`.toLowerCase();
    if (orders.has(orderKey)) failures.push(`${label}: duplicate sibling order ${route.order} under ${parent}`);
    orders.add(orderKey);
    if (phase === 'final' && route.source && !fs.existsSync(path.join(source, route.source))) failures.push(`${label}: final source missing: ${route.source}`);
    if (phase === 'final' && route.output) {
      const relativeOutput = route.output.replace(/^\.site[\\/]/, '');
      if (!fs.existsSync(path.join(site, relativeOutput))) failures.push(`${label}: final output missing: ${route.output}`);
    }
    const declaredForwards = [route.alias, route.forward, route['alias/forward'], ...(Array.isArray(route.aliases) ? route.aliases : [])].filter((value) => typeof value === 'string');
    for (const forward of declaredForwards) if (forward.toLowerCase().endsWith('.html')) forwards.add(forward.replaceAll('\\', '/').toLowerCase());
  }
  for (const id of FROZEN_ROUTES.keys()) if (!routes.some((route) => route.id === id)) failures.push(`missing frozen canonical route: ${id}`);
  for (const route of routes) {
    const parent = route.parent ?? (route.id === '/' ? null : '/');
    if (parent && !routeIds.has(parent.toLowerCase())) failures.push(`${route.id}: parent route does not exist: ${parent}`);
  }
  const compatibilityOutputs = validateCompatibilityRoutes(document, routes, routeIds, outputs, site, phase, failures);
  for (const output of compatibilityOutputs) forwards.add(output);
  if (phase === 'final') {
    for (const relative of participantHtml(source)) if (!sources.has(relative.toLowerCase()) && !forwards.has(relative.toLowerCase())) failures.push(`unmanifested participant HTML: ${relative}`);
  }
  return failures;
}

async function main() {
  try {
    const opts = parseArgs(process.argv.slice(2));
    const failures = validateManifest({ ...opts, source: path.resolve(opts.source), site: path.resolve(opts.site) });
    if (failures.length) { console.error(failures.map((x) => `FAIL: ${x}`).join('\n')); process.exitCode = 1; }
    else console.log(`manifest: PASS (${opts.phase})`);
  } catch (error) { console.error(`manifest: ${error.message}`); process.exitCode = 2; }
}

if (path.resolve(process.argv[1] ?? '') === fileURLToPath(import.meta.url)) main();
