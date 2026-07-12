#!/usr/bin/env node
// Structural check for the teaching notebooks: standalone, renderable HTML.
// Default scope: tracked materials/notebooks/*.html; pass explicit paths to
// override (fixture testing).
//
// Extended notebook checks:
// - Shell assertions for pages that opted into the shared shell (contain
//   `<main`): module navigation present (skeleton files prefixed with `_`
//   are exempt) and no visible content after `</main>`.
// - SVG accessibility contract (all files): every inline `<svg>` needs
//   role="img", aria-labelledby pointing at its own <title id>/<desc id>,
//   and the document needs at least one static-fallback element per SVG
//   (materials/notebooks/visual-contract.md).
// - `--strict-shell`: the end-state contract — every non-skeleton notebook
//   must carry the shared shell (<main>, module nav, C0–C7 checkpoint strip
//   via aria-current="step"). Phases in as Wave-2 converts modules 04–07;
//   not yet part of the default CI gate.
// - `--self-test`: proves each assertion fails on a violating fixture.
import { execFileSync, spawnSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, join } from "node:path";
import { fileURLToPath } from "node:url";

function trackedNotebooks() {
  const out = execFileSync("git", ["ls-files", "materials/notebooks"], { encoding: "utf8" });
  return out
    .split("\n")
    .filter((f) => f.endsWith(".html"))
    .filter((f) => !/(^|\/)fixtures\//.test(f)); // negative fixtures violate on purpose
}

const rawArgs = process.argv.slice(2);
const strictShell = rawArgs.includes("--strict-shell");
const selfTest = rawArgs[0] === "--self-test";
const fileArgs = rawArgs.filter((a) => !a.startsWith("--"));
const unknownFlags = rawArgs.filter(
  (a) => a.startsWith("--") && !["--strict-shell", "--self-test"].includes(a)
);
if (unknownFlags.length > 0 || (rawArgs.includes("--self-test") && !selfTest)) {
  console.error(`[notebooks] unrecognized or misplaced flag(s): ${unknownFlags.join(" ") || "--self-test must be the first argument"}`);
  process.exit(2);
}

function checkFile(file, contents, { strict }) {
  const problems = [];
  const fail = (message) => problems.push(message);

  if (!/^\s*<!doctype html/i.test(contents)) fail("missing <!doctype html> at the top");
  if (!/<title>[^<]+<\/title>/i.test(contents)) fail("missing or empty <title>");
  if (!/<\/html>\s*$/i.test(contents)) fail("missing closing </html>");
  // Self-contained rule: no external scripts/styles — offline rendering must work.
  if (/<script[^>]+src\s*=\s*["'](?:https?:)?\/\//i.test(contents))
    fail("external <script src> breaks the self-contained rule");
  if (/<link[^>]+href\s*=\s*["'](?:https?:)?\/\/[^"']+\.css/i.test(contents))
    fail("external stylesheet breaks the self-contained rule");

  const isSkeleton = basename(file).startsWith("_");
  const hasMain = /<main\b/i.test(contents);

  // Shared-shell assertions for pages that opted in.
  if (hasMain) {
    const mainClose = contents.toLowerCase().lastIndexOf("</main>");
    if (mainClose === -1) {
      fail("<main> is never closed");
    } else {
      const visibleAfterMain = contents
        .slice(mainClose + 7)
        .replace(/<script[\s\S]*?<\/script>/gi, "")
        .replace(/<[^>]*>/g, "")
        .trim();
      if (visibleAfterMain.length > 0)
        fail(`visible content after </main> (invisible to shell/TOC): "${visibleAfterMain.slice(0, 60)}"`);
    }
    if (!isSkeleton && !/module-nav/.test(contents))
      fail("shared-shell page without module navigation (module-nav)");
  }

  // End-state shell contract (Wave-2 target), opt-in via --strict-shell.
  if (strict && !isSkeleton) {
    if (!hasMain) fail("[strict-shell] notebook does not use the shared shell (<main>)");
    if (!/module-nav/.test(contents)) fail("[strict-shell] missing module navigation");
    if (!/aria-current\s*=\s*["']step["']/i.test(contents))
      fail("[strict-shell] missing C0–C7 checkpoint strip (aria-current=\"step\")");
  }

  // SVG accessibility contract — strict from day one (baseline has no SVGs).
  const svgBlocks = contents.match(/<svg[\s\S]*?<\/svg>/gi) ?? [];
  for (const [i, svg] of svgBlocks.entries()) {
    const label = `svg #${i + 1}`;
    if (!/role\s*=\s*["']img["']/i.test(svg)) fail(`${label}: missing role="img"`);
    const labelledBy = svg.match(/aria-labelledby\s*=\s*["']([^"']+)["']/i);
    if (!labelledBy) {
      fail(`${label}: missing aria-labelledby`);
    } else {
      for (const id of labelledBy[1].trim().split(/\s+/)) {
        const escaped = id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        if (!new RegExp(`<(?:title|desc)[^>]*id\\s*=\\s*["']${escaped}["']`, "i").test(svg))
          fail(`${label}: aria-labelledby id "${id}" has no matching <title>/<desc> in the svg`);
      }
      if (!/<title[^>]*id\s*=/i.test(svg)) fail(`${label}: missing <title id>`);
      if (!/<desc[^>]*id\s*=/i.test(svg)) fail(`${label}: missing <desc id>`);
    }
  }
  if (svgBlocks.length > 0) {
    // Count class attributes, not raw substrings — a CSS rule defining
    // .static-fallback must not satisfy the contract.
    const fallbacks = (contents.match(/class\s*=\s*["'][^"']*\bstatic-fallback\b/g) ?? []).length;
    if (fallbacks < svgBlocks.length)
      fail(
        `${svgBlocks.length} svg(s) but only ${fallbacks} static-fallback element(s) — every diagram needs its full static equivalent`
      );
  }

  return problems;
}

if (selfTest) {
  const self = fileURLToPath(import.meta.url);
  const dir = mkdtempSync(join(tmpdir(), "check-notebooks-"));
  const cases = [
    ["no-doctype.html", "<html><head><title>x</title></head><body></body></html>", [], 1],
    [
      "after-main.html",
      "<!doctype html><html><head><title>x</title></head><body><main class=\"main\"><nav class=\"module-nav\"></nav></main><p>orphan content</p></body></html>",
      [],
      1,
    ],
    [
      "no-nav.html",
      "<!doctype html><html><head><title>x</title></head><body><main class=\"main\">t</main></body></html>",
      [],
      1,
    ],
    [
      "bad-svg.html",
      "<!doctype html><html><head><title>x</title></head><body><svg viewBox=\"0 0 1 1\"></svg></body></html>",
      [],
      1,
    ],
    [
      "strict-bare.html",
      "<!doctype html><html><head><title>x</title></head><body><p>bare page</p></body></html>",
      ["--strict-shell"],
      1,
    ],
    [
      "good.html",
      "<!doctype html><html><head><title>x</title></head><body><main class=\"main\"><nav class=\"module-nav\"></nav><svg role=\"img\" aria-labelledby=\"t1 d1\" viewBox=\"0 0 1 1\"><title id=\"t1\">t</title><desc id=\"d1\">d</desc></svg><table class=\"static-fallback\"></table></main></body></html>",
      [],
      0,
    ],
  ];
  let ok = true;
  for (const [name, content, extraArgs, expected] of cases) {
    const p = join(dir, name);
    writeFileSync(p, content);
    const args = extraArgs.includes("--strict-shell") ? ["--strict-shell", p] : [p];
    const r = spawnSync(process.execPath, [self, ...args], { stdio: "ignore" });
    if (r.status !== expected) {
      console.error(`[notebooks] self-test FAILED: ${name} exited ${r.status}, expected ${expected}`);
      ok = false;
    }
  }
  rmSync(dir, { recursive: true, force: true });
  if (!ok) process.exit(1);
  console.log(`[notebooks] self-test passed (${cases.length} fixtures behaved as intended)`);
  process.exit(0);
}

const files = fileArgs.length > 0 ? fileArgs : trackedNotebooks();
let failed = false;

for (const file of files) {
  const contents = await readFile(file, "utf8");
  for (const message of checkFile(file, contents, { strict: strictShell })) {
    console.error(`[notebooks] ${file}: ${message}`);
    failed = true;
  }
}

if (failed) process.exit(1);
console.log(`[notebooks] passed ${files.length} file(s)${strictShell ? " (strict shell)" : ""}`);
