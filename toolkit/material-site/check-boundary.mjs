#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ISSUE_TRACE_RULES = [
  [/\bWEN-[0-9]+\b/gi, 'internal issue identifier'],
];
const INTERNAL_LOCATION_RULES = [
  [/linear\.app\/wenova/gi, 'internal Linear URL'],
  [new RegExp('Wenova' + '-Shared', 'gi'), 'internal Drive root'],
  [new RegExp('10_' + 'Internal', 'gi'), 'internal Drive folder'],
];
const INTERNAL_RULES = [...ISSUE_TRACE_RULES, ...INTERNAL_LOCATION_RULES];

const HIGH_RISK_RULES = [
  [/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/g, 'private key'],
  [/\bAKIA[0-9A-Z]{16}\b/g, 'AWS access key'],
  [/\bgh[oprsu]_[A-Za-z0-9_]{30,}\b/g, 'GitHub token'],
  [/^\s*(?:TODO-PRIVATE|CONFIDENTIAL-CLIENT)\b/gim, 'explicit private marker'],
  [/https?:\/\/[^\s"'<>]*(?:\/invite\/|\/join\/|discord\.gg\/)[^\s"'<>]*/gi, 'invite URL'],
  [/\b(?:client|customer)[-_ ]?name\s*["']?\s*[:=]/gi, 'client identity name'],
  [/\b(?:client|customer)[-_ ]?id\s*["']?\s*[:=]\s*["'][^"'\r\n]+["']/gi, 'client identity identifier'],
  [/\b(?:private|personal)[-_ ]?(?:invite|email|phone|token)\s*[:=]/gi, 'private personal-data marker'],
];

const TECHNICAL_EXT = new Set(['.js', '.mjs', '.cjs', '.ts', '.tsx', '.cs', '.ps1', '.sh', '.yml', '.yaml', '.json']);
const NEGATIVE_FIXTURE_ROOT = 'toolkit/material-site/fixtures/boundary/negative/';
const SOURCE_FALLBACK_SKIPS = new Set(['.git', '.site', 'node_modules']);

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

function normalize(value) {
  return value.replaceAll('\\', '/').replace(/^\.\//, '');
}

function walk(dir, result = [], root = dir, skippedDirectories = new Set()) {
  if (!fs.existsSync(dir)) return result;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory() && skippedDirectories.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, result, root, skippedDirectories);
    else result.push(normalize(path.relative(root, full)));
  }
  return result;
}

function trackedRelative(source) {
  try {
    return execFileSync('git', ['-C', source, 'ls-files', '-z'], {
      encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'],
    }).split('\0').filter(Boolean).map(normalize);
  } catch {
    return walk(source, [], source, SOURCE_FALLBACK_SKIPS);
  }
}

function decodeText(file, failClosed, failures, label) {
  const bytes = fs.readFileSync(file);
  if (bytes.includes(0)) {
    if (failClosed) failures.push(`${label}: artifact is binary or contains NUL bytes; boundary cannot inspect it`);
    return null;
  }
  const sample = bytes.subarray(0, 8192);
  let controls = 0;
  for (const byte of sample) {
    if ((byte < 7 || (byte > 13 && byte < 32)) && byte !== 9 && byte !== 10 && byte !== 13) controls++;
  }
  if (sample.length > 0 && controls / sample.length > 0.01) {
    if (failClosed) failures.push(`${label}: artifact is not recognizable text; boundary cannot inspect it`);
    return null;
  }
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    if (failClosed) failures.push(`${label}: artifact is not valid UTF-8 text; boundary cannot inspect it`);
    return null;
  }
}

function readManifest(source) {
  const filename = path.join(source, 'toolkit/material-site/site-manifest.json');
  const manifest = JSON.parse(fs.readFileSync(filename, 'utf8'));
  if (!Array.isArray(manifest.routes) || !Array.isArray(manifest.downloads)) {
    throw new Error('site manifest must contain routes[] and downloads[]');
  }
  return manifest;
}

function participantHtml(relative) {
  return relative === 'index.html'
    || relative.startsWith('materials/')
    || relative === 'toolkit/index.html'
    || relative.startsWith('toolkit/utmutatok/')
    || relative === 'participant-starter/index.html'
    || relative === 'reference-app/index.html';
}

function aliasTokens(alias) {
  const tokens = [...alias.matchAll(/([A-Za-z0-9._-]+(?:\/[A-Za-z0-9._-]+)*\.(?:html|md|txt))/gi)]
    .map((match) => normalize(match[1]));
  if (tokens.length === 0 && /\bREADME\b/i.test(alias)) tokens.push('README.md');
  return tokens;
}

function resolveAlias(route, alias, trackedSet) {
  const resolved = new Set();
  const topLevel = normalize(route.source).split('/')[0];
  const routeDir = path.posix.dirname(normalize(route.source));
  for (const token of aliasTokens(alias)) {
    const direct = normalize(token);
    if (direct.includes('/') && trackedSet.has(direct)) resolved.add(direct);
    const underArea = normalize(`${topLevel}/${direct}`);
    if (trackedSet.has(underArea)) resolved.add(underArea);
    let ancestor = routeDir;
    while (ancestor && ancestor !== '.' && (ancestor === topLevel || ancestor.startsWith(`${topLevel}/`))) {
      const candidate = normalize(`${ancestor}/${path.posix.basename(direct)}`);
      if (trackedSet.has(candidate)) { resolved.add(candidate); break; }
      const parent = path.posix.dirname(ancestor);
      if (parent === ancestor) break;
      ancestor = parent;
    }
    const sameArea = [...trackedSet].filter((file) => file.startsWith(`${topLevel}/`) && path.posix.basename(file).toLowerCase() === path.posix.basename(direct).toLowerCase());
    if (sameArea.length === 1) resolved.add(sameArea[0]);
  }
  return resolved;
}

export function classifySource(relative, participantFiles) {
  const file = normalize(relative);
  if (participantFiles.has(file)) return 'participant';
  const basename = path.posix.basename(file);
  if (basename === 'AGENTS.md' || basename === 'CLAUDE.md' || file === 'PARALLEL-WORK.md') return 'operator';
  if (/^\.github\/workflows\/[^/]+\.ya?ml$/i.test(file)) return 'operator';
  if (/^reference-app\/(?:docs\/|SETUP-STATUS\.md$)/i.test(file)) return 'operator';
  if (/^toolkit\/(?:hooks|material-qa|orchestrator|spec-templates|standards|skills)\//i.test(file)) return 'operator';
  if (/^(?:reference-app|participant-starter)\/(?:src|test|tests|scripts)\//i.test(file) && TECHNICAL_EXT.has(path.extname(file).toLowerCase())) return 'operator';
  if (/^toolkit\/(?:hooks|material-site|material-qa|orchestrator|skills)\//i.test(file) && TECHNICAL_EXT.has(path.extname(file).toLowerCase())) return 'operator';
  return 'repository';
}

function isAgentRule(relative) {
  const basename = path.posix.basename(normalize(relative));
  return basename === 'AGENTS.md' || basename === 'CLAUDE.md';
}

export function participantSources({ phase, manifest, trackedFiles }) {
  const trackedSet = new Set(trackedFiles.map(normalize));
  const result = new Set();
  const routes = phase === 'foundation'
    ? manifest.routes.filter((route) => route.id === '/' || route.owner === 'GLOSSARY')
    : manifest.routes;
  for (const route of routes) if (trackedSet.has(normalize(route.source))) result.add(normalize(route.source));
  for (const download of manifest.downloads) if (trackedSet.has(normalize(download))) result.add(normalize(download));
  if (phase === 'foundation') {
    for (const file of trackedSet) if (file.startsWith('toolkit/material-site/fixtures/site/')) result.add(file);
  } else {
    for (const route of manifest.routes) {
      const aliases = [route.alias, route.forward, route['alias/forward'], ...(Array.isArray(route.aliases) ? route.aliases : [])];
      for (const alias of aliases.filter((value) => typeof value === 'string')) {
        for (const file of resolveAlias(route, alias, trackedSet)) result.add(file);
      }
    }
    for (const file of trackedSet) if (path.posix.extname(file).toLowerCase() === '.html' && participantHtml(file)) result.add(file);
  }
  return result;
}

function scanText(text, rules, label, failures) {
  for (const [pattern, reason] of rules) {
    pattern.lastIndex = 0;
    const match = pattern.exec(text);
    if (match) failures.push(`${label}: ${reason}: ${match[0]}`);
  }
}

export function validateBoundary({ source, site, phase }) {
  const manifest = readManifest(source);
  const trackedFiles = trackedRelative(source);
  const participantFiles = participantSources({ phase, manifest, trackedFiles });
  const failures = [];
  for (const relative of trackedFiles) {
    if (relative.startsWith(NEGATIVE_FIXTURE_ROOT)) continue;
    const file = path.join(source, relative);
    if (!fs.existsSync(file)) continue;
    const surface = classifySource(relative, participantFiles);
    const text = decodeText(file, surface === 'participant', failures, `${relative} [${surface}]`);
    if (text == null) continue;
    scanText(text, HIGH_RISK_RULES, `${relative} [${surface}]`, failures);
    if (surface === 'participant' || (phase === 'final' && surface === 'repository')) {
      scanText(text, INTERNAL_RULES, `${relative} [${surface}]`, failures);
    } else if (surface === 'operator' && !isAgentRule(relative)) {
      scanText(text, INTERNAL_LOCATION_RULES, `${relative} [${surface}]`, failures);
    }
  }
  const siteFiles = walk(site);
  for (const relative of siteFiles) {
    const text = decodeText(path.join(site, relative), true, failures, `.site/${relative} [generated]`);
    if (text == null) continue;
    scanText(text, [...INTERNAL_RULES, ...HIGH_RISK_RULES], `.site/${relative} [generated]`, failures);
  }
  return failures;
}

async function main() {
  try {
    const opts = parseArgs(process.argv.slice(2));
    const failures = validateBoundary({ ...opts, source: path.resolve(opts.source), site: path.resolve(opts.site) });
    if (failures.length) {
      console.error(failures.map((failure) => `FAIL: ${failure}`).join('\n'));
      process.exitCode = 1;
    } else console.log(`boundary: PASS (${opts.phase})`);
  } catch (error) {
    console.error(`boundary: ${error.message}`);
    process.exitCode = 2;
  }
}

if (path.resolve(process.argv[1] ?? '') === fileURLToPath(import.meta.url)) main();
