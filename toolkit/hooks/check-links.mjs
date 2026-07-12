#!/usr/bin/env node
// Internal-link validity: every relative href/src in tracked .md/.html files
// must point at an existing file. External URLs, anchors, mailto: and data:
// are out of scope. Pass explicit paths to override (fixture testing).
//
// Extended publication checks:
// - Directory-target links must have a landing page (README.md or
//   index.html) inside the target directory — the published site 404s on
//   bare directories (journal-landing class of defects).
// - `.md` links inside `.html` files are reported as raw-Markdown-routing
//   warnings (the published site serves them as raw text/markdown);
//   `--strict-md-routing` turns them into failures once rendered routes
//   exist. Markdown-to-markdown links stay fine (GitHub renders them).
// - `--publication-smoke [baseUrl]`: probes the published site's key routes
//   and RECORDS url, HTTP status and content-type. Fails only on transport
//   errors — published content tracks `main`, not the working branch.
// - `--self-test`: proves each failing mode fails on a violating fixture.
import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, statSync, mkdtempSync, writeFileSync, mkdirSync, rmSync, readFileSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, resolve, join } from "node:path";
import { fileURLToPath } from "node:url";

const DEFAULT_PUBLICATION_BASE = "https://cspiya.github.io/wshp-ai-dev-2026";
const PUBLICATION_ROUTES = [
  "/",
  "/materials/notebooks/00-bevezeto.html",
  "/materials/fogalomtar.md",
  "/materials/big-picture.md",
  "/materials/epitesi-naplo/",
];

function trackedFiles() {
  const out = execFileSync("git", ["ls-files"], { encoding: "utf8" });
  return out
    .split("\n")
    .filter((f) => /\.(html|md)$/.test(f))
    // Negative fixtures violate on purpose — any fixtures/ directory,
    // including all material-QA fixture directories.
    .filter((f) => !/(^|\/)fixtures\//.test(f));
}

const linkPatterns = [
  /href\s*=\s*["']([^"']+)["']/gi, // HTML links
  /src\s*=\s*["']([^"']+)["']/gi, // HTML embeds
  /\]\(([^)\s]+)\)/g, // Markdown links/images
];

