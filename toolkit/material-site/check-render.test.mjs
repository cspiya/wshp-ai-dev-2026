import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { parseArgs, validateRender, validateStaticPage } from './check-render.mjs';

test('complete accessible HTML shell passes static render preflight', () => {
  const html = '<!doctype html><html lang="hu"><head><meta name="viewport" content="width=device-width"><title>Tananyag</title></head><body><main>Magyarázat</main></body></html>';
  assert.deepEqual(validateStaticPage(html), []);
  assert.deepEqual(parseArgs(['--phase', 'final', '--modes', 'desktop,mobile,file']).modes, ['desktop', 'mobile', 'file']);
});

test('negative fixture rejects missing language, viewport, title and main landmark', () => {
  const failures = validateStaticPage('<html><head></head><body>Rossz oldal</body></html>', 'negative.html');
  assert.equal(failures.length, 4);
});

test('real browser covers the six-mode matrix and catches narrow overflow', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'site-render-'));
  const shell = (style = '') => `<!doctype html><html lang="hu"><head><meta name="viewport" content="width=device-width"><title>Tananyag</title><style>${style}</style></head><body><a href="#main">Ugrás a tartalomra</a><main id="main">Magyarázat</main></body></html>`;
  fs.writeFileSync(path.join(root, 'index.html'), shell('@media (prefers-reduced-motion: reduce) { * { animation: none; } }'));
  assert.deepEqual(await validateRender({ site: root, modes: ['desktop', 'mobile', 'print', 'no-js', 'reduced-motion', 'file'] }), []);
  fs.writeFileSync(path.join(root, 'index.html'), shell('main { width: 500px; }'));
  const failures = await validateRender({ site: root, modes: ['mobile'] });
  assert.ok(failures.some((x) => x.includes('horizontal overflow')));
});
