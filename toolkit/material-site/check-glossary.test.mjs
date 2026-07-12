import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { validateGlossary } from './check-glossary.mjs';

function fixture(term) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'site-glossary-'));
  fs.mkdirSync(path.join(root, 'materials/modulok/'), { recursive: true });
  fs.writeFileSync(path.join(root, 'glossary.json'), JSON.stringify({ schemaVersion: 2, registryVersion: '2.0.0', terms: [term] }));
  fs.writeFileSync(path.join(root, 'materials/modulok/index.html'), '<p><a href="../fogalomtar/#scope">scope</a> segít kijelölni a munka határait.</p>');
  return root;
}
const valid = { slug: 'scope', preferred: 'a munka határai', english: 'scope', definitionHu: 'A vállalt munka pontos határa.', aliases: ['hatókör'], avoid: [], related: [], usedIn: ['/materials/modulok/'] };

test('valid registry and exact first-use link pass', () => {
  const root = fixture(valid);
  assert.deepEqual(validateGlossary({ source: path.join(root, 'glossary.json'), site: root, phase: 'final' }), []);
});

test('negative fixture rejects duplicate aliases and unlinked first use', () => {
  const root = fixture({ ...valid, aliases: ['scope', 'SCOPE'] });
  fs.writeFileSync(path.join(root, 'materials/modulok/index.html'), '<p>A scope nincs linkelve.</p>');
  const failures = validateGlossary({ source: path.join(root, 'glossary.json'), site: root, phase: 'final' });
  assert.ok(failures.some((x) => x.includes('duplicate alias')));
  assert.ok(failures.some((x) => x.includes('first use is not linked')));
});

test('generated shell text cannot steal first use from linked teaching content', () => {
  const root = fixture(valid);
  fs.writeFileSync(path.join(root, 'materials/modulok/index.html'), `
    <header><p>A scope a globális navigációban nincs linkelve.</p></header>
    <nav aria-label="Elérési útvonal">Scope</nav>
    <main><p><a href="../fogalomtar/#scope">scope</a> segít kijelölni a munka határait.</p></main>
    <footer>scope</footer>`);
  assert.deepEqual(validateGlossary({ source: path.join(root, 'glossary.json'), site: root, phase: 'final' }), []);
});

test('unlinked first occurrence in a meaningful heading still fails', () => {
  const root = fixture(valid);
  fs.writeFileSync(path.join(root, 'materials/modulok/index.html'), `
    <main><h2>A scope határai</h2>
    <p>A <a href="../fogalomtar/#scope">scope</a> később linkelt.</p></main>`);
  assert.ok(validateGlossary({ source: path.join(root, 'glossary.json'), site: root, phase: 'final' })
    .some((x) => x.includes('first use is not linked')));
});

test('unlinked first occurrence in a figure caption still fails', () => {
  const root = fixture(valid);
  fs.writeFileSync(path.join(root, 'materials/modulok/index.html'), `
    <main><figure><svg><text>scope</text></svg><figcaption>A scope kijelöli a határt.</figcaption>
    <p class="static-fallback">A scope szöveges magyarázata.</p></figure>
    <p>A <a href="../fogalomtar/#scope">scope</a> később linkelt.</p></main>`);
  assert.ok(validateGlossary({ source: path.join(root, 'glossary.json'), site: root, phase: 'final' })
    .some((x) => x.includes('first use is not linked')));
});

test('unlinked first occurrence in teaching content still fails', () => {
  const root = fixture(valid);
  fs.writeFileSync(path.join(root, 'materials/modulok/index.html'), `
    <header><a href="../fogalomtar/#scope">scope</a></header>
    <main><p>A scope nincs linkelve.</p><p><a href="../fogalomtar/#scope">scope</a> később linkelt.</p></main>`);
  assert.ok(validateGlossary({ source: path.join(root, 'glossary.json'), site: root, phase: 'final' })
    .some((x) => x.includes('first use is not linked')));
});

test('a term substring inside a longer word does not steal first use', () => {
  const root = fixture({ ...valid, slug: 'pull-request', preferred: 'pull request', english: 'pull request', aliases: ['PR'] });
  fs.writeFileSync(path.join(root, 'materials/modulok/index.html'), `
    <main><p>A jó prompt nem helyettesíti a szabályokat.</p>
    <p>A <a href="../fogalomtar/#pull-request">PR</a> mutatja meg a változtatást.</p></main>`);
  assert.deepEqual(validateGlossary({ source: path.join(root, 'glossary.json'), site: root, phase: 'final' }), []);
});

test('a Hungarian inflected term remains a valid first use', () => {
  const root = fixture({ ...valid, preferred: 'elfogadási feltétel', english: 'acceptance criterion', aliases: [] });
  fs.writeFileSync(path.join(root, 'materials/modulok/index.html'), '<main><p>Az <a href="../fogalomtar/#scope">elfogadási feltételekhez</a> ellenőrzés tartozik.</p></main>');
  assert.deepEqual(validateGlossary({ source: path.join(root, 'glossary.json'), site: root, phase: 'final' }), []);
});

test('assimilated and possessive Hungarian forms remain valid first uses', () => {
  const root = fixture({ ...valid, preferred: 'munkadarab', english: 'artifact', aliases: [] });
  fs.writeFileSync(path.join(root, 'materials/modulok/index.html'), '<main><p>A <a href="../fogalomtar/#scope">munkadarabbal</a> igazoljuk az eredményt.</p></main>');
  assert.deepEqual(validateGlossary({ source: path.join(root, 'glossary.json'), site: root, phase: 'final' }), []);

  fs.writeFileSync(path.join(root, 'materials/modulok/index.html'), '<main><p>A <a href="../fogalomtar/#scope">szabályainkhoz</a> ellenőrzés tartozik.</p></main>');
  fs.writeFileSync(path.join(root, 'glossary.json'), JSON.stringify({ schemaVersion: 2, registryVersion: '2.0.0', terms: [{ ...valid, preferred: 'szabály', english: 'rule', aliases: [] }] }));
  assert.deepEqual(validateGlossary({ source: path.join(root, 'glossary.json'), site: root, phase: 'final' }), []);
});

test('glossary page accepts its exact local self anchor', () => {
  const root = fixture(valid);
  fs.mkdirSync(path.join(root, 'materials/fogalomtar'), { recursive: true });
  fs.writeFileSync(path.join(root, 'materials/fogalomtar/index.html'), '<main><p><a href="#scope">scope</a> segít kijelölni a munka határait.</p></main>');
  fs.writeFileSync(path.join(root, 'glossary.json'), JSON.stringify({ schemaVersion: 2, registryVersion: '2.0.0', terms: [{ ...valid, usedIn: ['/materials/fogalomtar/'] }] }));
  assert.deepEqual(validateGlossary({ source: path.join(root, 'glossary.json'), site: root, phase: 'final' }), []);
});

test('foundation validates registry relations but defers future-content first use', () => {
  const root = fixture(valid);
  fs.writeFileSync(path.join(root, 'materials/modulok/index.html'), '<p>Semleges foundation fixture.</p>');
  assert.deepEqual(validateGlossary({ source: path.join(root, 'glossary.json'), site: root, phase: 'foundation' }), []);
  assert.ok(validateGlossary({ source: path.join(root, 'glossary.json'), site: root, phase: 'final' }).some((x) => x.includes('does not use the term')));
});
