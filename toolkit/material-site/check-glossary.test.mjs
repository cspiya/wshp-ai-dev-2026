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

test('foundation validates registry relations but defers future-content first use', () => {
  const root = fixture(valid);
  fs.writeFileSync(path.join(root, 'materials/modulok/index.html'), '<p>Semleges foundation fixture.</p>');
  assert.deepEqual(validateGlossary({ source: path.join(root, 'glossary.json'), site: root, phase: 'foundation' }), []);
  assert.ok(validateGlossary({ source: path.join(root, 'glossary.json'), site: root, phase: 'final' }).some((x) => x.includes('does not use the term')));
});
