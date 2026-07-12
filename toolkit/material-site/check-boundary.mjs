#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const FORBIDDEN = [
  [/\bWEN-[0-9]+\b/gi, 'internal issue identifier'],
  [/linear\.app\/wenova/gi, 'internal Linear URL'],
  [/Wenova-Shared/gi, 'internal Drive root'],
  [/10_Internal/gi, 'internal Drive folder'],
  [/\b(?:client|customer)[-_ ]?name\s*["']?\s*[:=]/gi, 'client identity name'],
  [/\b(?:client|customer)[-_ ]?id\s*["']?\s*[:=]\s*["'][^"'\r\n]+["']/gi, 'client identity identifier'],
  [/\b(?:private|personal)[-_ ]?(?:invite|email|token)\s*[:=]/gi, 'private marker'],
];
const TEXT_EXT = new Set(['.html', '.md', '.txt', '.json', '.js', '.mjs', '.css', '.svg', '.mmd', '.yml', '.yaml', '.xml', '.csv', '.tsv', '.ps1', '.sh', '.cs', '.ts', '.tsx']);

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

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
}

function tracked(source) {
  try {
    return execFileSync('git', ['-C', source, 'ls-files', '-z'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).split('\0').filter(Boolean).map((f) => path.join(source, f));
  } catch { return walk(source); }
}

function isExplicitFixture(file) {
  const normalized = file.replaceAll('\\', '/');
  return normalized.includes('/fixtures/') || normalized.endsWith('.test.mjs');
}

export function validateBoundary({ source, site, phase }) {
  const sourceFiles = phase === 'final'
    ? tracked(source)
    : [path.join(source, 'index.html'), ...walk(path.join(source, 'materials/fogalomtar')), ...walk(path.join(source, 'toolkit/material-site/fixtures/site'))];
  const files = [...new Set([...sourceFiles, ...walk(site)])].filter((f) => fs.existsSync(f) && TEXT_EXT.has(path.extname(f).toLowerCase()) && !isExplicitFixture(f));
  const failures = [];
  for (const file of files) {
    const text = fs.readFileSync(file, 'utf8');
    for (const [pattern, reason] of FORBIDDEN) {
      pattern.lastIndex = 0;
      const match = pattern.exec(text);
      if (match) failures.push(`${path.relative(source, file).replaceAll('\\', '/')}: ${reason}: ${match[0]}`);
    }
  }
  return failures;
}

async function main() {
  try {
    const opts = parseArgs(process.argv.slice(2));
    const failures = validateBoundary({ ...opts, source: path.resolve(opts.source), site: path.resolve(opts.site) });
    if (failures.length) { console.error(failures.map((x) => `FAIL: ${x}`).join('\n')); process.exitCode = 1; }
    else console.log(`boundary: PASS (${opts.phase})`);
  } catch (error) { console.error(`boundary: ${error.message}`); process.exitCode = 2; }
}
if (path.resolve(process.argv[1] ?? '') === fileURLToPath(import.meta.url)) main();
