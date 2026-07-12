#!/usr/bin/env node
// Participant-site builder (WEN-256, SHELL-BUILD lane).
//
//   node toolkit/material-site/build-site.mjs --clean --out .site [--phase foundation|final]
//
// Contract (v3 spec sections 5, B, 12, 13, v3.3):
// - `site-manifest.json` is the sole authoritative route table; the build
//   copies ONLY allowlisted content into the transient out dir. The out dir
//   is never committed: builders delete it after validation. (The root
//   .gitignore entry for `.site/` is coordinator-owned — flagged on the
//   issue; do not rely on it existing.)
// - The build generates the whole shell: skip link, global navigation,
//   breadcrumbs, module 1-8 progress, prev/next, footer and the search
//   index. Emitted href/src values are page-relative and target explicit
//   index.html; page sources never hand-calculate routes.
// - Page sources own <html lang>, <title>, <head> styles and <main>
//   content. The build injects the exact CSP meta, the shared stylesheet
//   link, and body shell around the source's <body> content.
// - `--phase foundation`: routes whose source does not exist yet are
//   substituted from checked-in neutral fixtures (never published as
//   content; substitutions are reported). `--phase final` (WEN-274)
//   requires every canonical source.
// - Search: the build writes classic `assets/search-index.js` assigning
//   `window.WorkshopSearchIndex`; no fetch/module/worker anywhere.
// - Deterministic: same tree in, byte-identical out; no timestamps.
// Exit codes: 0 ok · 1 validation/build failure · 2 usage.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(HERE, "..", "..");
const FIXTURES = path.join(HERE, "fixtures", "site");

const CSP =
  "default-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; " +
  "img-src 'self' data:; font-src 'self'; connect-src 'none'; object-src 'none'; " +
  "base-uri 'none'; form-action 'none'; frame-src 'none'; worker-src 'none'";

function usage(msg) {
  console.error(`build-site: ${msg}`);
  console.error("usage: node toolkit/material-site/build-site.mjs [--clean] [--out <dir>] [--phase foundation|final]");
  process.exit(2);
}

function parseArgs(argv) {
  const opts = { clean: false, out: ".site", phase: "foundation" };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--clean") opts.clean = true;
    else if (a === "--out") opts.out = argv[++i] ?? usage("--out needs a value");
    else if (a === "--phase") opts.phase = argv[++i] ?? usage("--phase needs a value");
    else usage(`unknown option: ${a}`);
  }
  if (!["foundation", "final"].includes(opts.phase)) usage(`invalid phase: ${opts.phase}`);
  return opts;
}

const VISUAL_QUESTION_TYPES = [
  "key-concept",
  "process",
  "cycle",
  "structure",
  "relationship",
  "decision",
  "timeline",
  "quantitative-data",
];

