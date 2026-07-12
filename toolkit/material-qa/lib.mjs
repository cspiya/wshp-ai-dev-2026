// Material-QA render harness — core library (WEN-226).
// Deterministic local rendering of standalone workshop HTML into
// per-viewport evidence + a machine-readable manifest. No network access:
// pages are served from a loopback static server with path-traversal guards.

import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

export const MODES = {
  desktop: { kind: 'screenshot', viewport: { width: 1440, height: 900 } },
  mobile: { kind: 'screenshot', viewport: { width: 390, height: 844 } },
  print: { kind: 'pdf', viewport: { width: 1440, height: 900 } },
};

const CONTENT_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.htm': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

function git(args, cwd) {
  const r = spawnSync('git', args, { cwd, encoding: 'utf8' });
  return { status: r.status, out: (r.stdout || '').trim() };
}

// Discover standalone HTML files from a mix of directories and explicit
// files. Directories are scanned one level deep only (notebooks live flat);
// explicit files are taken as-is. Missing inputs are hard errors — a QA run
// must never silently shrink its own scope.
export function discoverTargets(inputs) {
  const targets = [];
  for (const input of inputs) {
    const resolved = path.resolve(input);
    let stat;
    try {
      stat = fs.statSync(resolved);
    } catch {
      throw new Error(`input not found: ${input}`);
    }
    if (stat.isDirectory()) {
      const entries = fs
        .readdirSync(resolved)
        .filter((name) => /\.html?$/i.test(name))
        .sort()
        .map((name) => path.join(resolved, name));
      if (entries.length === 0) {
        throw new Error(`no HTML files found in directory: ${input}`);
      }
      targets.push(...entries);
    } else if (/\.html?$/i.test(resolved)) {
      targets.push(resolved);
    } else {
      throw new Error(`not an HTML file: ${input}`);
    }
  }
  return [...new Set(targets)];
}

// The evidence directory must never be committable: require it to be either
// outside any git work tree or explicitly git-ignored. This mechanically
// enforces "no committed screenshots/PDFs from participant content".
export function validateOutDir(outDir) {
  const resolved = path.resolve(outDir);
  if (fs.existsSync(resolved) && !fs.statSync(resolved).isDirectory()) {
    throw new Error(`output destination is an existing file: ${outDir}`);
  }
  const probeCwd = fs.existsSync(resolved) ? resolved : path.dirname(resolved);
  if (!fs.existsSync(probeCwd)) {
    throw new Error(`output destination parent does not exist: ${outDir}`);
  }
  const inRepo = git(['rev-parse', '--is-inside-work-tree'], probeCwd);
  if (inRepo.status === 0 && inRepo.out === 'true') {
    const ignored = git(['check-ignore', '-q', resolved], probeCwd);
    if (ignored.status !== 0) {
      throw new Error(
        `output destination is inside a git work tree and not git-ignored: ${resolved}. ` +
          'Evidence must go to an ignored or out-of-repo directory.'
      );
    }
  }
  fs.mkdirSync(resolved, { recursive: true });
  return resolved;
}

// Loopback static file server rooted at `root`. Rejects any resolved path
// that escapes the root (encoded traversal included) and never lists
// directories.
export function startServer(root) {
  const rootResolved = path.resolve(root);
  const server = http.createServer((req, res) => {
    let pathname;
    try {
      pathname = decodeURIComponent(new URL(req.url, 'http://127.0.0.1').pathname);
    } catch {
      res.writeHead(400).end('bad request');
      return;
    }
    const fsPath = path.normalize(path.join(rootResolved, pathname));
    if (fsPath !== rootResolved && !fsPath.startsWith(rootResolved + path.sep)) {
      res.writeHead(403).end('forbidden');
      return;
    }
    let stat;
    try {
      stat = fs.statSync(fsPath);
    } catch {
      res.writeHead(404).end('not found');
      return;
    }
    if (stat.isDirectory()) {
      res.writeHead(404).end('not found');
      return;
    }
    const type = CONTENT_TYPES[path.extname(fsPath).toLowerCase()] ?? 'application/octet-stream';
    res.writeHead(200, { 'content-type': type });
    fs.createReadStream(fsPath).pipe(res);
  });
  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      resolve({
        origin: `http://127.0.0.1:${port}`,
        close: () => new Promise((r) => server.close(r)),
      });
    });
  });
}

// Resolve the repository's locked Playwright build. Order: explicit
// override, then reference-app (the repo's canonical browser toolchain).
// We intentionally do not add a second browser dependency to the repo.
export function resolvePlaywright(repoRoot, override) {
  const roots = [override, path.join(repoRoot, 'reference-app')].filter(Boolean);
  const failures = [];
  for (const candidate of roots) {
    try {
      const req = createRequire(path.join(path.resolve(candidate), 'package.json'));
      return req('playwright-core');
    } catch (err) {
      failures.push(`${candidate}: ${err.message.split('\n')[0]}`);
    }
  }
  throw new Error(
    'playwright-core not resolvable. Install the repo toolchain (`npm ci --prefix reference-app`) ' +
      `or pass --playwright-root <dir>. Tried:\n  ${failures.join('\n  ')}`
  );
}

