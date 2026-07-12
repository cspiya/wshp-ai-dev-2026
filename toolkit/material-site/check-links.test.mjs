import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { validateLinks } from './check-links.mjs';

const canonical = '<link rel="canonical" href="./index.html">';
function site(files) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'site-links-'));
  for (const [name, content] of Object.entries(files)) { const f = path.join(root, name); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, content); }
  return root;
}

test('relative links, resources and anchors pass in file mode', () => {
  const forward = '<link rel="canonical" href="../deep/index.html"><meta http-equiv="refresh" content="0; url=../deep/index.html"><a href="../deep/index.html">Tovább az új oldalra</a>';
  const root = site({ 'index.html': `${canonical}<a href="deep/index.html#cel">Tovább</a>`, 'deep/index.html': `${canonical}<h1 id="cel">Cél</h1><a href="../index.html">Vissza</a>`, 'old/index.html': forward });
  assert.deepEqual(validateLinks({ site: root, fileProtocol: true, phase: 'final' }), []);
});

test('negative fixture rejects root links, missing anchors and orphans', () => {
  const root = site({ 'index.html': `${canonical}<a href="/deep/#nincs">Rossz</a>`, 'deep/index.html': `${canonical}<h1 id="van">Cél</h1>`, 'orphan.html': canonical });
  const failures = validateLinks({ site: root, fileProtocol: true, phase: 'final' });
  assert.ok(failures.some((x) => x.includes('breaks file://')));
  assert.ok(failures.some((x) => x.includes('orphan page')));
});
