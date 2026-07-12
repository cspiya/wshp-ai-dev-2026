import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { routeDisposition } from './build-site.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..', '..');

function spawn(args) {
  return spawnSync(process.execPath, args, { cwd: ROOT, encoding: 'utf8', env: process.env });
}

function run(args) {
  const result = spawn(args);
  assert.equal(result.status, 0, `${process.execPath} ${args.join(' ')}\n${result.stdout}\n${result.stderr}`);
  return result.stdout;
}

test('incremental policy renders exactly the complete accepted page units present in the checked-out branch', () => {
  const routes = ['/one/', '/two/', '/three/'];
  const completePageUnits = new Set(['/two/']);
  assert.deepEqual(
    routes.map((id) => routeDisposition('incremental', id, completePageUnits.has(id))),
    ['fixture', 'real', 'fixture'],
  );
  assert.equal(routeDisposition('foundation', '/two/', true), 'fixture');
  assert.equal(routeDisposition('final', '/two/', false), 'missing');
});

test('incremental preview rejects partial legacy pages and passes every site gate', { timeout: 180_000 }, () => {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'workshop-incremental-'));
  const site = path.join(temp, 'site');
  try {
    const build = run(['toolkit/material-site/build-site.mjs', '--clean', '--out', site, '--phase', 'incremental']);
    assert.match(build, /32 routes \(2 real, 30 fixture substitutions\)/);
    assert.match(build, /real \/materials\/fogalomtar\/ <- materials\/fogalomtar\/index\.html/);
    assert.match(build, /substituted \/materials\/ <- fixtures\/site\/hub\.html/);

    const disposition = JSON.parse(fs.readFileSync(path.join(site, 'assets', 'route-disposition.json'), 'utf8'));
    assert.deepEqual(disposition.real, ['/', '/materials/fogalomtar/']);
    assert.equal(disposition.substituted.length, 30);

    run(['toolkit/material-site/check-manifest.mjs', '--source', '.', '--site', site, '--phase', 'foundation']);
    run(['toolkit/material-site/check-links.mjs', '--source', '.', '--site', site, '--file-protocol', '--phase', 'foundation']);
    run(['toolkit/material-site/check-boundary.mjs', '--source', '.', '--site', site, '--phase', 'foundation']);
    run(['toolkit/material-site/check-glossary.mjs', '--source', 'materials/fogalomtar/glossary.json', '--site', site, '--phase', 'foundation']);
    run(['toolkit/material-site/check-search.mjs', '--site', site, '--phase', 'foundation']);
    run(['toolkit/material-site/check-diagrams.mjs', '--source', '.', '--site', site, '--phase', 'incremental']);
    run(['toolkit/material-site/check-render.mjs', '--site', site, '--modes', 'desktop,mobile,print,no-js,reduced-motion,file', '--phase', 'foundation']);

    const final = spawn(['toolkit/material-site/build-site.mjs', '--clean', '--out', path.join(temp, 'final'), '--phase', 'final']);
    assert.equal(final.status, 1, `final mode unexpectedly accepted missing canonical page units\n${final.stdout}\n${final.stderr}`);
    assert.match(final.stderr, /accepted canonical page unit missing/);
  } finally {
    fs.rmSync(temp, { recursive: true, force: true });
  }
});
