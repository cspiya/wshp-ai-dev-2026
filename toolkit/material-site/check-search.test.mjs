import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { validateSearch } from './check-search.mjs';

function fixture(entries, pages = ['index.html'], classicScript = false) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'site-search-'));
  fs.mkdirSync(path.join(root, 'assets'), { recursive: true });
  for (const page of pages) { const file = path.join(root, page); fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, '<h1>Kereshető oldal</h1>'); }
  if (classicScript) fs.writeFileSync(path.join(root, 'assets/search-index.js'), `window.WorkshopSearchIndex = ${JSON.stringify({ entries })};`);
  else fs.writeFileSync(path.join(root, 'assets/search-index.json'), JSON.stringify({ entries }));
  return root;
}

test('Hungarian, English and alias terms resolve to one exact route', () => {
  const root = fixture([{ route: '/', title: 'Kezdőlap', text: 'A munka határai és a scope.', terms: ['scope'], aliases: ['hatókör'] }], ['index.html'], true);
  assert.deepEqual(validateSearch({ site: root, phase: 'final' }), []);
});

test('negative fixture rejects missing pages and ambiguous aliases', () => {
  const entries = [
    { route: '/', title: 'Kezdőlap', text: 'Első', aliases: ['scope'] },
    { route: '/masik/', title: 'Másik', text: 'Második', aliases: ['scope'] },
  ];
  const root = fixture(entries, ['index.html', 'harmadik/index.html']);
  const failures = validateSearch({ site: root, phase: 'final' });
  assert.ok(failures.some((x) => x.includes('missing page /harmadik/')));
  assert.ok(failures.some((x) => x.includes('ambiguous exact search term')));
});
