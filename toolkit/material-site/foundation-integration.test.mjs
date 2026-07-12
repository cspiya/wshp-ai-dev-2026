import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..', '..');

function run(args) {
  const result = spawnSync(process.execPath, args, {
    cwd: ROOT,
    encoding: 'utf8',
    env: process.env,
  });
  assert.equal(
    result.status,
    0,
    `${process.execPath} ${args.join(' ')}\n${result.stdout}\n${result.stderr}`,
  );
  return result.stdout;
}

test('checked-in foundation composes through every canonical site gate', { timeout: 120_000 }, () => {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'workshop-foundation-'));
  const site = path.join(temp, 'site');
  try {
    const build = run(['toolkit/material-site/build-site.mjs', '--clean', '--out', site, '--phase', 'foundation']);
    assert.match(build, /32 routes \(30 fixture substitutions\)/);

    run(['toolkit/material-site/check-manifest.mjs', '--source', '.', '--site', site, '--phase', 'foundation']);
    run(['toolkit/material-site/check-links.mjs', '--source', '.', '--site', site, '--file-protocol', '--phase', 'foundation']);
    run(['toolkit/material-site/check-boundary.mjs', '--source', '.', '--site', site, '--phase', 'foundation']);
    run(['toolkit/material-site/check-glossary.mjs', '--source', 'materials/fogalomtar/glossary.json', '--site', site, '--phase', 'foundation']);
    run(['toolkit/material-site/check-search.mjs', '--site', site, '--phase', 'foundation']);
    run(['toolkit/material-site/check-diagrams.mjs', '--source', '.', '--site', site, '--phase', 'foundation']);
    run(['toolkit/material-site/check-render.mjs', '--site', site, '--modes', 'desktop,mobile,print,no-js,reduced-motion,file', '--phase', 'foundation']);
  } finally {
    fs.rmSync(temp, { recursive: true, force: true });
  }
});
