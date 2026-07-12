#!/usr/bin/env node
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const CSP = "default-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'; frame-src 'none'; worker-src 'none'";
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
function walk(dir) { return fs.existsSync(dir) ? fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]) : []; }
function sha(bytes) { return crypto.createHash('sha256').update(bytes).digest('hex'); }
function normalized(file) { return fs.readFileSync(file, 'utf8').replaceAll('\r\n', '\n').replace(/<!--\s*(?:Generated|generator|created)[\s\S]*?-->/gi, ''); }
function canonicalJson(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  if (value && typeof value === 'object') return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(',')}}`;
  return JSON.stringify(value);
}
function diagramsOf(json) { return Array.isArray(json) ? json : json.diagrams; }
function attr(tag, name) { const m = tag.match(new RegExp(`\\b${name}=(?:"([^"]*)"|'([^']*)')`, 'i')); return m?.[1] ?? m?.[2]; }
const COMPLEX_TYPES = new Set(['process', 'cycle', 'structure', 'relationship', 'decision', 'timeline', 'quantitative-data']);
const DIAGRAM_TYPES = {
  'key-concept': new Set(['concept-map', 'relationship-map', 'component-map', 'annotated-diagram']),
  process: new Set(['flowchart', 'sequence-diagram', 'activity-diagram']),
  cycle: new Set(['cycle-diagram', 'state-diagram']),
  structure: new Set(['component-diagram', 'architecture-diagram', 'class-diagram', 'hierarchy']),
  relationship: new Set(['relationship-map', 'concept-map', 'entity-relationship']),
  decision: new Set(['decision-tree', 'state-diagram']),
  timeline: new Set(['timeline', 'sequence-diagram']),
  'quantitative-data': new Set(['bar-chart', 'line-chart', 'scatter-plot', 'pie-chart']),
};
function readRoutes(source) {
  const file = path.join(source, 'toolkit/material-site/site-manifest.json');
  if (!fs.existsSync(file)) return [];
  const json = JSON.parse(fs.readFileSync(file, 'utf8'));
  return Array.isArray(json) ? json : json.routes ?? [];
}
function readGlossarySlugs(source) {
  const file = path.join(source, 'materials/fogalomtar/glossary.json');
  if (!fs.existsSync(file)) return null;
  const json = JSON.parse(fs.readFileSync(file, 'utf8'));
  return new Set((json.terms ?? json.entries ?? json.records ?? []).map((record) => record.slug));
}
function pageDirForRoute(route) { const dir = path.dirname(route.source).replaceAll('\\', '/'); return dir === '.' ? '' : dir; }
function diagramManifestForRoute(source, route) { return route.source === 'index.html' ? path.join(source, 'index-media/diagrams.json') : path.join(source, pageDirForRoute(route), 'media/diagrams.json'); }
function generatedForRoute(site, route) { return path.join(site, route.output.replace(/^\.site[\\/]/, '')); }
function resolveShared(page, href, site) {
  const [raw, fragment] = href.split('#', 2);
  let target = path.resolve(path.dirname(page), raw);
  if (raw.endsWith('/') || !path.extname(target)) target = path.join(target, 'index.html');
  return { target, fragment, inside: target.startsWith(`${site}${path.sep}`) };
}
function isNegativeFixture(file) { return file.replaceAll('\\', '/').includes('/fixtures/'); }

