import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { validateManifest as validateBuildManifest } from './build-site.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..', '..');
const manifest = JSON.parse(fs.readFileSync(path.join(HERE, 'site-manifest.json'), 'utf8'));

function run(args) {
  const result = spawnSync(process.execPath, args, { cwd: ROOT, encoding: 'utf8', env: process.env });
  assert.equal(result.status, 0, `${process.execPath} ${args.join(' ')}\n${result.stdout}\n${result.stderr}`);
  return result.stdout;
}

function expectedHref(compat) {
  const target = manifest.routes.find((route) => route.id === compat.canonical);
  assert.ok(target, `missing canonical route in test manifest: ${compat.canonical}`);
  return path.posix.relative(path.posix.dirname(compat.output), target.output);
}

function assertCompatibilityArtifact(site, compat) {
  const file = path.join(site, compat.output);
  assert.ok(fs.existsSync(file), `missing generated compatibility page: ${compat.output}`);
  const html = fs.readFileSync(file, 'utf8');
  const href = expectedHref(compat);
  assert.match(html, new RegExp(`<link rel="canonical" href="${href.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}">`));
  assert.match(html, new RegExp(`<a[^>]+href="${href.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`));
  assert.match(html, new RegExp(`<meta http-equiv="refresh" content="4; url=${href.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}">`));
  assert.match(html, /<time datetime="2026-08-15">2026\. augusztus 15-ig<\/time>/);
  assert.doesNotMatch(html, /(?:WEN-\d+|linear\.app|\.md(?:["'#<\s]|$))/i);
}

test('builder rejects divergent compatibility metadata before emitting files', () => {
  const cases = [
    ['missing target', (copy) => { copy.compatibilityRoutes.routes[0].canonical = '/missing/'; }, 'canonical target is not a manifest route'],
    ['duplicate output', (copy) => { copy.compatibilityRoutes.routes[1].output = copy.compatibilityRoutes.routes[0].output; }, 'duplicate compatibility output'],
    ['wrong sunset', (copy) => { copy.compatibilityRoutes.sunset = '2026-08-16'; }, 'sunset must be 2026-08-15'],
    ['wrong canonical', (copy) => { copy.compatibilityRoutes.routes[0].canonical = copy.compatibilityRoutes.routes[1].canonical; }, 'wrong canonical target'],
    ['unsafe absolute output', (copy) => { copy.compatibilityRoutes.routes[0].output = '/materials/notebooks/00-bevezeto.html'; }, 'unsafe compatibility output'],
  ];
  for (const [label, mutate, expected] of cases) {
    const copy = structuredClone(manifest);
    mutate(copy);
    assert.ok(validateBuildManifest(copy).some((failure) => failure.includes(expected)), `${label} must produce ${expected}`);
  }
});

test('all build phases emit the eight manifest-owned compatibility routes outside search progression', { timeout: 120_000 }, () => {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'workshop-compat-phases-'));
  try {
    for (const phase of ['foundation', 'incremental', 'final']) {
      const site = path.join(temp, phase);
      run(['toolkit/material-site/build-site.mjs', '--clean', '--out', site, '--phase', phase]);
      for (const compat of manifest.compatibilityRoutes.routes) assertCompatibilityArtifact(site, compat);
      const disposition = JSON.parse(fs.readFileSync(path.join(site, 'assets/route-disposition.json'), 'utf8'));
      assert.deepEqual(disposition.compatibility, manifest.compatibilityRoutes.routes.map((compat) => compat.output));
      const search = fs.readFileSync(path.join(site, 'assets/search-index.js'), 'utf8');
      for (const compat of manifest.compatibilityRoutes.routes) assert.doesNotMatch(search, new RegExp(compat.output.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
      run(['toolkit/material-site/check-links.mjs', '--site', site, '--file-protocol', '--phase', phase === 'final' ? 'final' : 'foundation']);
    }
  } finally {
    fs.rmSync(temp, { recursive: true, force: true });
  }
});

test('generated compatibility routes are directly retrievable over HTTP', { timeout: 120_000 }, async () => {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'workshop-compat-http-'));
  const site = path.join(temp, 'site');
  run(['toolkit/material-site/build-site.mjs', '--clean', '--out', site, '--phase', 'final']);
  const server = http.createServer((request, response) => {
    const relative = decodeURIComponent(new URL(request.url, 'http://localhost').pathname).replace(/^\/+/, '');
    const file = path.resolve(site, relative || 'index.html');
    if (!file.startsWith(`${path.resolve(site)}${path.sep}`) || !fs.existsSync(file)) {
      response.writeHead(404).end('not found');
      return;
    }
    response.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
    fs.createReadStream(file).pipe(response);
  });
  try {
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    const { port } = server.address();
    for (const compat of manifest.compatibilityRoutes.routes) {
      const response = await fetch(`http://127.0.0.1:${port}/${compat.output}`);
      assert.equal(response.status, 200);
      const html = await response.text();
      assert.match(html, /Az oldal elköltözött/);
      assert.match(html, /Tovább a modul új oldalára/);
    }
  } finally {
    await new Promise((resolve) => server.close(resolve));
    fs.rmSync(temp, { recursive: true, force: true });
  }
});
