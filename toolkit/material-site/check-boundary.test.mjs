import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { validateBoundary } from './check-boundary.mjs';

function fixture(content, name = 'index.html') {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'site-boundary-'));
  fs.mkdirSync(path.join(root, '.site'), { recursive: true });
  fs.writeFileSync(path.join(root, name), '<h1>Nyilvános workshop</h1>');
  fs.writeFileSync(path.join(root, '.site/index.html'), content);
  return root;
}

test('ordinary public content and neutral DEMO issue IDs pass', () => {
  const root = fixture('<h1>DEMO-123 — gyakorló feladat</h1>');
  assert.deepEqual(validateBoundary({ source: root, site: path.join(root, '.site'), phase: 'foundation' }), []);
});

test('negative fixture rejects internal issue and workspace references', () => {
  const root = fixture('<p>WEN-999 https://linear.app/wenova/x Wenova-Shared/10_Internal</p>');
  const failures = validateBoundary({ source: root, site: path.join(root, '.site'), phase: 'foundation' });
  assert.ok(failures.some((x) => x.includes('internal issue identifier')));
  assert.ok(failures.some((x) => x.includes('internal Linear URL')));
  assert.ok(failures.some((x) => x.includes('internal Drive root')));
});
