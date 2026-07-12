#!/usr/bin/env node
// Material-QA render harness — CLI (WEN-226).
//
//   node toolkit/material-qa/material-qa.mjs [options] <dir-or-file...>
//
// Options:
//   --out <dir>              evidence directory (default: toolkit/material-qa/evidence)
//   --modes <a,b,c>          subset of: desktop,mobile,print (default: all)
//   --timeout <ms>           per-page load timeout (default: 15000)
//   --playwright-root <dir>  package root to resolve playwright-core from
//                            (default: <repo>/reference-app)
//   --assert <file.mjs>      adapter module exporting assertPage({page,file,mode,failures})
//
// Exit codes: 0 all entries passed · 1 at least one entry failed · 2 usage/setup error.

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { MODES, discoverTargets, validateOutDir, resolvePlaywright, renderAll } from './lib.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(HERE, '..', '..');

function parseArgs(argv) {
  const opts = {
    out: path.join(HERE, 'evidence'),
    modes: Object.keys(MODES),
    timeoutMs: 15000,
    playwrightRoot: process.env.MATERIAL_QA_PLAYWRIGHT_ROOT ?? null,
    assertModulePath: null,
    inputs: [],
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--out') opts.out = argv[++i];
    else if (a === '--modes') opts.modes = argv[++i].split(',').map((s) => s.trim());
    else if (a === '--timeout') opts.timeoutMs = Number(argv[++i]);
    else if (a === '--playwright-root') opts.playwrightRoot = argv[++i];
    else if (a === '--assert') opts.assertModulePath = argv[++i];
    else if (a.startsWith('--')) throw new Error(`unknown option: ${a}`);
    else opts.inputs.push(a);
  }
  if (opts.inputs.length === 0) throw new Error('no input directory or files given');
  if (!Number.isInteger(opts.timeoutMs) || opts.timeoutMs <= 0) throw new Error('--timeout must be a positive integer');
  for (const m of opts.modes) {
    if (!MODES[m]) throw new Error(`unknown mode: ${m} (valid: ${Object.keys(MODES).join(', ')})`);
  }
  return opts;
}

async function main() {
  let opts;
  try {
    opts = parseArgs(process.argv.slice(2));
  } catch (err) {
    console.error(`usage error: ${err.message}`);
    console.error('usage: node toolkit/material-qa/material-qa.mjs [--out dir] [--modes desktop,mobile,print] [--timeout ms] [--playwright-root dir] [--assert file.mjs] <dir-or-file...>');
    process.exit(2);
  }

  let manifest;
  try {
    const targets = discoverTargets(opts.inputs);
    const outDir = validateOutDir(opts.out);
    const playwright = resolvePlaywright(REPO_ROOT, opts.playwrightRoot);
    console.log(`material-qa: ${targets.length} file(s) x ${opts.modes.length} mode(s) -> ${outDir}`);
    manifest = await renderAll({
      targets,
      outDir,
      modes: opts.modes,
      timeoutMs: opts.timeoutMs,
      playwright,
      assertModulePath: opts.assertModulePath,
    });
  } catch (err) {
    console.error(`material-qa setup failed: ${err.message}`);
    process.exit(2);
  }

  for (const e of manifest.entries) {
    const flag = e.ok ? 'PASS' : 'FAIL';
    console.log(`  [${flag}] ${e.source} (${e.mode})${e.ok ? '' : ` — ${e.failures.map((f) => f.kind).join(', ')}`}`);
  }
  console.log(`material-qa: ${manifest.summary.passed}/${manifest.summary.total} passed · manifest.json written`);
  process.exit(manifest.summary.failed === 0 ? 0 : 1);
}

main();
