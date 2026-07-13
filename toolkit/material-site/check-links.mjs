#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export function parseArgs(argv) {
  const out = { source: '.', site: '.site', phase: 'foundation', fileProtocol: false };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--source') out.source = argv[++i];
    else if (argv[i] === '--site') out.site = argv[++i];
    else if (argv[i] === '--phase') out.phase = argv[++i];
    else if (argv[i] === '--file-protocol') out.fileProtocol = true;
    else throw new Error(`unknown argument: ${argv[i]}`);
  }
  if (!['foundation', 'final'].includes(out.phase)) throw new Error('--phase must be foundation or final');
  return out;
}

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
}

function attrs(html, name) {
  const values = [];
  const re = new RegExp(`\\b${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)')`, 'gi');
  for (const m of html.matchAll(re)) values.push(m[1] ?? m[2]);
  return values;
}
function oneAttr(tag, name) {
  const match = tag.match(new RegExp(`\\b${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)')`, 'i'));
  return match?.[1] ?? match?.[2];
}

function ids(html) {
  return new Set(attrs(html, 'id').map((x) => decodeURIComponent(x)));
}

function targetFor(from, href, site) {
  const [rawPath, fragment = ''] = href.split('#', 2);
  let target = rawPath ? path.resolve(path.dirname(from), decodeURIComponent(rawPath)) : from;
  if (rawPath.endsWith('/')) target = path.join(target, 'index.html');
  else if (rawPath && !path.extname(target) && !fs.existsSync(target)) target = path.join(target, 'index.html');
  if (!rawPath) target = from;
  return { target, fragment: decodeURIComponent(fragment), inside: target === site || target.startsWith(`${site}${path.sep}`) };
}

export function validateLinks({ site, fileProtocol = false, phase = 'foundation' }) {
  const failures = [];
  const pages = walk(site).filter((f) => f.toLowerCase().endsWith('.html'));
  if (!pages.length) return ['site contains no HTML pages'];
  const pageSet = new Set(pages.map((f) => path.resolve(f).toLowerCase()));
  const inbound = new Map(pages.map((f) => [path.resolve(f).toLowerCase(), 0]));
  const forwards = new Set();
  for (const page of pages) {
    const html = fs.readFileSync(page, 'utf8');
    const refreshTag = (html.match(/<meta\b[^>]*http-equiv=["']refresh["'][^>]*>/i) ?? [])[0];
    const refreshHref = refreshTag ? oneAttr(refreshTag, 'content')?.match(/url\s*=\s*(.+)$/i)?.[1]?.trim() : null;
    if (refreshHref) forwards.add(path.resolve(page).toLowerCase());
    const canonical = [...html.matchAll(/<link\b[^>]*\brel=["'][^"']*canonical[^"']*["'][^>]*>/gi)];
    if (canonical.length !== 1) failures.push(`${path.relative(site, page)}: expected exactly one canonical link`);
    if (canonical.length === 1) {
      const canonicalHref = oneAttr(canonical[0][0], 'href');
      if (!canonicalHref) failures.push(`${path.relative(site, page)}: canonical href missing`);
      else {
        const canonicalTarget = targetFor(page, canonicalHref, site).target;
        const expectedTarget = refreshHref ? targetFor(page, refreshHref, site).target : page;
        if (path.resolve(canonicalTarget).toLowerCase() !== path.resolve(expectedTarget).toLowerCase()) failures.push(`${path.relative(site, page)}: canonical does not match ${refreshHref ? 'forward target' : 'the page itself'}`);
      }
    }
    if (refreshTag) {
      if (!refreshHref) failures.push(`${path.relative(site, page)}: forward refresh target missing`);
      else {
        const refreshTarget = targetFor(page, refreshHref, site);
        if (!refreshTarget.inside || !fs.existsSync(refreshTarget.target)) failures.push(`${path.relative(site, page)}: forward target missing or escapes site: ${refreshHref}`);
        if (!attrs(html, 'href').includes(refreshHref)) failures.push(`${path.relative(site, page)}: forward needs a visible link matching refresh target`);
      }
    }
    for (const href of attrs(html, 'href')) {
      if (!href || /^(https?:|mailto:|tel:|data:|javascript:)/i.test(href)) continue;
      if (fileProtocol && href.startsWith('/')) { failures.push(`${path.relative(site, page)}: root-absolute link breaks file://: ${href}`); continue; }
      const { target, fragment, inside } = targetFor(page, href, site);
      if (!inside) { failures.push(`${path.relative(site, page)}: link escapes site: ${href}`); continue; }
      if (!fs.existsSync(target)) { failures.push(`${path.relative(site, page)}: missing target: ${href}`); continue; }
      if (pageSet.has(path.resolve(target).toLowerCase()) && target !== page) inbound.set(path.resolve(target).toLowerCase(), (inbound.get(path.resolve(target).toLowerCase()) ?? 0) + 1);
      if (fragment && target.toLowerCase().endsWith('.html') && !ids(fs.readFileSync(target, 'utf8')).has(fragment)) failures.push(`${path.relative(site, page)}: missing anchor ${href}`);
    }
    for (const src of attrs(html, 'src')) {
      if (!src || /^(https?:|data:)/i.test(src)) continue;
      if (fileProtocol && src.startsWith('/')) { failures.push(`${path.relative(site, page)}: root-absolute resource breaks file://: ${src}`); continue; }
      const { target, inside } = targetFor(page, src, site);
      if (!inside || !fs.existsSync(target)) failures.push(`${path.relative(site, page)}: missing or escaping resource: ${src}`);
    }
  }
  if (phase === 'final') {
    const root = path.join(site, 'index.html').toLowerCase();
    for (const [page, count] of inbound) if (page !== root && count === 0 && !forwards.has(page)) failures.push(`orphan page: ${path.relative(site, page)}`);
  }
  return failures;
}

async function main() {
  try {
    const opts = parseArgs(process.argv.slice(2));
    const failures = validateLinks({ ...opts, site: path.resolve(opts.site) });
    if (failures.length) { console.error(failures.map((x) => `FAIL: ${x}`).join('\n')); process.exitCode = 1; }
    else console.log(`links: PASS (${opts.phase}${opts.fileProtocol ? ', file://' : ''})`);
  } catch (error) { console.error(`links: ${error.message}`); process.exitCode = 2; }
}
if (path.resolve(process.argv[1] ?? '') === fileURLToPath(import.meta.url)) main();
