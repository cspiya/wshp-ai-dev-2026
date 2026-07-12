import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { validateManifest } from './check-manifest.mjs';

function fixture(routes) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'site-manifest-'));
  fs.mkdirSync(path.join(root, 'toolkit/material-site'), { recursive: true });
  fs.writeFileSync(path.join(root, 'toolkit/material-site/site-manifest.json'), JSON.stringify({ routes }));
  return root;
}

test('foundation accepts final route metadata before sources exist', () => {
  const root = fixture([{ id: '/', source: 'index.html', output: '.site/index.html', title: 'Kezdőlap', parent: null, order: 0, owner: 'SHELL-BUILD' }]);
  assert.deepEqual(validateManifest({ source: root, site: path.join(root, '.site'), phase: 'foundation' }), []);
});

test('negative fixture rejects duplicate routes and final missing sources', () => {
  const route = { id: '/', source: 'index.html', output: '.site/index.html', title: 'Kezdőlap', parent: null, order: 0, owner: 'SHELL-BUILD' };
  const root = fixture([route, route]);
  const failures = validateManifest({ source: root, site: path.join(root, '.site'), phase: 'final' });
  assert.ok(failures.some((x) => x.includes('duplicate route id')));
  assert.ok(failures.some((x) => x.includes('final source missing')));
});
