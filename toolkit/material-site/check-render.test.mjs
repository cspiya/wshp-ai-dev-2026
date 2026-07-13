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

test('animation without controls/static fallback and autoplay fail preflight', () => {
  const html = '<html lang="hu"><head><meta name="viewport" content="width=device-width"><title>Animáció</title></head><body><main><div data-animation="cycle" data-animation-state="running" autoplay></div></main></body></html>';
  const failures = validateStaticPage(html, 'animation.html');
  assert.ok(failures.some((x) => x.includes('autoplay is forbidden')));
  assert.ok(failures.some((x) => x.includes('missing pause control')));
  assert.ok(failures.some((x) => x.includes('missing static fallback')));
});

test('page titles are plain text while exact migration-debt pages remain temporarily green', () => {
  const linkedTitle = '<html lang="hu"><head><meta name="viewport" content="width=device-width"><title>Cim</title></head><body><main><h1>Plugin es <a href="#skill">skill</a></h1></main></body></html>';
  assert.ok(validateStaticPage(linkedTitle, 'new-page/index.html').some((x) => x.includes('page h1 must be plain text')));
  assert.deepEqual(validateStaticPage(linkedTitle, 'materials/eszkozok/index.html'), []);
});

test('AI companion agent-work card uses agent, never deterministic machine semantics', () => {
  const shell = (role) => `<!doctype html><html lang="hu"><head><meta name="viewport" content="width=device-width"><title>AI-társ</title></head><body><main><section class="ai-companion"><article class="ai-role ${role}"><h3>Mit végez az agent?</h3><p>Dolgozik.</p></article></section></main></body></html>`;
  assert.deepEqual(validateStaticPage(shell('agent'), 'good-companion.html'), []);
  const failures = validateStaticPage(shell('machine'), 'bad-companion.html');
  assert.ok(failures.some((failure) => failure.includes('must use the semantic agent role')));
  assert.ok(failures.some((failure) => failure.includes('cannot use the deterministic machine role')));
});

test('real browser rejects a second local shell', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'site-double-shell-'));
  const html = '<!doctype html><html lang="hu"><head><meta name="viewport" content="width=device-width"><title>Ket keret</title></head><body><a href="#main">Tartalom</a><header class="local-header">Masodik fejléc</header><main id="main">Magyarazat</main><footer class="local-footer">Masodik lablec</footer></body></html>';
  fs.writeFileSync(path.join(root, 'index.html'), html);
  const failures = await validateRender({ site: root, modes: ['desktop'] });
  assert.ok(failures.some((x) => x.includes('second local site shell')));
});

test('real browser enforces one dark block-code surface', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'site-code-surface-'));
  const shell = (style) => `<!doctype html><html lang="hu"><head><meta name="viewport" content="width=device-width"><title>Kod</title><style>${style}</style></head><body><a href="#main">Tartalom</a><main id="main"><pre><code>npm run test</code></pre></main></body></html>`;
  fs.writeFileSync(path.join(root, 'index.html'), shell('pre{background:#111a31;color:#fff;font-family:monospace}pre code{background:transparent;border:0;padding:0;color:inherit;font:inherit}'));
  assert.deepEqual(await validateRender({ site: root, modes: ['desktop'] }), []);
  fs.writeFileSync(path.join(root, 'index.html'), shell('pre{background:#111a31;color:#fff;font-family:monospace}code{background:#eceff5;border:1px solid #ddd;padding:2px;color:#fff}'));
  const failures = await validateRender({ site: root, modes: ['desktop'] });
  assert.ok(failures.some((x) => x.includes('block code surface')));
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

test('real browser proves user-controlled animation and disabled fallback modes', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'site-animation-'));
  const css = '@keyframes step { from { transform:translateX(0) } to { transform:translateX(12px) } } [data-animation-state="running"] [data-animation-stage] { animation:step .3s infinite alternate } [data-animation-state="paused"] [data-animation-stage] { animation:step .3s infinite alternate; animation-play-state:paused } @media (prefers-reduced-motion: reduce) { [data-animation] * { animation: none !important; } [data-animation-control] { display:none } } @media print { [data-animation] * { animation: none !important; } [data-animation-control] { display:none } }';
  const html = `<!doctype html><html lang="hu"><head><meta name="viewport" content="width=device-width"><title>Animáció</title><style>${css}</style><script src="animation.js" defer></script></head><body><a href="#main">Tartalom</a><main id="main"><div data-animation="cycle" data-animation-state="static"><span data-animation-stage>Aktuális lépés</span><p data-animation-fallback="cycle">A ciklus teljes, statikus állapota.</p></div><button data-animation-control data-animation-start="cycle" disabled>Indítás</button><button data-animation-control data-animation-pause="cycle" disabled>Szünet</button><button data-animation-control data-animation-restart="cycle" disabled>Újrakezdés</button></main></body></html>`;
  const js = `if (!matchMedia('(prefers-reduced-motion: reduce)').matches) { const root=document.querySelector('[data-animation="cycle"]'); for (const b of document.querySelectorAll('[data-animation-control]')) b.disabled=false; for (const [a,s] of [['start','running'],['pause','paused'],['restart','running']]) document.querySelector('[data-animation-'+a+']').addEventListener('click',()=>root.dataset.animationState=s); }`;
  fs.writeFileSync(path.join(root, 'index.html'), html); fs.writeFileSync(path.join(root, 'animation.js'), js);
  assert.deepEqual(await validateRender({ site: root, modes: ['desktop', 'no-js', 'reduced-motion', 'print', 'file'] }), []);
});

