import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { FROZEN_COMPATIBILITY_OUTPUTS, FROZEN_PRESENTATION, FROZEN_ROUTES, validateManifest } from './check-manifest.mjs';

function compatibilityRoutes(overrides = {}) {
  return {
    sunset: '2026-08-15',
    routes: [...FROZEN_COMPATIBILITY_OUTPUTS].map((output) => {
      const alias = output.slice('materials/'.length);
      const canonical = [...FROZEN_PRESENTATION].find(([, presentation]) => presentation[1] === alias)?.[0];
      assert.ok(canonical, `missing canonical alias for ${output}`);
      return { output, canonical };
    }),
    ...overrides,
  };
}
function fixture(routes, compatibility = compatibilityRoutes()) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'site-manifest-'));
  fs.mkdirSync(path.join(root, 'toolkit/material-site'), { recursive: true });
  fs.writeFileSync(path.join(root, 'toolkit/material-site/site-manifest.json'), JSON.stringify({ routes, compatibilityRoutes: compatibility }));
  return root;
}
function route(id = '/', overrides = {}) {
  const frozen = FROZEN_ROUTES.get(id);
  const presentation = FROZEN_PRESENTATION.get(id);
  const suffix = id === '/' ? 'root' : id.replaceAll('/', '-').replace(/^-|-$/g, '');
  return {
    id, ...frozen, title: presentation[0], alias: presentation[1], overviewQuestion: 'Hogyan áll össze a workshop?', overviewDiagramId: `fig-overview-${suffix}`,
    overviewCovers: ['page-purpose', 'learner-value', 'main-relationships', 'learner-output-or-decision'],
    visualQuestions: [{ id: `q-overview-${suffix}`, question: 'Hogyan áll össze?', type: 'relationship', glossarySlugs: ['agent-ready-repo'], coverage: 'page-local', diagramId: `fig-overview-${suffix}`, takeaway: 'A módszer részei egymásra épülnek.' }],
    ...overrides,
  };
}
function canonicalRoutes() { return [...FROZEN_ROUTES.keys()].map((id) => route(id)); }

test('foundation accepts final route metadata before sources exist', () => {
  const root = fixture(canonicalRoutes());
  assert.deepEqual(validateManifest({ source: root, site: path.join(root, '.site'), phase: 'foundation' }), []);
});

test('negative fixture rejects duplicate routes and final missing sources', () => {
  const routes = canonicalRoutes();
  const root = fixture([...routes, routes[0]]);
  const failures = validateManifest({ source: root, site: path.join(root, '.site'), phase: 'final' });
  assert.ok(failures.some((x) => x.includes('duplicate route id')));
  assert.ok(failures.some((x) => x.includes('final source missing')));
});

test('visual coverage rejects missing overview, duplicate IDs, broken shared links and chart without source', () => {
  const routes = canonicalRoutes();
  routes[0] = route('/', {
    overviewDiagramId: 'missing-overview',
    overviewCovers: ['page-purpose'],
    visualQuestions: [
      { id: 'q', question: 'Mi történik?', type: 'process', glossarySlugs: ['rug'], coverage: 'shared', diagramId: 'fig-shared', sharedHref: '../masik/#wrong', takeaway: 'Lépések.' },
      { id: 'q', question: 'Mennyi?', type: 'quantitative-data', glossarySlugs: ['context'], coverage: 'page-local', diagramId: 'fig-shared', takeaway: 'Adat.' },
    ],
  });
  const root = fixture(routes);
  const failures = validateManifest({ source: root, site: path.join(root, '.site'), phase: 'foundation' });
  assert.ok(failures.some((x) => x.includes('four required big-picture')));
  assert.ok(failures.some((x) => x.includes('duplicate question id')));
  assert.ok(failures.some((x) => x.includes('duplicate diagram id')));
  assert.ok(failures.some((x) => x.includes('canonical sharedHref')));
  assert.ok(failures.some((x) => x.includes('quantitativeSource')));
  assert.ok(failures.some((x) => x.includes('overviewDiagramId')));
});

test('foundation rejects omitted canonical routes and wrong frozen ownership', () => {
  const routes = canonicalRoutes().slice(0, -1);
  routes[0] = { ...routes[0], owner: 'WRONG-OWNER' };
  const root = fixture(routes);
  const failures = validateManifest({ source: root, site: path.join(root, '.site'), phase: 'foundation' });
  assert.ok(failures.some((x) => x.includes('exactly 33 frozen canonical routes')));
  assert.ok(failures.some((x) => x.includes('frozen owner mismatch')));
  assert.ok(failures.some((x) => x.includes('missing frozen canonical route: /reference-app/')));
});

test('final rejects an empty generated site even when every canonical source exists', () => {
  const routes = canonicalRoutes();
  routes[0] = { ...routes[0], title: 'Arbitrary title', alias: 'wrong alias' };
  const root = fixture(routes);
  for (const route of routes) { const file = path.join(root, route.source); fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, '<!doctype html>'); }
  const site = path.join(root, '.site'); fs.mkdirSync(site);
  const failures = validateManifest({ source: root, site, phase: 'final' });
  assert.ok(failures.some((x) => x.includes('final output missing: index.html')));
  assert.ok(failures.some((x) => x.includes('frozen title/alias mismatch')));
});

test('compatibility metadata rejects missing target, duplicate old path, wrong sunset/canonical and unsafe absolute output', () => {
  const base = compatibilityRoutes();
  const broken = structuredClone(base);
  broken.sunset = '2026-09-01';
  broken.routes[0].canonical = '/materials/modulok/02-repo-felkeszitese/';
  broken.routes[1].canonical = '/missing-target/';
  broken.routes[2].output = broken.routes[0].output;
  broken.routes[3].output = '/materials/notebooks/03-orchestrator-rug.html';
  const root = fixture(canonicalRoutes(), broken);
  const failures = validateManifest({ source: root, site: path.join(root, '.site'), phase: 'foundation' });
  assert.ok(failures.some((x) => x.includes('sunset must be 2026-08-15')));
  assert.ok(failures.some((x) => x.includes('wrong canonical target')));
  assert.ok(failures.some((x) => x.includes('canonical target is not a manifest route')));
  assert.ok(failures.some((x) => x.includes('duplicate compatibility output')));
  assert.ok(failures.some((x) => x.includes('unsafe compatibility output')));
  assert.ok(failures.some((x) => x.includes('missing compatibility output')));
});
