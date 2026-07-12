import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { CSP, validateDiagrams } from './check-diagrams.mjs';

const CONFIG = { securityLevel: 'strict', deterministicIds: true, deterministicIDSeed: 'wshp-ai-dev-2026-v2', htmlLabels: false };
const CANONICAL_CONFIG = '{"deterministicIDSeed":"wshp-ai-dev-2026-v2","deterministicIds":true,"htmlLabels":false,"securityLevel":"strict"}';
function localDiagram({ id = 'flow', visualQuestionId = 'q-overview', question = 'Mi következik?', type = 'process', diagramType = 'flowchart', takeaway = 'A lépések egymásra épülnek.', glossarySlugs = ['rug'], bad = false } = {}) {
  const mmd = 'flowchart LR\n A-->B\n';
  const svg = bad ? '<svg><script>alert(1)</script></svg>' : '<svg xmlns="http://www.w3.org/2000/svg"><title>Folyamat</title><text>lépés</text></svg>';
  return {
    record: { id, visualQuestionId, question, type, disposition: 'page-local', diagramType, takeaway, glossarySlugs, source: `${id}.mmd`, output: `${id}.svg`, textFallbackSelector: `#${id}-text`, sourceHash: bad ? 'b'.repeat(64) : crypto.createHash('sha256').update(`${mmd}\n${CANONICAL_CONFIG}\n11.16.0`).digest('hex'), outputHash: bad ? 'b'.repeat(64) : crypto.createHash('sha256').update(svg).digest('hex') },
    mmd, svg,
  };
}
function inlineDiagram({ id = 'inline-map', visualQuestionId = 'q-overview', question = 'Mi mivel függ össze?', type = 'relationship', diagramType = 'relationship-map', takeaway = 'A kapcsolat iránya határozza meg a következő lépést.', glossarySlugs = ['rug'], hash = null } = {}) {
  const svg = `<svg viewBox="0 0 200 80" role="img" aria-labelledby="${id}-title ${id}-desc"><title id="${id}-title">Kapcsolati térkép</title><desc id="${id}-desc">A pontból B pontba mutató nyíl.</desc><path d="M20 40 H180"/></svg>`;
  return {
    record: { id, visualQuestionId, question, type, disposition: 'page-local', rendering: 'inline-svg', diagramType, takeaway, glossarySlugs, figureSelector: `#${id}`, svgSelector: `#${id} svg`, textFallbackSelector: `#${id}-text`, inlineSvgHash: hash ?? crypto.createHash('sha256').update(svg).digest('hex') },
    inlineSvg: svg,
  };
}
function visualQuestion({ id = 'q-overview', question = 'Mi következik?', type = 'process', diagramId = 'flow', coverage = 'page-local', takeaway = 'A lépések egymásra épülnek.', glossarySlugs = ['rug'], ...extra } = {}) { return { id, question, type, diagramId, coverage, takeaway, glossarySlugs, ...extra }; }

function fixture({ diagrams, questions, owner = 'SHELL-BUILD' } = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'site-diagrams-'));
  const media = path.join(root, 'page/media'); const site = path.join(root, '.site');
  fs.mkdirSync(media, { recursive: true }); fs.mkdirSync(path.join(site, 'page'), { recursive: true });
  fs.mkdirSync(path.join(site, 'assets'), { recursive: true });
  fs.mkdirSync(path.join(root, 'toolkit/material-site'), { recursive: true });
  fs.mkdirSync(path.join(root, 'materials/fogalomtar'), { recursive: true });
  fs.writeFileSync(path.join(root, 'toolkit/material-site/mermaid.config.json'), JSON.stringify(CONFIG));
  fs.writeFileSync(path.join(root, 'materials/fogalomtar/glossary.json'), JSON.stringify({ terms: [{ slug: 'rug' }, { slug: 'scope' }] }));
  const defaultLocal = localDiagram();
  const records = diagrams ?? [defaultLocal];
  for (const item of records) if (item.mmd) { fs.writeFileSync(path.join(media, item.record.source), item.mmd); fs.writeFileSync(path.join(media, item.record.output), item.svg); }
  fs.writeFileSync(path.join(media, 'diagrams.json'), JSON.stringify({ diagrams: records.map((item) => item.record ?? item) }));
  const visualQuestions = questions ?? [visualQuestion()];
  const route = { id: '/page/', source: 'page/index.html', output: '.site/page/index.html', owner, overviewDiagramId: visualQuestions[0]?.diagramId ?? 'flow', visualQuestions };
  fs.writeFileSync(path.join(root, 'toolkit/material-site/site-manifest.json'), JSON.stringify({ routes: [route] }));
  fs.writeFileSync(path.join(site, 'assets/route-disposition.json'), JSON.stringify({ phase: 'foundation', real: ['/page/'], substituted: [] }));
  const figures = records.filter((item) => (item.record ?? item).disposition === 'page-local').map((item) => {
    const d = item.record ?? item;
    if (d.rendering === 'inline-svg') return `<figure id="${d.id}">${item.inlineSvg}<figcaption>Kapcsolati térkép</figcaption><p id="${d.id}-text">Teljes szöveges magyarázat.</p></figure>`;
    return `<figure id="${d.id}"><img src="media/${d.output}" alt="A folyamat" width="400" height="200"><figcaption>Folyamat</figcaption><p id="${d.id}-text">Teljes szöveges magyarázat.</p></figure>`;
  }).join('');
  fs.writeFileSync(path.join(root, 'page/index.html'), `<h1>Forrás</h1>${figures}`);
  fs.writeFileSync(path.join(site, 'page/index.html'), `<meta http-equiv="Content-Security-Policy" content="${CSP}">${figures}`);
  return { root, site, media };
}

