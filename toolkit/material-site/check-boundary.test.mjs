import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { validateBoundary } from './check-boundary.mjs';

const FIXTURES = path.join(import.meta.dirname, 'fixtures', 'boundary');

function sample(relative) { return fs.readFileSync(path.join(FIXTURES, relative), 'utf8'); }

function fixture({ files = {}, site = {}, routes, downloads = [] }) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'site-boundary-'));
  const defaultRoutes = [{ id: '/', source: 'index.html', owner: 'SHELL-BUILD', alias: null }];
  const allFiles = {
    'index.html': '<h1>Nyilvános workshop</h1>',
    'toolkit/material-site/site-manifest.json': JSON.stringify({ routes: routes ?? defaultRoutes, downloads }),
    ...files,
  };
  for (const [relative, content] of Object.entries(allFiles)) {
    const target = path.join(root, relative);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, content);
  }
  const siteRoot = path.join(root, '.site');
  fs.mkdirSync(siteRoot, { recursive: true });
  for (const [relative, content] of Object.entries(site)) {
    const target = path.join(siteRoot, relative);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, content);
  }
  return { root, site: siteRoot };
}

function validate(setup, phase = 'final') { return validateBoundary({ source: setup.root, site: setup.site, phase }); }

test('clean participant content, operator trace and neutral DEMO ID pass', () => {
  const setup = fixture({
    files: {
      'index.html': sample('positive/participant.html'),
      'AGENTS.md': sample('positive/AGENTS.md'),
      'reference-app/src/example.ts': sample('positive/operator-code.ts'),
    },
    site: { 'index.html': sample('positive/participant.html') },
  });
  assert.deepEqual(validate(setup), []);
});

test('operator code may retain issue trace but not private workspace locations', () => {
  const setup = fixture({
    files: {
      'reference-app/src/example.ts': '/* WEN-902 */\nexport const location = "Wenova' + '-Shared/10_' + 'Internal";\n',
    },
  });
  const failures = validate(setup);
  assert.ok(!failures.some((failure) => failure.includes('internal issue identifier')));
  assert.ok(failures.some((failure) => failure.includes('internal Drive root')));
});

test('canonical participant source rejects every internal reference class', () => {
  const setup = fixture({ files: { 'index.html': sample('negative/participant-internal.html') } });
  const failures = validate(setup);
  assert.ok(failures.some((failure) => failure.includes('internal issue identifier')));
  assert.ok(failures.some((failure) => failure.includes('internal Linear URL')));
  assert.ok(failures.some((failure) => failure.includes('internal Drive root')));
});

test('unmanifested compatibility HTML is participant-facing and rejects an issue trace', () => {
  const setup = fixture({ files: { 'materials/notebooks/old.html': sample('negative/compatibility-internal.html') } });
  assert.ok(validate(setup).some((failure) => failure.includes('materials/notebooks/old.html [participant]')));
});

test('manifest alias resolves a compatibility Markdown surface mechanically', () => {
  const setup = fixture({
    routes: [{ id: '/toolkit/', source: 'toolkit/index.html', owner: 'TOOLKIT-WEB', alias: 'toolkit/README.md' }],
    files: {
      'toolkit/index.html': '<h1>Toolkit</h1>',
      'toolkit/README.md': sample('negative/compatibility-internal.html'),
    },
  });
  assert.ok(validate(setup).some((failure) => failure.includes('toolkit/README.md [participant]')));
});

test('unqualified README alias resolves nearest route ancestor, not root README', () => {
  const setup = fixture({
    routes: [{ id: '/materials/epitesi-naplo/', source: 'materials/epitesi-naplo/index.html', owner: 'JOURNAL', alias: 'journal README merged' }],
    files: {
      'README.md': sample('negative/compatibility-internal.html'),
      'materials/epitesi-naplo/index.html': '<h1>Napló</h1>',
      'materials/epitesi-naplo/README.md': sample('negative/compatibility-internal.html'),
    },
  });
  const failures = validate(setup);
  assert.ok(failures.some((failure) => failure.includes('materials/epitesi-naplo/README.md [participant]')));
  assert.ok(failures.some((failure) => failure.includes('README.md [repository]')));
  assert.ok(!failures.some((failure) => failure.includes('README.md [participant]') && !failure.includes('materials/')));
});

test('download allowlist overrides operator-looking path and rejects internal trace', () => {
  const relative = 'toolkit/spec-templates/example.md';
  const setup = fixture({ files: { [relative]: sample('negative/download-internal.md') }, downloads: [relative] });
  assert.ok(validate(setup).some((failure) => failure.includes(`${relative} [participant]`)));
});

test('complete generated site is strict even when source is an operator file', () => {
  const setup = fixture({ site: { 'assets/operator-copy.json': sample('negative/download-internal.md') } });
  assert.ok(validate(setup).some((failure) => failure.includes('.site/assets/operator-copy.json [generated]')));
});

test('ordinary code is not an operator class and rejects issue traces in final phase', () => {
  const setup = fixture({ files: { 'src/example.js': sample('negative/ordinary-code.js') } });
  assert.ok(validate(setup).some((failure) => failure.includes('src/example.js [repository]')));
});

test('high-risk secret, personal and invite rules apply to operator files repo-wide', () => {
  const setup = fixture({ files: { 'AGENTS.md': sample('negative/operator-high-risk.md') } });
  const failures = validate(setup);
  assert.ok(failures.some((failure) => failure.includes('private key')));
  assert.ok(failures.some((failure) => failure.includes('invite URL')));
  assert.ok(failures.some((failure) => failure.includes('private personal-data marker')));
});

test('foundation derives root and glossary from manifest but keeps repo-wide high-risk checks', () => {
  const setup = fixture({
    routes: [
      { id: '/', source: 'index.html', owner: 'SHELL-BUILD', alias: null },
      { id: '/materials/fogalomtar/', source: 'materials/fogalomtar/index.html', owner: 'GLOSSARY', alias: null },
    ],
    files: {
      'materials/fogalomtar/index.html': sample('negative/participant-internal.html'),
      'src/legacy.js': sample('negative/ordinary-code.js'),
    },
  });
  const failures = validate(setup, 'foundation');
  assert.ok(failures.some((failure) => failure.includes('materials/fogalomtar/index.html [participant]')));
  assert.ok(!failures.some((failure) => failure.includes('src/legacy.js')));
});