// v3.4: every canonical teaching page declares its overview question,
// overview figure id and typed visual questions with an explicit coverage
// disposition — complex questions can never be closed as prose-only.
export function validateManifest(manifest) {
  const errors = [];
  if (manifest.schemaVersion !== 2) errors.push("manifest schemaVersion must be 2");
  const ids = new Set();
  const outputs = new Set();
  const orderKeys = new Set();
  for (const r of manifest.routes) {
    for (const field of ["id", "source", "output", "title", "owner"]) {
      if (typeof r[field] !== "string" || r[field].length === 0) errors.push(`${r.id ?? "?"}: missing ${field}`);
    }
    if (ids.has(r.id)) errors.push(`duplicate route id ${r.id}`);
    ids.add(r.id);
    if (outputs.has(r.output)) errors.push(`duplicate output ${r.output}`);
    outputs.add(r.output);
    if (!r.id.startsWith("/") || !r.id.endsWith("/")) errors.push(`route id must start and end with /: ${r.id}`);
    const key = `${r.parent}::${r.order}`;
    if (orderKeys.has(key)) errors.push(`duplicate (parent, order): ${key}`);
    orderKeys.add(key);
  }
  for (const r of manifest.routes) {
    if (r.parent !== null && !ids.has(r.parent)) errors.push(`${r.id}: parent ${r.parent} not in manifest`);
    if (typeof r.overviewQuestion !== "string" || r.overviewQuestion.length === 0) {
      errors.push(`${r.id}: missing overviewQuestion (v3.4 — every teaching page needs an overview)`);
      continue;
    }
    if (!/^fig-[a-z0-9-]+$/.test(r.overviewDiagramId ?? ""))
      errors.push(`${r.id}: missing or invalid overviewDiagramId`);
    if (!Array.isArray(r.overviewCovers) || r.overviewCovers.length !== 4)
      errors.push(`${r.id}: overviewCovers must contain the four big-picture categories`);
    if (!Array.isArray(r.visualQuestions)) {
      errors.push(`${r.id}: visualQuestions must be an array`);
      continue;
    }
    for (const v of r.visualQuestions) {
      const label = `${r.id}: question "${String(v.question ?? "?").slice(0, 48)}"`;
      if (typeof v.question !== "string" || v.question.length === 0) errors.push(`${r.id}: visual question without text`);
      if (!VISUAL_QUESTION_TYPES.includes(v.type)) errors.push(`${label}: invalid type "${v.type}"`);
      if (!Array.isArray(v.glossarySlugs) || v.glossarySlugs.length === 0)
        errors.push(`${label}: glossarySlugs must contain canonical glossary slugs`);
      if (!["page-local", "shared"].includes(v.coverage))
        errors.push(`${label}: undisposed — coverage must be page-local or shared; complex questions cannot stay prose-only`);
      if (!/^fig-[a-z0-9-]+$/.test(v.diagramId ?? "")) errors.push(`${label}: missing or invalid diagramId`);
    }
  }
  // Glossary search terms may be owned by exactly one canonical route.
  const glossaryOwners = manifest.routes.filter((r) => r.owner === "GLOSSARY");
  if (glossaryOwners.length === 0)
    errors.push("glossary ownership missing — no route with owner GLOSSARY to carry the shared search terms");
  if (glossaryOwners.length > 1)
    errors.push(`duplicate glossary ownership — ${glossaryOwners.length} routes claim owner GLOSSARY`);
  return errors;
}

function loadManifest() {
  const manifest = JSON.parse(fs.readFileSync(path.join(HERE, "site-manifest.json"), "utf8"));
  const errors = validateManifest(manifest);
  if (errors.length > 0) {
    for (const e of errors) console.error(`[manifest] ${e}`);
    process.exit(1);
  }
  return manifest;
}

// Accepted glossary v2 registry; foundation phase substitutes the neutral
// fixture registry until the GLOSSARY lane's file exists in the tree.
function loadGlossary(phase, substitutions, errors) {
  const canonical = path.join(REPO_ROOT, "materials", "fogalomtar", "glossary.json");
  let source = canonical;
  if (!fs.existsSync(canonical)) {
    if (phase === "final") {
      errors.push("materials/fogalomtar/glossary.json missing — final phase requires the accepted registry");
      return null;
    }
    source = path.join(FIXTURES, "glossary.json");
    if (!fs.existsSync(source)) {
      errors.push("foundation glossary fixture missing (fixtures/site/glossary.json)");
      return null;
    }
    substitutions.push("glossary registry <- fixtures/site/glossary.json");
  }
  let registry;
  try {
    registry = JSON.parse(fs.readFileSync(source, "utf8"));
  } catch (err) {
    errors.push(`${path.relative(REPO_ROOT, source)}: glossary registry is not valid JSON (${err.message})`);
    return null;
  }
  const label = path.relative(REPO_ROOT, source);
  if (registry.schemaVersion !== 2) {
    errors.push(`${label}: glossary schemaVersion must be 2 (got ${registry.schemaVersion})`);
    return null;
  }
  if (!Array.isArray(registry.terms)) {
    errors.push(`${label}: glossary registry has no terms[] array`);
    return null;
  }
  for (const t of registry.terms) {
    if (typeof t.slug !== "string" || t.slug.length === 0 || typeof t.preferred !== "string" || t.preferred.length === 0) {
      errors.push(`${label}: glossary term missing slug/preferred (${JSON.stringify(t).slice(0, 60)})`);
      return null;
    }
  }
  return registry;
}

