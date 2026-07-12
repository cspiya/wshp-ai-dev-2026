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
function route(overrides = {}) {
  return {
    id: '/', source: 'index.html', output: '.site/index.html', title: 'Kezdőlap', parent: null, order: 0, owner: 'SHELL-BUILD',
    overviewQuestion: 'Hogyan áll össze a workshop?', overviewDiagramId: 'fig-overview',
    overviewCovers: ['page-purpose', 'learner-value', 'main-relationships', 'learner-output-or-decision'],
    visualQuestions: [{ id: 'q-overview', question: 'Hogyan áll össze?', type: 'relationship', glossarySlugs: ['agent-ready-repo'], coverage: 'page-local', diagramId: 'fig-overview', takeaway: 'A módszer részei egymásra épülnek.' }],
    ...overrides,
  };
}

test('foundation accepts final route metadata before sources exist', () => {
  const root = fixture([route()]);
  assert.deepEqual(validateManifest({ source: root, site: path.join(root, '.site'), phase: 'foundation' }), []);
});

test('negative fixture rejects duplicate routes and final missing sources', () => {
  const validRoute = route();
  const root = fixture([validRoute, validRoute]);
  const failures = validateManifest({ source: root, site: path.join(root, '.site'), phase: 'final' });
  assert.ok(failures.some((x) => x.includes('duplicate route id')));
  assert.ok(failures.some((x) => x.includes('final source missing')));
});

test('visual coverage rejects missing overview, duplicate IDs, broken shared links and chart without source', () => {
  const root = fixture([route({
    overviewDiagramId: 'missing-overview',
    overviewCovers: ['page-purpose'],
    visualQuestions: [
      { id: 'q', question: 'Mi történik?', type: 'process', glossarySlugs: ['rug'], coverage: 'shared', diagramId: 'fig-shared', sharedHref: '../masik/#wrong', takeaway: 'Lépések.' },
      { id: 'q', question: 'Mennyi?', type: 'quantitative-data', glossarySlugs: ['context'], coverage: 'page-local', diagramId: 'fig-shared', takeaway: 'Adat.' },
    ],
  })]);
  const failures = validateManifest({ source: root, site: path.join(root, '.site'), phase: 'foundation' });
  assert.ok(failures.some((x) => x.includes('four required big-picture')));
  assert.ok(failures.some((x) => x.includes('duplicate question id')));
  assert.ok(failures.some((x) => x.includes('duplicate diagram id')));
  assert.ok(failures.some((x) => x.includes('canonical sharedHref')));
  assert.ok(failures.some((x) => x.includes('quantitativeSource')));
  assert.ok(failures.some((x) => x.includes('overviewDiagramId')));
});
