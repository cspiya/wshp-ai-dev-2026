// Tests for the material-qa render harness (WEN-226).
// Negative fixtures prove: missing file, broken local resource, render
// timeout, page error and invalid output destination are all blocked.
// Browser-based tests resolve playwright-core from reference-app (or
// MATERIAL_QA_PLAYWRIGHT_ROOT) — same contract as the CLI.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { discoverTargets, validateOutDir, startServer, resolvePlaywright, renderAll, commonDir } from './lib.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const FIXTURES = path.join(HERE, 'fixtures');
const REPO_ROOT = path.resolve(HERE, '..', '..');
const PLAYWRIGHT_ROOT = process.env.MATERIAL_QA_PLAYWRIGHT_ROOT ?? null;

function tmpDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'material-qa-test-'));
}

function fetchStatus(origin, urlPath) {
  return new Promise((resolve, reject) => {
    const req = http.get(origin + urlPath, (res) => {
      res.resume();
      resolve(res.statusCode);
    });
    req.on('error', reject);
  });
}

test('discoverTargets: directory scan is sorted, missing input throws', () => {
  const found = discoverTargets([FIXTURES]);
  assert.ok(found.length >= 4);
  const names = found.map((f) => path.basename(f));
  assert.deepEqual(names, [...names].sort());
  assert.throws(() => discoverTargets([path.join(FIXTURES, 'nope.html')]), /input not found/);
  assert.throws(() => discoverTargets([path.join(HERE, 'lib.mjs')]), /not an HTML file/);
});

test('commonDir: segment-wise ancestor, sibling name-prefix is not an ancestor', () => {
  const base = tmpDir();
  const a = path.join(base, 'bar', 'a.html');
  const b = path.join(base, 'barbaz', 'b.html');
  assert.equal(commonDir([a, b]), base);
  assert.equal(commonDir([a]), path.join(base, 'bar'));
});

test('startServer: serves files, blocks traversal, 404s directories', async () => {
  const { origin, close } = await startServer(FIXTURES);
  try {
    assert.equal(await fetchStatus(origin, '/ok.html'), 200);
    assert.equal(await fetchStatus(origin, '/missing.html'), 404);
    assert.equal(await fetchStatus(origin, '/'), 404);
    assert.equal(await fetchStatus(origin, '/..%2f..%2flib.mjs'), 403);
    // WHATWG URL parsing collapses %2e%2e dot segments before they reach the
    // filesystem, so this cannot escape the root — it lands inside it (404).
    assert.equal(await fetchStatus(origin, '/%2e%2e/%2e%2e/material-qa.mjs'), 404);
    assert.equal(await fetchStatus(origin, '/../../lib.mjs'), 404);
  } finally {
    await close();
  }
});

test('validateOutDir: blocks file targets and non-ignored repo paths, allows ignored and temp dirs', () => {
  assert.throws(() => validateOutDir(path.join(HERE, 'lib.mjs')), /existing file/);
  assert.throws(() => validateOutDir(path.join(REPO_ROOT, 'toolkit', 'material-qa-not-ignored')), /not git-ignored/);
  const ignored = validateOutDir(path.join(HERE, 'evidence'));
  assert.ok(fs.existsSync(ignored));
  const outside = validateOutDir(path.join(tmpDir(), 'evidence'));
  assert.ok(fs.existsSync(outside));
});

test('CLI: usage error exits 2', () => {
  const r = spawnSync(process.execPath, [path.join(HERE, 'material-qa.mjs')], { encoding: 'utf8' });
  assert.equal(r.status, 2);
  assert.match(r.stderr, /no input directory or files given/);
});

