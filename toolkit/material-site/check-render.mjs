#!/usr/bin/env node
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import os from 'node:os';
import { createRequire } from 'node:module';
import { pathToFileURL, fileURLToPath } from 'node:url';

const ALL_MODES = ['desktop', 'mobile', 'print', 'no-js', 'reduced-motion', 'file'];
export function parseArgs(argv) {
  const out = { site: '.site', phase: 'foundation', modes: ALL_MODES };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--site') out.site = argv[++i];
    else if (argv[i] === '--phase') out.phase = argv[++i];
    else if (argv[i] === '--modes') out.modes = argv[++i].split(',').map((x) => x.trim()).filter(Boolean);
    else throw new Error(`unknown argument: ${argv[i]}`);
  }
  if (!['foundation', 'final'].includes(out.phase)) throw new Error('--phase must be foundation or final');
  for (const mode of out.modes) if (!ALL_MODES.includes(mode)) throw new Error(`unknown mode: ${mode}`);
  return out;
}
function walk(dir) { return fs.existsSync(dir) ? fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]) : []; }

export function validateStaticPage(html, label = 'page') {
  const failures = [];
  if (!/<html\b[^>]*lang=["']hu["']/i.test(html)) failures.push(`${label}: html lang must be hu`);
  if (!/<meta\b[^>]*name=["']viewport["']/i.test(html)) failures.push(`${label}: viewport meta missing`);
  if (!/<title>\s*[^<]+\s*<\/title>/i.test(html)) failures.push(`${label}: non-empty title missing`);
  if (!/<main\b/i.test(html)) failures.push(`${label}: main landmark missing`);
  if (/<marquee\b|autoplay|animation\s*:\s*[^;]+\binfinite\b/i.test(html) && !/prefers-reduced-motion/i.test(html)) failures.push(`${label}: motion has no reduced-motion fallback`);
  if (/\bautoplay\b/i.test(html)) failures.push(`${label}: autoplay is forbidden`);
  const animations = [...html.matchAll(/<[^>]+\bdata-animation=["']([^"']+)["'][^>]*>/gi)];
  for (const match of animations) {
    const id = match[1]; const tag = match[0];
    if (!/data-animation-state=["']static["']/i.test(tag)) failures.push(`${label}: animation ${id} must start in a complete static state`);
    for (const control of ['start', 'pause', 'restart']) if (!new RegExp(`data-animation-${control}=["']${id}["']`, 'i').test(html)) failures.push(`${label}: animation ${id} missing ${control} control`);
    if (!new RegExp(`data-animation-fallback=["']${id}["']`, 'i').test(html)) failures.push(`${label}: animation ${id} missing static fallback`);
    if (!/prefers-reduced-motion\s*:\s*reduce/i.test(html)) failures.push(`${label}: animation ${id} has no reduced-motion rule`);
    if (!/@media\s+print/i.test(html)) failures.push(`${label}: animation ${id} has no print rule`);
  }
  return failures;
}

function resolvePlaywright(site) {
  const repo = path.resolve(site, '..');
  const candidates = [path.join(repo, 'reference-app/package.json'), path.resolve(process.cwd(), 'reference-app/package.json')];
  for (const candidate of candidates) {
    if (!fs.existsSync(candidate)) continue;
    try { return createRequire(candidate)('@playwright/test'); } catch { /* try next */ }
  }
  throw new Error('Playwright is unavailable; run npm ci --prefix reference-app');
}

function staticServer(root) {
  const server = http.createServer((req, res) => {
    let pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    if (pathname.endsWith('/')) pathname += 'index.html';
    const file = path.resolve(root, `.${pathname}`);
    if (!(file === root || file.startsWith(`${root}${path.sep}`)) || !fs.existsSync(file)) { res.writeHead(404); res.end('not found'); return; }
    const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.json': 'application/json' };
    res.setHeader('Content-Type', types[path.extname(file)] ?? 'application/octet-stream');
    res.end(fs.readFileSync(file));
  });
  return new Promise((resolve) => server.listen(0, '127.0.0.1', () => resolve({ server, origin: `http://127.0.0.1:${server.address().port}` })));
}

async function browserChecks(page, label, mode, failures) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
  if (overflow) failures.push(`${label} (${mode}): horizontal overflow`);
  const unnamed = await page.locator('a,button,input,select,textarea,[tabindex]').evaluateAll((els) => els.filter((el) => !el.hasAttribute('disabled') && el.getAttribute('tabindex') !== '-1' && !(el.getAttribute('aria-label') || el.getAttribute('aria-labelledby') || el.textContent?.trim() || el.getAttribute('title') || el.getAttribute('alt'))).length);
  if (unnamed) failures.push(`${label} (${mode}): ${unnamed} focusable control(s) lack an accessible name`);
  await page.keyboard.press('Tab');
  const focus = await page.evaluate(() => document.activeElement?.tagName ?? '');
  if (!focus || focus === 'BODY' || focus === 'HTML') failures.push(`${label} (${mode}): keyboard focus is not visible/reachable`);
  const animationIds = await page.locator('[data-animation]').evaluateAll((els) => els.map((el) => el.getAttribute('data-animation')).filter(Boolean));
  for (const id of animationIds) {
    const root = page.locator(`[data-animation="${id}"]`);
    const fallback = page.locator(`[data-animation-fallback="${id}"]`);
    if (await fallback.count() !== 1 || !(await fallback.isVisible())) failures.push(`${label} (${mode}): animation ${id} lacks a visible static fallback`);
    const initial = await root.getAttribute('data-animation-state');
    if (initial === 'running') failures.push(`${label} (${mode}): animation ${id} autoplayed`);
    const disabledMode = ['no-js', 'reduced-motion', 'print'].includes(mode);
    if (disabledMode) {
      const state = await root.getAttribute('data-animation-state');
      const motion = await root.evaluate((el) => { const css = getComputedStyle(el); return { name: css.animationName, duration: css.animationDuration }; });
      if (state !== 'static') failures.push(`${label} (${mode}): animation ${id} is not in static final state`);
      if (motion.name !== 'none' && motion.duration !== '0s') failures.push(`${label} (${mode}): animation ${id} motion is not disabled`);
      for (const action of ['start', 'pause', 'restart']) {
        const control = page.locator(`[data-animation-${action}="${id}"]`);
        if (await control.count() !== 1) continue;
        const unavailable = await control.evaluate((el) => el.hasAttribute('disabled') || el.hidden || getComputedStyle(el).display === 'none' || getComputedStyle(el).visibility === 'hidden');
        if (!unavailable) failures.push(`${label} (${mode}): animation ${id} ${action} control remains enabled`);
      }
    } else {
      for (const [action, expected] of [['start', 'running'], ['pause', 'paused'], ['restart', 'running']]) {
        const control = page.locator(`[data-animation-${action}="${id}"]`);
        if (await control.count() !== 1) continue;
        await control.focus(); await page.keyboard.press('Enter');
        await page.waitForTimeout(10);
        if (await root.getAttribute('data-animation-state') !== expected) failures.push(`${label} (${mode}): animation ${id} ${action} is not keyboard-operable`);
      }
    }
  }
}

export async function validateRender({ site, modes }) {
  const failures = [];
  const pages = walk(site).filter((f) => f.toLowerCase().endsWith('.html'));
  if (!pages.length) return ['site contains no HTML pages'];
  for (const page of pages) failures.push(...validateStaticPage(fs.readFileSync(page, 'utf8'), path.relative(site, page)));
  if (failures.length) return failures;
  const { chromium } = resolvePlaywright(site);
  const { server, origin } = await staticServer(site);
  const browser = await chromium.launch({ headless: true });
  try {
    for (const file of pages) {
      const rel = path.relative(site, file).replaceAll('\\', '/');
      for (const mode of modes) {
        const isFile = mode === 'file';
        const context = await browser.newContext({
          viewport: mode === 'mobile' ? { width: 320, height: 800 } : { width: 1440, height: 900 },
          javaScriptEnabled: mode !== 'no-js',
          reducedMotion: mode === 'reduced-motion' ? 'reduce' : 'no-preference',
        });
        const page = await context.newPage();
        const runtime = [];
        page.on('console', (msg) => { if (msg.type() === 'error') runtime.push(`console: ${msg.text()}`); });
        page.on('pageerror', (error) => runtime.push(`pageerror: ${error.message}`));
        page.on('request', (request) => { if (isFile && /^https?:/i.test(request.url())) runtime.push(`network request: ${request.url()}`); });
        if (mode === 'print') await page.emulateMedia({ media: 'print' });
        const url = isFile ? pathToFileURL(file).href : `${origin}/${rel}`;
        const response = await page.goto(url, { waitUntil: 'load' });
        if (!isFile && response?.status() !== 200) failures.push(`${rel} (${mode}): HTTP ${response?.status()}`);
        await browserChecks(page, rel, mode, failures);
        if (mode === 'print') await page.pdf({ path: path.join(os.tmpdir(), `material-site-${process.pid}-${Math.random().toString(16).slice(2)}.pdf`), printBackground: true });
        failures.push(...runtime.map((x) => `${rel} (${mode}): ${x}`));
        await context.close();
      }
    }
  } finally { await browser.close(); await new Promise((resolve) => server.close(resolve)); }
  return failures;
}

async function main() {
  try {
    const opts = parseArgs(process.argv.slice(2));
    const failures = await validateRender({ ...opts, site: path.resolve(opts.site) });
    if (failures.length) { console.error(failures.map((x) => `FAIL: ${x}`).join('\n')); process.exitCode = 1; }
    else console.log(`render: PASS (${opts.phase}; ${opts.modes.join(',')})`);
  } catch (error) { console.error(`render: ${error.message}`); process.exitCode = 2; }
}
if (path.resolve(process.argv[1] ?? '') === fileURLToPath(import.meta.url)) main();
