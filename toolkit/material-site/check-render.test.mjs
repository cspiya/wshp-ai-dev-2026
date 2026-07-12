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
  const css = '@media (prefers-reduced-motion: reduce) { [data-animation] { animation: none !important; } [data-animation-control] { display:none } } @media print { [data-animation] { animation: none !important; } [data-animation-control] { display:none } }';
  const html = `<!doctype html><html lang="hu"><head><meta name="viewport" content="width=device-width"><title>Animáció</title><style>${css}</style><script src="animation.js" defer></script></head><body><a href="#main">Tartalom</a><main id="main"><div data-animation="cycle" data-animation-state="static"><p data-animation-fallback="cycle">A ciklus teljes, statikus állapota.</p></div><button data-animation-control data-animation-start="cycle" disabled>Indítás</button><button data-animation-control data-animation-pause="cycle" disabled>Szünet</button><button data-animation-control data-animation-restart="cycle" disabled>Újrakezdés</button></main></body></html>`;
  const js = `if (!matchMedia('(prefers-reduced-motion: reduce)').matches) { const root=document.querySelector('[data-animation="cycle"]'); for (const b of document.querySelectorAll('[data-animation-control]')) b.disabled=false; for (const [a,s] of [['start','running'],['pause','paused'],['restart','running']]) document.querySelector('[data-animation-'+a+']').addEventListener('click',()=>root.dataset.animationState=s); }`;
  fs.writeFileSync(path.join(root, 'index.html'), html); fs.writeFileSync(path.join(root, 'animation.js'), js);
  assert.deepEqual(await validateRender({ site: root, modes: ['desktop', 'no-js', 'reduced-motion', 'print', 'file'] }), []);
});

test('real browser rejects CSS autoplay even when data state falsely says static', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'site-autoplay-'));
  const css = '@keyframes pulse { from { opacity:.2 } to { opacity:1 } } [data-animation] span { animation:pulse .4s infinite alternate } @media (prefers-reduced-motion: reduce) { [data-animation] span { animation:none } } @media print { [data-animation] span { animation:none } [data-animation-control] { display:none } }';
  const html = `<!doctype html><html lang="hu"><head><meta name="viewport" content="width=device-width"><title>Hibás animáció</title><style>${css}</style></head><body><a href="#main">Tartalom</a><main id="main"><div data-animation="cycle" data-animation-state="static"><span>Magától mozog</span><p data-animation-fallback="cycle">Statikus leírás.</p></div><button data-animation-control data-animation-start="cycle">Indítás</button><button data-animation-control data-animation-pause="cycle">Szünet</button><button data-animation-control data-animation-restart="cycle">Újrakezdés</button></main></body></html>`;
  fs.writeFileSync(path.join(root, 'index.html'), html);
  const failures = await validateRender({ site: root, modes: ['desktop'] });
  assert.ok(failures.some((x) => x.includes('changes before user initiation')));
});