test('renderAll: pass/fail matrix over fixtures, manifest written, idempotent', async () => {
  const playwright = resolvePlaywright(REPO_ROOT, PLAYWRIGHT_ROOT);
  const out = tmpDir();
  const targets = discoverTargets([
    path.join(FIXTURES, 'ok.html'),
    path.join(FIXTURES, 'broken-resource.html'),
    path.join(FIXTURES, 'console-error.html'),
  ]);
  const run = () =>
    renderAll({ targets, outDir: out, modes: ['desktop', 'print'], timeoutMs: 20000, playwright });

  const first = await run();
  assert.equal(first.summary.total, 6);
  const byName = (n, m) => first.entries.find((e) => e.source.endsWith(n) && e.mode === m);
  assert.equal(byName('ok.html', 'desktop').ok, true);
  assert.equal(byName('ok.html', 'print').ok, true);
  assert.ok(fs.existsSync(path.join(out, 'ok.desktop.png')));
  assert.ok(fs.existsSync(path.join(out, 'ok.print.pdf')));
  const broken = byName('broken-resource.html', 'desktop');
  assert.equal(broken.ok, false);
  assert.ok(broken.failures.some((f) => f.kind === 'http-error' || f.kind === 'request-failed'));
  const pageErr = byName('console-error.html', 'desktop');
  assert.equal(pageErr.ok, false);
  assert.ok(pageErr.failures.some((f) => f.kind === 'page-error'));
  assert.ok(fs.existsSync(path.join(out, 'manifest.json')));

  const second = await run();
  assert.deepEqual(
    second.entries.map(({ source, mode, ok }) => ({ source, mode, ok })),
    first.entries.map(({ source, mode, ok }) => ({ source, mode, ok }))
  );
});

test('renderAll: same-named files in different directories get distinct outputs', async () => {
  const playwright = resolvePlaywright(REPO_ROOT, PLAYWRIGHT_ROOT);
  const base = tmpDir();
  for (const dir of ['one', 'two']) {
    fs.mkdirSync(path.join(base, dir));
    fs.copyFileSync(path.join(FIXTURES, 'ok.html'), path.join(base, dir, 'index.html'));
  }
  const out = tmpDir();
  const manifest = await renderAll({
    targets: [path.join(base, 'one', 'index.html'), path.join(base, 'two', 'index.html')],
    outDir: out,
    modes: ['desktop'],
    timeoutMs: 20000,
    playwright,
  });
  assert.equal(manifest.summary.passed, 2);
  const outputs = manifest.entries.map((e) => e.output);
  assert.equal(new Set(outputs).size, 2);
  for (const o of outputs) assert.ok(fs.existsSync(path.join(out, o)));
});

test('renderAll: console.error without exception fails with console-error kind', async () => {
  const playwright = resolvePlaywright(REPO_ROOT, PLAYWRIGHT_ROOT);
  const out = tmpDir();
  const manifest = await renderAll({
    targets: [path.join(FIXTURES, 'console-only.html')],
    outDir: out,
    modes: ['desktop'],
    timeoutMs: 20000,
    playwright,
  });
  assert.equal(manifest.summary.failed, 1);
  assert.ok(manifest.entries[0].failures.some((f) => f.kind === 'console-error'));
  // failed entries still reference their capture file for reviewer triage
  assert.ok(manifest.entries[0].output && fs.existsSync(path.join(out, manifest.entries[0].output)));
});

test('renderAll: load timeout is a captured render-failure, not a silent pass', async () => {
  const playwright = resolvePlaywright(REPO_ROOT, PLAYWRIGHT_ROOT);
  const out = tmpDir();
  const manifest = await renderAll({
    targets: [path.join(FIXTURES, 'hang.html')],
    outDir: out,
    modes: ['desktop'],
    timeoutMs: 1500,
    playwright,
  });
  assert.equal(manifest.summary.failed, 1);
  assert.ok(manifest.entries[0].failures.some((f) => f.kind === 'render-failure'));
});

test('renderAll: --assert adapter contract runs and can pass', async () => {
  const playwright = resolvePlaywright(REPO_ROOT, PLAYWRIGHT_ROOT);
  const out = tmpDir();
  const manifest = await renderAll({
    targets: [path.join(FIXTURES, 'ok.html')],
    outDir: out,
    modes: ['desktop'],
    timeoutMs: 20000,
    playwright,
    assertModulePath: path.join(FIXTURES, 'assert-example.mjs'),
  });
  assert.equal(manifest.summary.passed, 1);
});
