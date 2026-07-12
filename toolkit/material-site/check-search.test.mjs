import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { validateSearch } from './check-search.mjs';

function fixture(entries, pages = ['index.html'], classicScript = false, glossary = null) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'site-search-'));
  fs.mkdirSync(path.join(root, 'assets'), { recursive: true });
  for (const page of pages) { const file = path.join(root, page); fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, '<h1>Kereshető oldal</h1>'); }
  if (classicScript) fs.writeFileSync(path.join(root, 'assets/search-index.js'), `window.WorkshopSearchIndex = ${JSON.stringify({ entries })};`);
  else fs.writeFileSync(path.join(root, 'assets/search-index.json'), JSON.stringify({ entries }));
  if (glossary) { const file = path.join(root, 'materials/fogalomtar/glossary.json'); fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, JSON.stringify({ terms: glossary })); }
  return root;
}

test('Hungarian, English and alias terms resolve to one exact route', () => {
  const root = fixture([
    { route: '/', title: 'Kezdőlap', text: 'A workshop kezdőlapja.' },
    { route: '/materials/fogalomtar/', title: 'Fogalomtár', text: 'A munka határai, scope, hatókör.', terms: ['a munka határai', 'scope'], aliases: ['hatókör'] },
  ], ['index.html', 'materials/fogalomtar/index.html'], true, [{ slug: 'scope', preferred: 'a munka határai', english: 'scope', aliases: ['hatókör'] }]);
  assert.deepEqual(validateSearch({ site: root, phase: 'final' }), []);
});

test('negative fixture rejects ambiguous canonical glossary query owners', () => {
  const root = fixture([
    { route: '/', title: 'Kezdőlap', text: 'Scope magyarázat.', terms: ['scope'] },
    { route: '/materials/fogalomtar/', title: 'Fogalomtár', text: 'Scope.', terms: ['scope', 'a munka határai'], aliases: ['hatókör'] },
  ], ['index.html', 'materials/fogalomtar/index.html'], false, [{ slug: 'scope', preferred: 'a munka határai', english: 'scope', aliases: ['hatókör'] }]);
  const failures = validateSearch({ site: root, phase: 'final' });
  assert.ok(failures.some((x) => x.includes('exactly one canonical owner')));
});

test('negative fixture rejects a missing canonical preferred/English/alias query route', () => {
  const root = fixture([
    { route: '/', title: 'Kezdőlap', text: 'Általános tartalom.' },
    { route: '/materials/fogalomtar/', title: 'Fogalomtár', text: 'Csak a scope angol szó szerepel.' },
  ], ['index.html', 'materials/fogalomtar/index.html'], false, [{ slug: 'scope', preferred: 'a munka határai', english: 'scope', aliases: ['hatókör'] }]);
  const failures = validateSearch({ site: root, phase: 'final' });
  assert.ok(failures.some((x) => x.includes('a munka határai')));
  assert.ok(failures.some((x) => x.includes('hatókör')));
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