// Neutral fixture shape for a route whose source is not yet authored.
function fixtureFor(route) {
  if (route.id === "/materials/fogalomtar/") return "glossary.html";
  if (route.id.startsWith("/toolkit/")) return "toolkit.html";
  if (route.id === "/participant-starter/") return "starter.html";
  if (route.id === "/reference-app/") return "reference.html";
  if (route.parent === "/materials/modulok/") return "deep.html";
  return "hub.html";
}

const hunMap = { á: "a", é: "e", í: "i", ó: "o", ö: "o", ő: "o", ú: "u", ü: "u", ű: "u" };
function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[áéíóöőúüű]/g, (c) => hunMap[c])
    .normalize("NFD")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 60) || "szakasz";
}

function stripTags(html) {
  return html.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
}

function escapeHtml(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

// Page-relative prefix from an output file back to the site root.
function rootPrefix(output) {
  const depth = output.split("/").length - 1;
  return depth === 0 ? "" : "../".repeat(depth);
}

function relHref(fromOutput, route) {
  const prefix = rootPrefix(fromOutput);
  return `${prefix}${route.output}`;
}

function buildNavModel(manifest) {
  const byId = new Map(manifest.routes.map((r) => [r.id, r]));
  const children = new Map();
  for (const r of manifest.routes) {
    if (r.parent === null) continue;
    if (!children.has(r.parent)) children.set(r.parent, []);
    children.get(r.parent).push(r);
  }
  for (const list of children.values()) list.sort((a, b) => a.order - b.order);
  const topLevel = manifest.routes.filter((r) => r.parent === "/").sort((a, b) => a.order - b.order);
  const modules = children.get("/materials/modulok/") ?? [];
  return { byId, children, topLevel, modules };
}

function ancestors(route, byId) {
  const chain = [];
  let cur = route;
  while (cur.parent !== null) {
    cur = byId.get(cur.parent);
    chain.unshift(cur);
  }
  return chain;
}

function renderShellTop(route, nav) {
  const p = (r) => relHref(route.output, r);
  const root = nav.byId.get("/");
  const trailIds = new Set([...ancestors(route, nav.byId), route].map((r) => r.id));

  const topLinks = [root, ...nav.topLevel]
    .map((r) => {
      const current = r.id === route.id ? ' aria-current="page"' : trailIds.has(r.id) ? ' class="trail"' : "";
      const label = r.id === "/" ? "Kezdőlap" : escapeHtml(shortTitle(r));
      return `<li><a href="${p(r)}"${current}>${label}</a></li>`;
    })
    .join("");

  const crumbs = [...ancestors(route, nav.byId), route]
    .map((r, i, arr) =>
      i === arr.length - 1
        ? `<li aria-current="page">${escapeHtml(shortTitle(r))}</li>`
        : `<li><a href="${p(r)}">${escapeHtml(shortTitle(r))}</a></li>`
    )
    .join("");

  const moduleIndex = nav.modules.findIndex((m) => m.id === route.id);
  const progress =
    moduleIndex >= 0
      ? `<p class="module-progress" aria-label="Haladás a modulokban">Modul ${moduleIndex + 1} / ${nav.modules.length}</p>`
      : "";

  return `
<a class="skip-link" href="#tartalom">Ugrás a tartalomhoz</a>
<header class="site-header">
  <nav class="site-nav" aria-label="Fő navigáció">
    <ul>${topLinks}</ul>
  </nav>
  <form class="site-search js-only" role="search" hidden>
    <label for="site-search-input">Keresés a tananyagban</label>
    <input id="site-search-input" type="search" autocomplete="off" placeholder="Keresés…">
    <ul id="site-search-results" class="search-results" hidden></ul>
  </form>
</header>
<nav class="breadcrumbs" aria-label="Elérési útvonal"><ol>${crumbs}</ol></nav>
${progress}
<div id="tartalom">`;
}

function shortTitle(route) {
  // Top-bar/breadcrumb labels: strip the "N. " module prefix for brevity.
  return route.title.replace(/^\d+\.\s*/, "");
}

function renderShellBottom(route, nav) {
  const p = (r) => relHref(route.output, r);
  const siblings = route.parent === null ? [] : nav.children.get(route.parent) ?? [];
  const idx = siblings.findIndex((s) => s.id === route.id);
  const prev = idx > 0 ? siblings[idx - 1] : null;
  const next = idx >= 0 && idx < siblings.length - 1 ? siblings[idx + 1] : null;
  const glossary = nav.byId.get("/materials/fogalomtar/");
  const moduleIndexRoute = nav.byId.get("/materials/modulok/");

  const pager =
    prev || next
      ? `<nav class="page-nav" aria-label="Előző és következő oldal">
${prev ? `  <a class="prev" href="${p(prev)}">← ${escapeHtml(prev.title)}</a>` : "  <span></span>"}
${next ? `  <a class="next" href="${p(next)}">${escapeHtml(next.title)} →</a>` : "  <span></span>"}
</nav>`
      : "";

  return `</div>
${pager}
<footer class="site-footer">
  <p><a href="${p(nav.byId.get("/"))}">Kezdőlap</a> · <a href="${p(glossary)}">Fogalomtár</a> · <a href="${p(moduleIndexRoute)}">Modulok</a></p>
  <p>AI-assisted fejlesztési workshop · offline is használható tananyag</p>
</footer>
<noscript><p class="noscript-note">A keresés JavaScript nélkül nem érhető el — használd a <a href="${p(glossary)}">fogalomtárat</a> és a <a href="${p(moduleIndexRoute)}">modul-listát</a>.</p></noscript>
<script defer src="${rootPrefix(route.output)}assets/search-index.js"></script>
<script defer src="${rootPrefix(route.output)}assets/site.js"></script>`;
}

// Inject shared head bits: exact CSP meta + shared stylesheet. The page's
// own inline <style> is preserved (style-src allows inline styles).
function injectHead(html, route) {
  let out = html;
  out = out.replace(/<meta[^>]+http-equiv\s*=\s*["']Content-Security-Policy["'][^>]*>\s*/gi, "");
  out = out.replace(/<link\b[^>]*\brel=["'][^"']*canonical[^"']*["'][^>]*>\s*/gi, "");
  const cspTag = `<meta http-equiv="Content-Security-Policy" content="${CSP}">`;
  const cssTag = `<link rel="stylesheet" href="${rootPrefix(route.output)}assets/site.css">`;
  const canonicalTag = `<link rel="canonical" href="index.html">`;
  if (/<meta charset=/i.test(out)) {
    out = out.replace(/(<meta charset=[^>]*>)/i, `$1\n${cspTag}\n${canonicalTag}\n${cssTag}`);
  } else {
    out = out.replace(/(<head[^>]*>)/i, `$1\n${cspTag}\n${canonicalTag}\n${cssTag}`);
  }
  return out;
}

// Give h2/h3 headings stable ids so search results can deep-link.
function ensureHeadingIds(html) {
  const used = new Set();
  return html.replace(/<h([23])(\s[^>]*)?>([\s\S]*?)<\/h\1>/gi, (match, level, attrs = "", inner) => {
    if (/\bid\s*=/i.test(attrs ?? "")) {
      const m = (attrs ?? "").match(/\bid\s*=\s*["']([^"']+)["']/i);
      if (m) used.add(m[1]);
      return match;
    }
    let id = slugify(stripTags(inner));
    let candidate = id;
    let n = 2;
    while (used.has(candidate)) candidate = `${id}-${n++}`;
    used.add(candidate);
    return `<h${level}${attrs ?? ""} id="${candidate}">${inner}</h${level}>`;
  });
}

function extractHeadings(html) {
  const headings = [];
  for (const m of html.matchAll(/<h([23])[^>]*\bid\s*=\s*["']([^"']+)["'][^>]*>([\s\S]*?)<\/h\1>/gi)) {
    headings.push({ t: stripTags(m[3]), a: m[2] });
  }
  return headings;
}

function copyFile(src, dest) {
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
}

function copyDirIfExists(srcDir, destDir) {
  if (!fs.existsSync(srcDir) || !fs.statSync(srcDir).isDirectory()) return;
  // Codepoint sort: locale-independent, deterministic on every machine.
  for (const entry of fs.readdirSync(srcDir, { withFileTypes: true }).sort((a, b) => (a.name < b.name ? -1 : 1))) {
    const s = path.join(srcDir, entry.name);
    const d = path.join(destDir, entry.name);
    if (entry.isDirectory()) copyDirIfExists(s, d);
    else copyFile(s, d);
  }
}

function selfTest() {
  const cases = [
    ["missing-overview.json", "missing overviewQuestion"],
    ["undisposed-question.json", "missing overviewQuestion"],
    ["invalid-ownership.json", "duplicate glossary ownership"],
    ["missing-ownership.json", "glossary ownership missing"],
  ];
  let ok = true;
  for (const [file, expected] of cases) {
    const fixture = JSON.parse(fs.readFileSync(path.join(FIXTURES, "manifests", file), "utf8"));
    const errors = validateManifest(fixture);
    if (!errors.some((e) => e.includes(expected))) {
      console.error(`[build-site] self-test FAILED: ${file} did not produce "${expected}" (got: ${errors.join(" | ") || "no errors"})`);
      ok = false;
    }
  }
  const real = JSON.parse(fs.readFileSync(path.join(HERE, "site-manifest.json"), "utf8"));
  if (validateManifest(real).length > 0) {
    console.error("[build-site] self-test FAILED: the shipped manifest does not validate cleanly");
    ok = false;
  }
  if (!ok) process.exit(1);
  console.log(`[build-site] self-test passed (${cases.length} invalid manifest fixtures rejected for the intended reason, shipped manifest clean)`);
  process.exit(0);
}

function main() {
  if (process.argv[2] === "--self-test") return selfTest();
  const opts = parseArgs(process.argv.slice(2));
  const manifest = loadManifest();
  const nav = buildNavModel(manifest);
  const outRoot = path.resolve(REPO_ROOT, opts.out);
  const errors = [];
  const substitutions = [];

  if (outRoot === REPO_ROOT || REPO_ROOT.startsWith(outRoot + path.sep)) {
    usage("--out must not be the repository root or an ancestor of it");
  }
  if (opts.clean && fs.existsSync(outRoot)) fs.rmSync(outRoot, { recursive: true, force: true });
  fs.mkdirSync(outRoot, { recursive: true });

  // 1. Assets (shared shell files are required; diagram.css optional).
  for (const rel of manifest.assets.required) {
    const src = path.join(REPO_ROOT, rel);
    if (!fs.existsSync(src)) {
      errors.push(`required asset missing: ${rel}`);
      continue;
    }
    copyFile(src, path.join(outRoot, rel));
  }
  for (const rel of manifest.assets.optional) {
    const src = path.join(REPO_ROOT, rel);
    if (fs.existsSync(src)) copyFile(src, path.join(outRoot, rel));
  }
  for (const rel of manifest.mediaRoots ?? []) {
    copyDirIfExists(path.join(REPO_ROOT, rel), path.join(outRoot, rel));
  }

  // 2. Routes.
  const searchEntries = [];
  const foundationCanonicalRoutes = new Set(["/", "/materials/fogalomtar/"]);
  for (const route of manifest.routes) {
    const srcPath = path.join(REPO_ROOT, route.source);
    let html;
    let usedFixture = false;
    if (opts.phase === "foundation" && !foundationCanonicalRoutes.has(route.id)) {
      const fixture = path.join(FIXTURES, fixtureFor(route));
      if (!fs.existsSync(fixture)) {
        errors.push(`${route.id}: foundation fixture ${path.basename(fixture)} not found`);
        continue;
      }
      html = fs.readFileSync(fixture, "utf8").replace(/<title>[^<]*<\/title>/i, `<title>${escapeHtml(route.title)}</title>`);
      substitutions.push(`${route.id} <- fixtures/site/${fixtureFor(route)}`);
      usedFixture = true;
    } else if (fs.existsSync(srcPath)) {
      html = fs.readFileSync(srcPath, "utf8");
    } else {
      errors.push(`${route.id}: canonical source missing (${route.source}) — ${opts.phase} phase requires this route`);
      continue;
    }

    if (!/(<body)(\s[^>]*)?>/i.test(html) || !/<\/body>/i.test(html)) {
      errors.push(`${route.id}: source has no <body>…</body> pair — shell cannot be injected`);
      continue;
    }
    html = ensureHeadingIds(html);
    // Content links reference routes by manifest ID (data-route="/materials/…/"
    // with optional #fragment); the build emits the page-relative href so
    // page sources never hand-calculate routes and never dangle in the repo.
    html = html.replace(/data-route="([^"#]+)(#[^"]*)?"/g, (m, routeId, fragment = "") => {
      const target = nav.byId.get(routeId);
      if (!target) {
        errors.push(`${route.id}: data-route target not in manifest: ${routeId}`);
        return m;
      }
      return `href="${relHref(route.output, target)}${fragment ?? ""}"`;
    });
    html = injectHead(html, route);
    html = html.replace(/(<body)(\s[^>]*)?>/i, (m, tag, attrs = "") => {
      const cleaned = (attrs ?? "").replace(/\sdata-site-root\s*=\s*["'][^"']*["']/i, "");
      return `${tag}${cleaned} data-site-root="${rootPrefix(route.output)}">${renderShellTop(route, nav)}`;
    });
    html = html.replace(/<\/body>/i, `${renderShellBottom(route, nav)}\n</body>`);

    const destPath = path.join(outRoot, route.output);
    fs.mkdirSync(path.dirname(destPath), { recursive: true });
    fs.writeFileSync(destPath, html.replace(/\r\n/g, "\n"));

    // Page-local media directory travels with its page.
    if (!usedFixture) {
      copyDirIfExists(path.join(path.dirname(srcPath), "media"), path.join(path.dirname(destPath), "media"));
      // Canonical support pages may own small, CSP-safe local CSS/JS files.
      // Copy only explicitly referenced sibling files; teaching routes and
      // downloads remain controlled by the manifest.
      for (const match of html.matchAll(/(?:href|src)=["']([^"']+\.(?:css|js))["']/gi)) {
        const reference = match[1];
        if (/^(?:[a-z]+:|\/|\.\.\/)/i.test(reference)) continue;
        const localSource = path.resolve(path.dirname(srcPath), reference);
        const sourceDir = path.resolve(path.dirname(srcPath));
        if (!localSource.startsWith(`${sourceDir}${path.sep}`) || !fs.existsSync(localSource)) continue;
        copyFile(localSource, path.resolve(path.dirname(destPath), reference));
      }
    }

    const titleMatch = html.match(/<title>([^<]*)<\/title>/i);
    searchEntries.push({
      path: route.output,
      title: titleMatch ? titleMatch[1].trim() : route.title,
      headings: extractHeadings(html),
    });
  }

  // 3. Downloads: exact allowlisted files only, mirrored under downloads/.
  for (const rel of manifest.downloads) {
    const src = path.join(REPO_ROOT, rel);
    if (!fs.existsSync(src)) {
      errors.push(`download allowlisted but missing: ${rel}`);
      continue;
    }
    copyFile(src, path.join(outRoot, "downloads", rel));
  }

  // 4. Search index (classic script, immutable assignment, no fetch).
  // Glossary terms are emitted ONLY on the canonical GLOSSARY-owned route:
  // preferred Hungarian term, retained English term and aliases all resolve
  // to that single route with the term slug as the exact anchor.
  const glossaryRegistry = loadGlossary(opts.phase, substitutions, errors);
  const glossaryRoute = manifest.routes.find((r) => r.owner === "GLOSSARY");
  const glossaryBlock =
    glossaryRegistry && glossaryRoute
      ? {
          path: glossaryRoute.output,
          terms: glossaryRegistry.terms.map((t) => ({
            slug: t.slug,
            preferred: t.preferred,
            english: t.english,
            aliases: Array.isArray(t.aliases) ? t.aliases : [],
          })),
        }
      : null;
  const indexBody = JSON.stringify({ pages: searchEntries, glossary: glossaryBlock }, null, 1);
  fs.writeFileSync(
    path.join(outRoot, "assets", "search-index.js"),
    `// Generated by build-site.mjs — do not edit.\nwindow.WorkshopSearchIndex = Object.freeze(${indexBody});\n`
  );

  if (errors.length > 0) {
    for (const e of errors) console.error(`[build-site] ${e}`);
    process.exit(1);
  }
  console.log(
    `[build-site] ${opts.phase} build OK: ${manifest.routes.length} routes (${substitutions.length} fixture substitutions), ` +
      `${manifest.downloads.length} downloads -> ${path.relative(REPO_ROOT, outRoot) || outRoot}`
  );
  for (const s of substitutions) console.log(`[build-site]   substituted ${s}`);
}

// CLI entry point only when executed directly — importing validateManifest
// must not trigger a build.
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main();
}