function describeSource(file) {
  const dir = path.dirname(file);
  const inRepo = git(['rev-parse', '--is-inside-work-tree'], dir);
  if (inRepo.status !== 0 || inRepo.out !== 'true') {
    return { sha: null, dirty: null };
  }
  const sha = git(['rev-parse', 'HEAD'], dir).out || null;
  const status = git(['status', '--porcelain', '--', file], dir);
  return { sha, dirty: status.out.length > 0 };
}

// Render every target in every requested mode. One page failure never
// aborts the run; it is recorded as a failed manifest entry. The manifest —
// not the pixels — is the deterministic contract.
export async function renderAll({
  targets,
  outDir,
  modes,
  timeoutMs,
  playwright,
  assertModulePath,
}) {
  const serveRoot = targets.length === 1 ? path.dirname(targets[0]) : commonDir(targets);
  const { origin, close } = await startServer(serveRoot);
  let assertFn = null;
  let browser;
  try {
    if (assertModulePath) {
      const mod = await import(pathToFileURL(path.resolve(assertModulePath)));
      if (typeof mod.assertPage !== 'function') {
        throw new Error(`assert module has no exported assertPage(): ${assertModulePath}`);
      }
      assertFn = mod.assertPage;
    }
    browser = await playwright.chromium.launch();
  } catch (err) {
    await close();
    throw err;
  }
  const entries = [];
  try {
    for (const file of targets) {
      const rel = path.relative(serveRoot, file).split(path.sep).join('/');
      const url = `${origin}/${rel.split('/').map(encodeURIComponent).join('/')}`;
      const source = describeSource(file);
      for (const modeName of modes) {
        const mode = MODES[modeName];
        const failures = [];
        // Output names mirror the serve-root-relative path so same-named
        // files in different directories never overwrite each other.
        const baseName = `${rel.replace(/\.[^.]+$/, '').split('/').join('__')}.${modeName}`;
        const outPath = path.join(outDir, mode.kind === 'pdf' ? `${baseName}.pdf` : `${baseName}.png`);
        // A reused evidence dir must never let a failed attempt point at a
        // previous run's capture of older content.
        fs.rmSync(outPath, { force: true });
        const context = await browser.newContext({
          viewport: mode.viewport,
          deviceScaleFactor: 1,
          locale: 'hu-HU',
          timezoneId: 'Europe/Budapest',
          colorScheme: 'light',
          reducedMotion: 'reduce',
        });
        const page = await context.newPage();
        page.on('console', (msg) => {
          if (msg.type() === 'error') failures.push({ kind: 'console-error', detail: msg.text() });
        });
        page.on('pageerror', (err) => failures.push({ kind: 'page-error', detail: String(err) }));
        page.on('requestfailed', (req) =>
          failures.push({ kind: 'request-failed', detail: `${req.url()} (${req.failure()?.errorText})` })
        );
        page.on('response', (res) => {
          if (res.status() >= 400 && res.url().startsWith(origin)) {
            failures.push({ kind: 'http-error', detail: `${res.status()} ${res.url()}` });
          }
        });
        try {
          await page.goto(url, { waitUntil: 'load', timeout: timeoutMs });
          if (assertFn) {
            await assertFn({ page, file, mode: modeName, failures });
          }
          if (mode.kind === 'pdf') {
            await page.pdf({ path: outPath, format: 'A4', printBackground: true });
          } else {
            await page.screenshot({ path: outPath, fullPage: true });
          }
        } catch (err) {
          failures.push({ kind: 'render-failure', detail: String(err).split('\n')[0] });
        } finally {
          await context.close().catch(() => {});
        }
        const ok = failures.length === 0;
        entries.push({
          // Anchored to serveRoot/outDir (not cwd) so manifests from
          // identical inputs are comparable regardless of where the CLI ran.
          source: rel,
          sourceSha: source.sha,
          sourceDirty: source.dirty,
          mode: modeName,
          viewport: mode.viewport,
          output: fs.existsSync(outPath)
            ? path.relative(outDir, outPath).split(path.sep).join('/')
            : null,
          ok,
          failures,
        });
      }
    }
  } finally {
    await browser.close().catch(() => {});
    await close();
  }

  const manifest = {
    tool: 'material-qa',
    serveRoot,
    modes,
    timeoutMs,
    summary: {
      total: entries.length,
      passed: entries.filter((e) => e.ok).length,
      failed: entries.filter((e) => !e.ok).length,
    },
    entries,
  };
  fs.writeFileSync(path.join(outDir, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
  return manifest;
}

// Longest common ancestor directory, compared segment-wise so a sibling
// whose name is a string prefix of another ("bar" vs "barbaz") is never
// mistaken for its ancestor.
export function commonDir(files) {
  const roots = new Set(files.map((f) => path.parse(path.resolve(f)).root.toLowerCase()));
  if (roots.size > 1) {
    throw new Error('inputs span multiple drives/roots; run once per drive');
  }
  let prefix = path.dirname(files[0]);
  for (const f of files.slice(1)) {
    while (
      !(path.dirname(f) + path.sep).startsWith(prefix + path.sep) &&
      prefix !== path.dirname(prefix)
    ) {
      prefix = path.dirname(prefix);
    }
  }
  return prefix;
}
