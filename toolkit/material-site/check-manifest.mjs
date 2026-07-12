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

export function validateManifest({ source, site, phase }) {
  const failures = [];
  let routes;
  try { routes = readManifest(source); } catch (error) { return [error.message]; }
  const routeIds = new Set();
  const outputs = new Set();
  const sources = new Set();
  const orders = new Set();
  const forwards = new Set();
  for (const [index, route] of routes.entries()) {
    const label = `route[${index}]`;
    for (const key of ['id', 'source', 'output', 'title', 'owner']) {
      if (typeof route[key] !== 'string' || route[key].trim() === '') failures.push(`${label}: missing ${key}`);
    }
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
    if (phase === 'final' && route.output && !fs.existsSync(path.join(site, path.relative('.site', route.output)))) {
      const relativeOutput = route.output.replace(/^\.site[\\/]/, '');
      if (!fs.existsSync(path.join(site, relativeOutput))) failures.push(`${label}: final output missing: ${route.output}`);
    }
    const declaredForwards = [route.alias, route.forward, route['alias/forward'], ...(Array.isArray(route.aliases) ? route.aliases : [])].filter((value) => typeof value === 'string');
    for (const forward of declaredForwards) if (forward.toLowerCase().endsWith('.html')) forwards.add(forward.replaceAll('\\', '/').toLowerCase());
  }
  for (const route of routes) {
    const parent = route.parent ?? (route.id === '/' ? null : '/');
    if (parent && !routeIds.has(parent.toLowerCase())) failures.push(`${route.id}: parent route does not exist: ${parent}`);
  }
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