export function validateDiagrams({ source, site, phase }) {
  const failures = [];
  const htmlFiles = walk(site).filter((f) => f.toLowerCase().endsWith('.html'));
  const svgFiles = walk(site).filter((f) => f.toLowerCase().endsWith('.svg'));
  const outputReferenced = new Set();
  let routes = [];
  let glossarySlugs = null;
  try { routes = readRoutes(source); glossarySlugs = readGlossarySlugs(source); }
  catch (error) { failures.push(`visual contract input is invalid: ${error.message}`); }
  if (!routes.length) failures.push('site manifest with visual-question declarations is missing');
  const configFile = path.join(source, 'toolkit/material-site/mermaid.config.json');
  let mermaidConfig = null;
  if (fs.existsSync(configFile)) {
    const config = JSON.parse(fs.readFileSync(configFile, 'utf8'));
    mermaidConfig = config;
    if (config.securityLevel !== 'strict') failures.push('mermaid config securityLevel must be strict');
    if (config.deterministicIds !== true || config.deterministicIDSeed !== 'wshp-ai-dev-2026-v2') failures.push('mermaid deterministic ID contract is not frozen');
    if (config.htmlLabels !== false) failures.push('mermaid htmlLabels must be false');
  } else if (phase === 'final') failures.push('mermaid.config.json missing');
  for (const manifestFile of walk(source).filter((f) => !isNegativeFixture(f) && /\/(?:index-)?media\/diagrams\.json$/.test(f.replaceAll('\\', '/')))) {
    let diagrams;
    try { diagrams = diagramsOf(JSON.parse(fs.readFileSync(manifestFile, 'utf8'))); } catch (error) { failures.push(`${path.relative(source, manifestFile)}: invalid JSON: ${error.message}`); continue; }
    if (!Array.isArray(diagrams)) { failures.push(`${path.relative(source, manifestFile)}: diagrams array missing`); continue; }
    const pageRelative = path.relative(source, path.dirname(path.dirname(manifestFile))).replaceAll('\\', '/');
    const route = routes.find((candidate) => pageDirForRoute(candidate) === pageRelative);
    const isToolReference = path.relative(source, manifestFile).replaceAll('\\', '/').startsWith('toolkit/material-site/diagram/');
    if (!route && !isToolReference) failures.push(`${path.relative(source, manifestFile)}: no canonical route owns this page-local diagram manifest`);
    const declaredQuestions = new Map((route?.visualQuestions ?? []).map((question) => [question.id, question]));
    const dispositions = new Map();
    const ids = new Set();
    for (const [index, diagram] of diagrams.entries()) {
      const label = `${path.relative(source, manifestFile)}[${index}]`;
      for (const key of ['visualQuestionId', 'question', 'type', 'disposition', 'takeaway']) if (typeof diagram[key] !== 'string' || !diagram[key].trim()) failures.push(`${label}: missing ${key}`);
      if (!Array.isArray(diagram.glossarySlugs) || !diagram.glossarySlugs.length) failures.push(`${label}: canonical glossarySlugs are required`);
      for (const slug of diagram.glossarySlugs ?? []) if (glossarySlugs && !glossarySlugs.has(slug)) failures.push(`${label}: unknown glossary slug ${slug}`);
      if (!diagram.visualQuestionId || (route && !declaredQuestions.has(diagram.visualQuestionId))) failures.push(`${label}: decorative or undeclared visual has no matching visual question`);
      if (dispositions.has(diagram.visualQuestionId)) failures.push(`${label}: duplicate disposition for ${diagram.visualQuestionId}`); else dispositions.set(diagram.visualQuestionId, diagram);
      const declared = declaredQuestions.get(diagram.visualQuestionId);
      if (declared) {
        if (diagram.type !== declared.type) failures.push(`${label}: visual type does not match manifest question`);
        if (diagram.question !== declared.question) failures.push(`${label}: learner question does not match manifest`);
        if (diagram.takeaway !== declared.takeaway) failures.push(`${label}: takeaway does not match manifest`);
        const actualSlugs = [...(diagram.glossarySlugs ?? [])].sort().join('|');
        const expectedSlugs = [...(declared.glossarySlugs ?? [])].sort().join('|');
        if (actualSlugs !== expectedSlugs) failures.push(`${label}: glossary coverage does not match manifest`);
      }
      if (diagram.disposition === 'decorative-only') failures.push(`${label}: decorative-only disposition is forbidden`);
      if (diagram.disposition === 'prose-only') {
        if (COMPLEX_TYPES.has(diagram.type) || diagram.atomicGlossaryTerm !== true) failures.push(`${label}: prose-only cannot disposition a complex or non-atomic visual question`);
        continue;
      }
      if (diagram.disposition === 'shared') {
        if (declared?.coverage !== 'shared') failures.push(`${label}: shared disposition is not allowed by manifest`);
        for (const key of ['sharedDiagramId', 'sharedHref']) if (typeof diagram[key] !== 'string' || !diagram[key].trim()) failures.push(`${label}: shared disposition missing ${key}`);
        if (declared && (diagram.sharedDiagramId !== declared.diagramId || diagram.sharedHref !== declared.sharedHref)) failures.push(`${label}: shared canonical target does not match manifest`);
        const generatedPage = route ? generatedForRoute(site, route) : null;
        if (generatedPage && fs.existsSync(generatedPage) && diagram.sharedHref) {
          const shared = resolveShared(generatedPage, diagram.sharedHref, site);
          if (!shared.inside || !fs.existsSync(shared.target) || shared.fragment !== diagram.sharedDiagramId || !new RegExp(`id=["']${shared.fragment}["']`, 'i').test(fs.readFileSync(shared.target, 'utf8'))) failures.push(`${label}: broken shared canonical figure link`);
        }
        continue;
      }
      if (diagram.disposition !== 'page-local') { failures.push(`${label}: invalid disposition ${diagram.disposition}`); continue; }
      for (const key of ['id', 'diagramType', 'source', 'output', 'textFallbackSelector', 'sourceHash', 'outputHash']) if (typeof diagram[key] !== 'string' || !diagram[key].trim()) failures.push(`${label}: missing ${key}`);
      if (route && (declared?.coverage !== 'page-local' || diagram.id !== declared.diagramId)) failures.push(`${label}: page-local figure does not match declared diagramId/coverage`);
      if (!DIAGRAM_TYPES[diagram.type]?.has(diagram.diagramType)) failures.push(`${label}: invalid diagram type ${diagram.diagramType} for ${diagram.type}`);
      const isChart = /-chart$|^scatter-plot$/.test(diagram.diagramType ?? '');
      if (isChart && (diagram.type !== 'quantitative-data' || typeof diagram.quantitativeSource !== 'string' || !diagram.quantitativeSource.trim())) failures.push(`${label}: chart requires a declared quantitative source`);
      if (diagram.type === 'quantitative-data' && diagram.quantitativeSource !== declared?.quantitativeSource) failures.push(`${label}: quantitative source does not match manifest`);
      if (diagram.animation != null) {
        const animation = diagram.animation;
        for (const key of ['id', 'triggerSelector', 'pauseSelector', 'restartSelector', 'staticFallbackSelector']) if (typeof animation[key] !== 'string' || !animation[key].trim()) failures.push(`${label}: animation missing ${key}`);
        for (const key of ['userInitiated', 'keyboardOperable', 'pausable', 'restartable', 'reducedMotionDisabled', 'printDisabled', 'noJsStatic']) if (animation[key] !== true) failures.push(`${label}: animation contract requires ${key}=true`);
        if (animation.autoplay !== false) failures.push(`${label}: animation autoplay must be false`);
      }
      if (ids.has(diagram.id)) failures.push(`${label}: duplicate diagram id ${diagram.id}`); else ids.add(diagram.id);
      if (!/^[a-f0-9]{64}$/.test(diagram.sourceHash ?? '')) failures.push(`${label}: invalid sourceHash`);
      if (!/^[a-f0-9]{64}$/.test(diagram.outputHash ?? '')) failures.push(`${label}: invalid outputHash`);
      const dir = path.dirname(manifestFile);
      const mmd = path.resolve(dir, diagram.source ?? '');
      const svg = path.resolve(dir, diagram.output ?? '');
      if (!mmd.startsWith(`${dir}${path.sep}`) || !svg.startsWith(`${dir}${path.sep}`)) { failures.push(`${label}: diagram path escapes media directory`); continue; }
      if (!fs.existsSync(mmd)) failures.push(`${label}: Mermaid source missing`);
      else if (mermaidConfig) {
        const expectedSourceHash = sha(`${normalized(mmd)}${canonicalJson(mermaidConfig)}11.16.0`);
        if (expectedSourceHash !== diagram.sourceHash) failures.push(`${label}: stale Mermaid source/config/version hash`);
      }
      if (!fs.existsSync(svg)) failures.push(`${label}: SVG output missing`);
      else {
        outputReferenced.add(path.relative(source, svg).replaceAll('\\', '/').toLowerCase());
        if (sha(normalized(svg)) !== diagram.outputHash) failures.push(`${label}: stale or changed SVG output hash`);
      }
      const generatedPage = route ? generatedForRoute(site, route) : path.join(site, pageRelative, 'index.html');
      if (fs.existsSync(generatedPage) && typeof diagram.textFallbackSelector === 'string') {
        const generatedHtml = fs.readFileSync(generatedPage, 'utf8');
        if (diagram.textFallbackSelector.startsWith('#') && !new RegExp(`id=["']${diagram.textFallbackSelector.slice(1)}["']`, 'i').test(generatedHtml)) failures.push(`${label}: text fallback selector is absent from generated page`);
        if (diagram.output && !generatedHtml.includes(diagram.output)) failures.push(`${label}: generated page does not reference diagram output`);
        if (diagram.animation?.id) {
          const id = diagram.animation.id;
          if (!new RegExp(`data-animation=["']${id}["']`, 'i').test(generatedHtml)) failures.push(`${label}: animation root is absent from generated page`);
          for (const action of ['start', 'pause', 'restart']) if (!new RegExp(`data-animation-${action}=["']${id}["']`, 'i').test(generatedHtml)) failures.push(`${label}: animation ${action} control is absent from generated page`);
          if (!new RegExp(`data-animation-fallback=["']${id}["']`, 'i').test(generatedHtml)) failures.push(`${label}: animation static fallback is absent from generated page`);
        }
      }
    }
    for (const question of route?.visualQuestions ?? []) if (!dispositions.has(question.id)) failures.push(`${path.relative(source, manifestFile)}: visual question has no disposition: ${question.id}`);
    if (route) {
      const overview = dispositions.get(route.visualQuestions.find((question) => question.diagramId === route.overviewDiagramId)?.id);
      if (!overview || overview.disposition !== 'page-local' || overview.id !== route.overviewDiagramId || !overview.takeaway) failures.push(`${path.relative(source, manifestFile)}: required big-picture overview figure/takeaway missing`);
      if (/^MODULE-/.test(route.owner)) {
        const locals = diagrams.filter((diagram) => diagram.disposition === 'page-local');
        if (locals.length < 2) failures.push(`${path.relative(source, manifestFile)}: module needs overview plus at least one detailed page-local visual`);
        if (!locals.some((diagram) => diagram.id !== route.overviewDiagramId && COMPLEX_TYPES.has(diagram.type))) failures.push(`${path.relative(source, manifestFile)}: module lacks a detailed process/structure/relationship visual`);
      }
    }
  }
  for (const route of routes) {
    const sourcePage = path.join(source, route.source);
    const generatedPage = generatedForRoute(site, route);
    if (phase === 'foundation' ? !fs.existsSync(sourcePage) : (!fs.existsSync(sourcePage) && !fs.existsSync(generatedPage))) continue;
    const diagramManifest = diagramManifestForRoute(source, route);
    if (!fs.existsSync(diagramManifest)) failures.push(`${route.id}: page has no media/diagrams.json visual dispositions`);
  }
  for (const file of [...walk(source), ...svgFiles].filter((f) => !isNegativeFixture(f) && f.toLowerCase().endsWith('.svg'))) {
    const svg = fs.readFileSync(file, 'utf8');
    if (/<(?:script|foreignObject)\b|\son[a-z]+\s*=|(?:href|src)\s*=\s*["'](?:https?:|\/\/)/i.test(svg)) failures.push(`${path.relative(source, file)}: unsafe SVG content`);
  }
  const inlineIds = new Set();
  for (const htmlFile of htmlFiles) {
    const html = fs.readFileSync(htmlFile, 'utf8');
    const cspTag = (html.match(/<meta\b[^>]*http-equiv=(?:"Content-Security-Policy"|'Content-Security-Policy')[^>]*>/i) ?? [])[0] ?? '';
    const csp = attr(cspTag, 'content');
    if (csp !== CSP) failures.push(`${path.relative(site, htmlFile)}: exact CSP meta policy missing`);
    if (/<script\b(?![^>]*\bsrc=)[^>]*>|\son[a-z]+\s*=|\beval\s*\(/i.test(html)) failures.push(`${path.relative(site, htmlFile)}: inline executable script/event/eval is forbidden`);
    for (const tag of html.match(/<img\b[^>]*\.svg[^>]*>/gi) ?? []) {
      for (const key of ['src', 'alt', 'width', 'height']) if (!attr(tag, key)) failures.push(`${path.relative(site, htmlFile)}: SVG image missing ${key}`);
      const start = html.lastIndexOf('<figure', html.indexOf(tag));
      const end = html.indexOf('</figure>', html.indexOf(tag));
      if (start < 0 || end < 0 || !/<figcaption\b/i.test(html.slice(start, end))) failures.push(`${path.relative(site, htmlFile)}: SVG image must be in a figure with caption`);
    }
    for (const svg of html.match(/<svg\b[\s\S]*?<\/svg>/gi) ?? []) {
      const labelled = svg.match(/aria-labelledby=["']([^"']+)["']/i)?.[1]?.split(/\s+/) ?? [];
      if (!/role=["']img["']/i.test(svg) || labelled.length < 2) failures.push(`${path.relative(site, htmlFile)}: inline SVG needs role=img and title+desc aria-labelledby`);
      for (const id of labelled) {
        if (!new RegExp(`<(?:title|desc)\\b[^>]*id=["']${id}["']`, 'i').test(svg)) failures.push(`${path.relative(site, htmlFile)}: inline SVG label target missing: ${id}`);
        if (inlineIds.has(id)) failures.push(`${path.relative(site, htmlFile)}: duplicate inline SVG title/desc id: ${id}`); else inlineIds.add(id);
      }
    }
  }
  if (phase === 'final') {
    for (const svg of walk(source).filter((f) => !isNegativeFixture(f) && f.replaceAll('\\', '/').includes('/media/') && f.toLowerCase().endsWith('.svg'))) {
      const relative = path.relative(source, svg).replaceAll('\\', '/').toLowerCase();
      if (!outputReferenced.has(relative)) failures.push(`generated SVG is absent from diagrams.json: ${relative}`);
    }
  }
  return failures;
}

async function main() {
  try {
    const opts = parseArgs(process.argv.slice(2));
    const failures = validateDiagrams({ ...opts, source: path.resolve(opts.source), site: path.resolve(opts.site) });
    if (failures.length) { console.error(failures.map((x) => `FAIL: ${x}`).join('\n')); process.exitCode = 1; }
    else console.log(`diagrams: PASS (${opts.phase})`);
  } catch (error) { console.error(`diagrams: ${error.message}`); process.exitCode = 2; }
}
if (path.resolve(process.argv[1] ?? '') === fileURLToPath(import.meta.url)) main();
export { CSP };