test('secure deterministic concept-driven visual coverage passes', () => {
  const f = fixture();
  assert.deepEqual(validateDiagrams({ source: f.root, site: f.site, phase: 'foundation' }), []);
});

test('first-class inline SVG disposition verifies exact figure, fallback and integrity', () => {
  const inline = inlineDiagram();
  const question = visualQuestion({ question: inline.record.question, type: 'relationship', diagramId: inline.record.id, takeaway: inline.record.takeaway });
  const f = fixture({ diagrams: [inline], questions: [question] });
  assert.deepEqual(validateDiagrams({ source: f.root, site: f.site, phase: 'foundation' }), []);
});

test('negative inline fixture rejects undeclared figures and mismatched registry integrity', () => {
  const inline = inlineDiagram({ hash: 'a'.repeat(64) });
  const question = visualQuestion({ question: inline.record.question, type: 'relationship', diagramId: inline.record.id, takeaway: inline.record.takeaway });
  const f = fixture({ diagrams: [inline], questions: [question] });
  fs.appendFileSync(path.join(f.root, 'page/index.html'), '<figure id="undeclared"><svg role="img" aria-labelledby="u-title u-desc"><title id="u-title">Plusz</title><desc id="u-desc">Nincs deklarálva.</desc></svg></figure>');
  const failures = validateDiagrams({ source: f.root, site: f.site, phase: 'foundation' });
  assert.ok(failures.some((x) => x.includes('stale or changed inline SVG hash')));
  assert.ok(failures.some((x) => x.includes('undeclared pedagogical inline SVG figure: undeclared')));
});

test('negative fixture rejects unsafe SVG and stale source/output hashes', () => {
  const f = fixture({ diagrams: [localDiagram({ bad: true })] });
  const failures = validateDiagrams({ source: f.root, site: f.site, phase: 'foundation' });
  assert.ok(failures.some((x) => x.includes('unsafe SVG')));
  assert.ok(failures.some((x) => x.includes('source/config/version hash')));
  assert.ok(failures.some((x) => x.includes('output hash')));
});

test('negative fixture rejects missing/duplicate coverage, prose-only complex and decorative-only overview', () => {
  const questions = [visualQuestion(), visualQuestion({ id: 'q-detail', diagramId: 'detail', type: 'structure', question: 'Mi miből áll?', takeaway: 'A részek határai láthatók.' }), visualQuestion({ id: 'q-missing', diagramId: 'missing', type: 'decision' })];
  const overview = localDiagram(); overview.record.disposition = 'decorative-only';
  const prose = { visualQuestionId: 'q-detail', question: 'Mi miből áll?', type: 'structure', disposition: 'prose-only', takeaway: 'A részek határai láthatók.', glossarySlugs: ['rug'] };
  const f = fixture({ questions, diagrams: [overview, prose, prose] });
  const failures = validateDiagrams({ source: f.root, site: f.site, phase: 'foundation' });
  assert.ok(failures.some((x) => x.includes('decorative-only')));
  assert.ok(failures.some((x) => x.includes('prose-only cannot')));
  assert.ok(failures.some((x) => x.includes('duplicate disposition')));
  assert.ok(failures.some((x) => x.includes('no disposition: q-missing')));
  assert.ok(failures.some((x) => x.includes('overview figure/takeaway missing')));
});

test('negative fixture rejects broken shared canonical target and chart without quantitative source', () => {
  const sharedQuestion = visualQuestion({ id: 'q-shared', diagramId: 'fig-shared', coverage: 'shared', sharedHref: '../shared/index.html#fig-shared', type: 'relationship' });
  const chartQuestion = visualQuestion({ id: 'q-chart', diagramId: 'chart', type: 'quantitative-data', question: 'Mennyi?', takeaway: 'Az értékek eltérnek.', quantitativeSource: 'Mért gyakorlóadat.' });
  const shared = { visualQuestionId: 'q-shared', question: sharedQuestion.question, type: 'relationship', disposition: 'shared', takeaway: sharedQuestion.takeaway, glossarySlugs: ['rug'], sharedDiagramId: 'fig-shared', sharedHref: '../shared/index.html#fig-shared' };
  const chart = localDiagram({ id: 'chart', visualQuestionId: 'q-chart', question: 'Mennyi?', type: 'quantitative-data', diagramType: 'bar-chart', takeaway: 'Az értékek eltérnek.' });
  const f = fixture({ questions: [visualQuestion(), sharedQuestion, chartQuestion], diagrams: [localDiagram(), shared, chart] });
  const failures = validateDiagrams({ source: f.root, site: f.site, phase: 'foundation' });
  assert.ok(failures.some((x) => x.includes('broken shared canonical figure link')));
  assert.ok(failures.some((x) => x.includes('chart requires a declared quantitative source')));
});

test('module requires overview plus a detailed page-local visual with unique IDs', () => {
  const f = fixture({ owner: 'MODULE-01' });
  const failures = validateDiagrams({ source: f.root, site: f.site, phase: 'foundation' });
  assert.ok(failures.some((x) => x.includes('at least one detailed page-local visual')));
});

test('animation metadata rejects autoplay and missing control/static contracts', () => {
  const animated = localDiagram();
  animated.record.animation = { id: 'flow', autoplay: true, userInitiated: false };
  const f = fixture({ diagrams: [animated] });
  const failures = validateDiagrams({ source: f.root, site: f.site, phase: 'foundation' });
  assert.ok(failures.some((x) => x.includes('animation missing pauseSelector')));
  assert.ok(failures.some((x) => x.includes('userInitiated=true')));
  assert.ok(failures.some((x) => x.includes('autoplay must be false')));
});
