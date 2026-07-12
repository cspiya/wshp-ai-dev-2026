import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { CSP, validateDiagrams } from './check-diagrams.mjs';

function fixture({ bad = false } = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'site-diagrams-'));
  const media = path.join(root, 'page/media'); const site = path.join(root, '.site');
  fs.mkdirSync(media, { recursive: true }); fs.mkdirSync(site, { recursive: true });
  fs.mkdirSync(path.join(root, 'toolkit/material-site'), { recursive: true });
  const config = { securityLevel: 'strict', deterministicIds: true, deterministicIDSeed: 'wshp-ai-dev-2026-v2', htmlLabels: false };
  fs.writeFileSync(path.join(root, 'toolkit/material-site/mermaid.config.json'), JSON.stringify(config));
  const svg = bad ? '<svg><script>alert(1)</script></svg>' : '<svg xmlns="http://www.w3.org/2000/svg"><title>Folyamat</title><text>lépés</text></svg>';
  const mmd = 'flowchart LR\n A-->B\n';
  fs.writeFileSync(path.join(media, 'flow.mmd'), mmd);
  fs.writeFileSync(path.join(media, 'flow.svg'), svg);
  const hash = crypto.createHash('sha256').update(svg).digest('hex');
  const canonicalConfig = '{"deterministicIDSeed":"wshp-ai-dev-2026-v2","deterministicIds":true,"htmlLabels":false,"securityLevel":"strict"}';
  const sourceHash = crypto.createHash('sha256').update(`${mmd}${canonicalConfig}11.16.0`).digest('hex');
  fs.writeFileSync(path.join(media, 'diagrams.json'), JSON.stringify({ diagrams: [{ id: 'flow', question: 'Mi következik?', source: 'flow.mmd', output: 'flow.svg', textFallbackSelector: '#flow-text', sourceHash: bad ? 'b'.repeat(64) : sourceHash, outputHash: bad ? 'b'.repeat(64) : hash }] }));
  fs.writeFileSync(path.join(site, 'index.html'), `<meta http-equiv="Content-Security-Policy" content="${CSP}"><figure><img src="../page/media/flow.svg" alt="A folyamat" width="400" height="200"><figcaption>Folyamat</figcaption></figure>`);
  return { root, site };
}

test('secure deterministic external diagram contract passes', () => { const f = fixture(); assert.deepEqual(validateDiagrams({ source: f.root, site: f.site, phase: 'foundation' }), []); });
test('negative fixture rejects unsafe SVG and stale source/output hashes', () => { const f = fixture({ bad: true }); const failures = validateDiagrams({ source: f.root, site: f.site, phase: 'foundation' }); assert.ok(failures.some((x) => x.includes('unsafe SVG'))); assert.ok(failures.some((x) => x.includes('source/config/version hash'))); assert.ok(failures.some((x) => x.includes('output hash'))); });
