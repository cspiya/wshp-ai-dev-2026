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

export function validateDiagrams({ source, site, phase }) {
  const failures = [];
  const htmlFiles = walk(site).filter((f) => f.toLowerCase().endsWith('.html'));
  const svgFiles = walk(site).filter((f) => f.toLowerCase().endsWith('.svg'));
  const outputReferenced = new Set();
  const configFile = path.join(source, 'toolkit/material-site/mermaid.config.json');
  let mermaidConfig = null;
  if (fs.existsSync(configFile)) {
    const config = JSON.parse(fs.readFileSync(configFile, 'utf8'));
    mermaidConfig = config;
    if (config.securityLevel !== 'strict') failures.push('mermaid config securityLevel must be strict');
    if (config.deterministicIds !== true || config.deterministicIDSeed !== 'wshp-ai-dev-2026-v2') failures.push('mermaid deterministic ID contract is not frozen');
    if (config.htmlLabels !== false) failures.push('mermaid htmlLabels must be false');
  } else if (phase === 'final') failures.push('mermaid.config.json missing');
  for (const manifestFile of walk(source).filter((f) => f.replaceAll('\\', '/').endsWith('/media/diagrams.json'))) {
    let diagrams;
    try { diagrams = diagramsOf(JSON.parse(fs.readFileSync(manifestFile, 'utf8'))); } catch (error) { failures.push(`${path.relative(source, manifestFile)}: invalid JSON: ${error.message}`); continue; }
    if (!Array.isArray(diagrams)) { failures.push(`${path.relative(source, manifestFile)}: diagrams array missing`); continue; }
    const ids = new Set();
    for (const [index, diagram] of diagrams.entries()) {
      const label = `${path.relative(source, manifestFile)}[${index}]`;
      for (const key of ['id', 'question', 'source', 'output', 'textFallbackSelector', 'sourceHash', 'outputHash']) if (typeof diagram[key] !== 'string' || !diagram[key].trim()) failures.push(`${label}: missing ${key}`);
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
      const pageRelative = path.relative(source, path.dirname(path.dirname(manifestFile)));
      const generatedPage = path.join(site, pageRelative, 'index.html');
      if (fs.existsSync(generatedPage) && typeof diagram.textFallbackSelector === 'string') {
        const generatedHtml = fs.readFileSync(generatedPage, 'utf8');
        if (diagram.textFallbackSelector.startsWith('#') && !new RegExp(`id=["']${diagram.textFallbackSelector.slice(1)}["']`, 'i').test(generatedHtml)) failures.push(`${label}: text fallback selector is absent from generated page`);
        if (diagram.output && !generatedHtml.includes(diagram.output)) failures.push(`${label}: generated page does not reference diagram output`);
      }
    }
  }
  for (const file of [...walk(source), ...svgFiles].filter((f) => f.toLowerCase().endsWith('.svg'))) {
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
    for (const svg of walk(source).filter((f) => f.replaceAll('\\', '/').includes('/media/') && f.toLowerCase().endsWith('.svg'))) {
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
