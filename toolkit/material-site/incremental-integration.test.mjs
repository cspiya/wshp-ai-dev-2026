import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { routeDisposition } from './build-site.mjs';
import { shouldValidateRouteRegistry } from './check-diagrams.mjs';

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

function copyInto(sourceRoot, destinationRoot, relative) {
  const source = path.join(sourceRoot, relative);
  const destination = path.join(destinationRoot, relative);
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.cpSync(source, destination, { recursive: true });
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
  const real = new Set(['/two/']);
  assert.equal(shouldValidateRouteRegistry({ phase: 'incremental', routeId: '/one/', renderedRealRoutes: real }), false, 'registry-only substituted route must be skipped');
  assert.equal(shouldValidateRouteRegistry({ phase: 'incremental', routeId: '/two/', renderedRealRoutes: real }), true, 'complete real route must be validated');
  assert.equal(shouldValidateRouteRegistry({ phase: 'foundation', routeId: '/one/', renderedRealRoutes: real }), false, 'foundation fixture routes must be skipped even when canonical registries exist');
  assert.equal(shouldValidateRouteRegistry({ phase: 'incremental', renderedRealRoutes: real, isToolReference: true }), true, 'tool-reference registries remain validated');
});

test('incremental preview reports complete content and preserves the partial-route regression', { timeout: 180_000 }, () => {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'workshop-incremental-'));
  const site = path.join(temp, 'site');
  try {
    const build = run(['toolkit/material-site/build-site.mjs', '--clean', '--out', site, '--phase', 'incremental']);
    assert.match(build, /33 routes \(33 real, 0 fixture substitutions\)/);
    assert.match(build, /real \/materials\/fogalomtar\/ <- materials\/fogalomtar\/index\.html/);
    assert.match(build, /real \/materials\/ <- materials\/index\.html/);

    const disposition = JSON.parse(fs.readFileSync(path.join(site, 'assets', 'route-disposition.json'), 'utf8'));
    assert.equal(disposition.real.length, 33);
    assert.deepEqual(disposition.substituted, []);

    run(['toolkit/material-site/check-manifest.mjs', '--source', '.', '--site', site, '--phase', 'foundation']);
    run(['toolkit/material-site/check-links.mjs', '--source', '.', '--site', site, '--file-protocol', '--phase', 'foundation']);
    run(['toolkit/material-site/check-boundary.mjs', '--source', '.', '--site', site, '--phase', 'foundation']);
    run(['toolkit/material-site/check-glossary.mjs', '--source', 'materials/fogalomtar/glossary.json', '--site', site, '--phase', 'foundation']);
    run(['toolkit/material-site/check-search.mjs', '--site', site, '--phase', 'foundation']);
    run(['toolkit/material-site/check-diagrams.mjs', '--source', '.', '--site', site, '--phase', 'incremental']);
    // Regression for the former 35/36 failure: a registry-only partial merge
    // belongs to a substituted route and must not be checked against its
    // neutral fixture. Real foundation registries and generated-site safety
    // checks still run against this deliberately minimal source tree.
    const registryOnlySource = path.join(temp, 'registry-only-source');
    const registryOnlySite = path.join(temp, 'registry-only-site');
    run(['toolkit/material-site/build-site.mjs', '--clean', '--out', registryOnlySite, '--phase', 'foundation']);
    for (const relative of [
      'toolkit/material-site/site-manifest.json',
      'toolkit/material-site/mermaid.config.json',
      'index.html',
      'index-media',
      'materials/fogalomtar',
    ]) copyInto(ROOT, registryOnlySource, relative);
    const partialRegistry = path.join(registryOnlySource, 'materials/felkeszules/media/diagrams.json');
    fs.mkdirSync(path.dirname(partialRegistry), { recursive: true });
    fs.writeFileSync(partialRegistry, '{ deliberately: "invalid registry-only partial merge" }\n');
    const routeIds = JSON.parse(fs.readFileSync(path.join(ROOT, 'toolkit/material-site/site-manifest.json'), 'utf8')).routes.map((route) => route.id);
    const registryOnlyDisposition = {
      phase: 'incremental',
      real: ['/', '/materials/fogalomtar/'],
      substituted: routeIds.filter((id) => !['/', '/materials/fogalomtar/'].includes(id)),
    };
    fs.writeFileSync(path.join(registryOnlySite, 'assets/route-disposition.json'), `${JSON.stringify(registryOnlyDisposition, null, 2)}\n`);
    run(['toolkit/material-site/check-diagrams.mjs', '--source', registryOnlySource, '--site', registryOnlySite, '--phase', 'incremental']);

    run(['toolkit/material-site/check-render.mjs', '--site', site, '--modes', 'desktop,mobile,print,no-js,reduced-motion,file', '--phase', 'foundation']);
  } finally {
    fs.rmSync(temp, { recursive: true, force: true });
  }
});