const isExternal = (target) =>
  /^(?:[a-z][a-z0-9+.-]*:|\/\/|#)/i.test(target) || target.startsWith("/");

const rawArgs = process.argv.slice(2);

if (rawArgs[0] === "--publication-smoke") {
  const base = (rawArgs[1] ?? DEFAULT_PUBLICATION_BASE).replace(/\/$/, "");
  let transportFailure = false;
  console.log(`[links] publication smoke against ${base}`);
  for (const route of PUBLICATION_ROUTES) {
    try {
      const res = await fetch(base + route, { method: "HEAD", redirect: "follow" });
      console.log(
        `[links][smoke] ${res.status} ${res.headers.get("content-type") ?? "-"} ${base}${route}`
      );
    } catch (err) {
      console.error(`[links][smoke] TRANSPORT FAILURE ${base}${route}: ${err.message}`);
      transportFailure = true;
    }
  }
  process.exit(transportFailure ? 1 : 0);
}

const strictMdRouting = rawArgs.includes("--strict-md-routing");
const selfTest = rawArgs[0] === "--self-test";
const fileArgs = rawArgs.filter((a) => !a.startsWith("--"));
const plannedCanonicalTargets = new Set();
if (fileArgs.length === 0 && existsSync("toolkit/material-site/site-manifest.json")) {
  try {
    const manifest = JSON.parse(readFileSync("toolkit/material-site/site-manifest.json", "utf8"));
    for (const route of manifest.routes ?? []) {
      if (typeof route.source === "string") plannedCanonicalTargets.add(resolve(route.source).toLowerCase());
    }
  } catch {
    // The dedicated manifest validator reports malformed input. This legacy
    // migration checker simply falls back to existence-only behavior.
  }
}
const unknownFlags = rawArgs.filter(
  (a) => a.startsWith("--") && !["--strict-md-routing", "--self-test", "--publication-smoke"].includes(a)
);
if (
  unknownFlags.length > 0 ||
  (rawArgs.includes("--self-test") && !selfTest) ||
  rawArgs.includes("--publication-smoke") // reachable only when not argv[0]
) {
  console.error(
    `[links] unrecognized or misplaced flag(s): ${unknownFlags.join(" ") || "--self-test/--publication-smoke must be the first argument"}`
  );
  process.exit(2);
}

function checkFile(file, contents, { strictMd }) {
  const failures = [];
  const warnings = [];
  for (const pattern of linkPatterns) {
    for (const match of contents.matchAll(pattern)) {
      const raw = match[1];
      if (isExternal(raw)) continue;
      const target = raw.split("#")[0].split("?")[0];
      if (!target) continue;
      const line = contents.slice(0, match.index).split("\n").length;
      const resolved = resolve(dirname(file), decodeURIComponent(target));
      if (!existsSync(resolved)) {
        // During the HTML migration, glossary and foundation pages may link
        // to a canonical route whose authored source belongs to a later,
        // explicitly manifested content lane. The final site validator still
        // requires every source/output; this legacy checker must not call an
        // approved planned route a broken arbitrary link.
        if (plannedCanonicalTargets.has(resolved.toLowerCase())) continue;
        failures.push(`${file}:${line}: broken internal link "${raw}"`);
        continue;
      }
      if (statSync(resolved).isDirectory()) {
        const hasLanding =
          existsSync(join(resolved, "README.md")) || existsSync(join(resolved, "index.html"));
        if (!hasLanding)
          failures.push(
            `${file}:${line}: directory link "${raw}" has no landing page (README.md or index.html) — 404s when published`
          );
        continue;
      }
      if (file.endsWith(".html") && /\.md$/i.test(target)) {
        const message = `${file}:${line}: "${raw}" links a raw Markdown file from HTML — served as text/markdown on the published site`;
        if (strictMd) failures.push(message);
        else warnings.push(message);
      }
    }
  }
  return { failures, warnings };
}

if (selfTest) {
  const self = fileURLToPath(import.meta.url);
  const dir = mkdtempSync(join(tmpdir(), "check-links-"));
  mkdirSync(join(dir, "empty-dir"));
  mkdirSync(join(dir, "landed-dir"));
  writeFileSync(join(dir, "landed-dir", "README.md"), "landing\n");
  writeFileSync(join(dir, "target.md"), "target\n");
  const cases = [
    ["broken.md", "[x](missing-file.md)\n", [], 1],
    ["dir-no-landing.md", "[journal](empty-dir/)\n", [], 1],
    ["dir-landed.md", "[journal](landed-dir/)\n", [], 0],
    ["md-from-html.html", '<a href="target.md">t</a>\n', [], 0], // warning only
    ["md-from-html-strict.html", '<a href="target.md">t</a>\n', ["--strict-md-routing"], 1],
  ];
  let ok = true;
  for (const [name, content, extra, expected] of cases) {
    const p = join(dir, name);
    writeFileSync(p, content);
    const r = spawnSync(process.execPath, [self, ...extra, p], { stdio: "ignore" });
    if (r.status !== expected) {
      console.error(`[links] self-test FAILED: ${name} exited ${r.status}, expected ${expected}`);
      ok = false;
    }
  }
  rmSync(dir, { recursive: true, force: true });
  if (!ok) process.exit(1);
  console.log(`[links] self-test passed (${cases.length} fixtures behaved as intended)`);
  process.exit(0);
}

const files = fileArgs.length > 0 ? fileArgs : trackedFiles();
let failed = false;
let warningCount = 0;

for (const file of files) {
  const contents = await readFile(file, "utf8");
  const { failures, warnings } = checkFile(file, contents, { strictMd: strictMdRouting });
  for (const f of failures) {
    console.error(`[links] ${f}`);
    failed = true;
  }
  for (const w of warnings) {
    console.warn(`[links][md-routing] ${w}`);
    warningCount += 1;
  }
}

if (failed) process.exit(1);
console.log(
  `[links] passed ${files.length} file(s)` +
    (warningCount > 0 ? ` with ${warningCount} raw-Markdown-routing warning(s)` : "")
);