test('real browser rejects pause/restart controls that only lie through state attributes', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'site-lying-controls-'));
  const css = '@keyframes move { from { transform:translateX(0) } to { transform:translateX(15px) } } [data-animation-state="running"] span,[data-animation-state="paused"] span { animation:move .3s infinite alternate } @media (prefers-reduced-motion: reduce) { [data-animation] span { animation:none } } @media print { [data-animation] span { animation:none } [data-animation-control] { display:none } }';
  const html = `<!doctype html><html lang="hu"><head><meta name="viewport" content="width=device-width"><title>Hamis vezérlők</title><style>${css}</style><script src="animation.js" defer></script></head><body><a href="#main">Tartalom</a><main id="main"><div data-animation="cycle" data-animation-state="static"><span>Mozgás</span><p data-animation-fallback="cycle">Statikus leírás.</p></div><button data-animation-start="cycle">Indítás</button><button data-animation-pause="cycle">Szünet</button><button data-animation-restart="cycle">Újrakezdés</button></main></body></html>`;
  const js = `const r=document.querySelector('[data-animation]');for(const [a,s] of [['start','running'],['pause','paused'],['restart','running']])document.querySelector('[data-animation-'+a+']').addEventListener('click',()=>r.dataset.animationState=s);`;
  fs.writeFileSync(path.join(root, 'index.html'), html); fs.writeFileSync(path.join(root, 'animation.js'), js);
  const failures = await validateRender({ site: root, modes: ['desktop'] });
  assert.ok(failures.some((x) => x.includes('pause does not stop visual motion')));
});

test('real browser rejects CSS autoplay even when data state falsely says static', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'site-autoplay-'));
  const css = '@keyframes pulse { from { opacity:.2 } to { opacity:1 } } [data-animation] span { animation:pulse .4s infinite alternate } @media (prefers-reduced-motion: reduce) { [data-animation] span { animation:none } } @media print { [data-animation] span { animation:none } [data-animation-control] { display:none } }';
  const html = `<!doctype html><html lang="hu"><head><meta name="viewport" content="width=device-width"><title>Hibás animáció</title><style>${css}</style></head><body><a href="#main">Tartalom</a><main id="main"><div data-animation="cycle" data-animation-state="static"><span>Magától mozog</span><p data-animation-fallback="cycle">Statikus leírás.</p></div><button data-animation-control data-animation-start="cycle">Indítás</button><button data-animation-control data-animation-pause="cycle">Szünet</button><button data-animation-control data-animation-restart="cycle">Újrakezdés</button></main></body></html>`;
  fs.writeFileSync(path.join(root, 'index.html'), html);
  const failures = await validateRender({ site: root, modes: ['desktop'] });
  assert.ok(failures.some((x) => x.includes('changes before user initiation')));
});

test('real browser rejects descendant motion active only in reduced-motion and print', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'site-disabled-descendant-motion-'));
  const css = '@keyframes bad { from { transform:translateX(0) } to { transform:translateX(12px) } } @media (prefers-reduced-motion: reduce) { [data-animation] span { animation:bad .3s infinite alternate } [data-animation-control] { display:none } } @media print { [data-animation] span { animation:bad .3s infinite alternate } [data-animation-control] { display:none } }';
  const html = `<!doctype html><html lang="hu"><head><meta name="viewport" content="width=device-width"><title>Hibás fallback</title><style>${css}</style></head><body><a href="#main">Tartalom</a><main id="main"><div data-animation="cycle" data-animation-state="static"><span>Magától mozog</span><p data-animation-fallback="cycle">Statikus leírás.</p></div><button disabled data-animation-control data-animation-start="cycle">Indítás</button><button disabled data-animation-control data-animation-pause="cycle">Szünet</button><button disabled data-animation-control data-animation-restart="cycle">Újrakezdés</button></main></body></html>`;
  fs.writeFileSync(path.join(root, 'index.html'), html);
  const failures = await validateRender({ site: root, modes: ['reduced-motion', 'print'] });
  assert.ok(failures.filter((x) => x.includes('descendant motion is not disabled')).length >= 2);
});
