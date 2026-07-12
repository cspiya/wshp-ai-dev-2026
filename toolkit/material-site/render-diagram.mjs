#!/usr/bin/env node
// Deterministic diagram pipeline (WEN-257, DIAGRAM-TOOLS lane).
//
//   node toolkit/material-site/render-diagram.mjs render <page-dir>
//   node toolkit/material-site/render-diagram.mjs check <page-dir>
//   node toolkit/material-site/render-diagram.mjs check-page <file.html>
//   node toolkit/material-site/render-diagram.mjs --self-test
//
// <page-dir>/media/diagrams.json is the page-local manifest. Authors write
// id, learnerQuestion, source, output and fallbackSelector; `render` fills
// sourceHash (SHA-256 over normalized .mmd + canonical config JSON + exact
// CLI version), outputHash (SHA-256 of normalized SVG bytes) and
// cliVersion. `check` re-derives both hashes and fails on any drift
// (stale source, stale output, tampered SVG) and on any security
// violation. `check-page` enforces the <img> embedding contract: alt text,
// intrinsic width/height, enclosing <figure> with <figcaption>.
//
// Security: both .mmd sources and .svg outputs reject <script>, event
// handlers, foreignObject, and external URL/font/resource references.
// No runtime Mermaid exists anywhere; SVG is rendered at build time only.
//
// Exit codes: 0 ok · 1 violation/stale/render failure · 2 usage.

import { createRequire } from "node:module";
import { spawnSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { normalizeSvg } from "./normalize-svg.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const CONFIG_PATH = path.join(HERE, "mermaid.config.json");

let cachedCliVersion;
function cliVersion() {
  // Read from the lockfile: exports-map independent and exactly what the
  // determinism contract pins.
  if (!cachedCliVersion) {
    const lock = JSON.parse(fs.readFileSync(path.join(HERE, "package-lock.json"), "utf8"));
    cachedCliVersion = lock.packages?.["node_modules/@mermaid-js/mermaid-cli"]?.version;
    if (!cachedCliVersion) throw new Error("mermaid-cli version not found in package-lock.json — run npm install");
  }
  return cachedCliVersion;
}

function sha256(text) {
  return crypto.createHash("sha256").update(text).digest("hex");
}

function canonicalJson(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (value !== null && typeof value === "object") {
    return `{${Object.keys(value)
      .sort()
      .map((k) => `${JSON.stringify(k)}:${canonicalJson(value[k])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

const SECURITY_RULES = [
  ["script element", /<script\b/i],
  ["event handler attribute", /\son[a-z]+\s*=/i],
  ["foreignObject element", /<foreignObject\b/i],
  ["external URL reference", /(?:href|src|xlink:href)\s*=\s*["'](?:(?:https?:)?\/\/|javascript:)/i],
  ["external CSS/font reference", /@import\b|url\(\s*["']?(?:https?:)?\/\//i],
  ["data:text/html payload", /data:text\/html/i],
];

export function securityScan(label, text) {
  const hits = [];
  for (const [name, pattern] of SECURITY_RULES) {
    if (pattern.test(text)) hits.push(`${label}: forbidden ${name}`);
  }
  return hits;
}

function loadPageManifest(pageDir) {
  const manifestPath = path.join(pageDir, "media", "diagrams.json");
  if (!fs.existsSync(manifestPath)) {
    throw new Error(`no media/diagrams.json under ${pageDir}`);
  }
  const entries = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  for (const e of entries) {
    for (const field of ["id", "learnerQuestion", "source", "output", "fallbackSelector"]) {
      if (typeof e[field] !== "string" || e[field].length === 0) {
        throw new Error(`diagrams.json entry ${e.id ?? "?"}: missing required field "${field}"`);
      }
    }
    // Paths reach a shell on Windows (.cmd shim): keep them boring.
    for (const field of ["source", "output"]) {
      if (!/^[\w./-]+$/.test(e[field])) {
        throw new Error(`diagrams.json entry ${e.id}: ${field} contains characters outside [\\w./-]: ${e[field]}`);
      }
    }
  }
  return { manifestPath, entries };
}

function combinedSourceHash(mmdNormalized) {
  const config = JSON.parse(fs.readFileSync(CONFIG_PATH, "utf8"));
  return sha256(`${mmdNormalized}\n${canonicalJson(config)}\n${cliVersion()}`);
}

function renderOne(pageDir, entry) {
  const src = path.join(pageDir, entry.source);
  const out = path.join(pageDir, entry.output);
  // Invoke the lockfile-pinned local binary directly (equivalent to the
  // spec's `npm --prefix toolkit/material-site exec mmdc -- …` form, which
  // current npm rejects when --prefix and exec are combined this way).
  const bin = path.join(HERE, "node_modules", ".bin", process.platform === "win32" ? "mmdc.cmd" : "mmdc");
  if (!fs.existsSync(bin)) throw new Error("mmdc not installed — run: npm --prefix toolkit/material-site install");
  const result = spawnSync(bin, ["-c", CONFIG_PATH, "-i", src, "-o", out, "--quiet"], {
    encoding: "utf8",
    shell: process.platform === "win32",
  });
  if (result.status !== 0) {
    throw new Error(`mmdc failed for ${entry.id}: ${(result.stderr || result.stdout || "").trim().slice(0, 400)}`);
  }
  fs.writeFileSync(out, normalizeSvg(fs.readFileSync(out, "utf8")));
}

function processPage(mode, pageDir) {
  const { manifestPath, entries } = loadPageManifest(pageDir);
  const problems = [];
  for (const entry of entries) {
    const srcPath = path.join(pageDir, entry.source);
    const outPath = path.join(pageDir, entry.output);
    if (!fs.existsSync(srcPath)) {
      problems.push(`${entry.id}: source missing (${entry.source})`);
      continue;
    }
    const mmdNormalized = fs.readFileSync(srcPath, "utf8").replace(/\r\n/g, "\n");
    const sourceProblems = securityScan(`${entry.id} source`, mmdNormalized);
    problems.push(...sourceProblems);

    if (mode === "render") {
      if (sourceProblems.length > 0) continue; // never render a flagged source
      renderOne(pageDir, entry);
    }
    if (!fs.existsSync(outPath)) {
      problems.push(`${entry.id}: output missing (${entry.output})`);
      continue;
    }
    const svg = fs.readFileSync(outPath, "utf8");
    const svgNormalized = normalizeSvg(svg);
    if (svg !== svgNormalized) problems.push(`${entry.id}: output is not normalized (run normalize-svg)`);
    problems.push(...securityScan(`${entry.id} output`, svgNormalized));

    const srcHash = combinedSourceHash(mmdNormalized);
    const outHash = sha256(svgNormalized);
    if (mode === "render") {
      entry.sourceHash = srcHash;
      entry.outputHash = outHash;
      entry.cliVersion = cliVersion();
    } else {
      if (entry.sourceHash !== srcHash)
        problems.push(`${entry.id}: STALE — source/config/CLI changed since last render (recorded ${String(entry.sourceHash).slice(0, 12)}…, actual ${srcHash.slice(0, 12)}…)`);
      if (entry.outputHash !== outHash)
        problems.push(`${entry.id}: STALE — output bytes differ from the recorded render (recorded ${String(entry.outputHash).slice(0, 12)}…, actual ${outHash.slice(0, 12)}…)`);
      if (entry.cliVersion !== cliVersion())
        problems.push(`${entry.id}: CLI version drift (recorded ${entry.cliVersion}, installed ${cliVersion()})`);
    }
  }
  if (mode === "render" && problems.length === 0) {
    fs.writeFileSync(manifestPath, JSON.stringify(entries, null, 2) + "\n");
  }
  return problems;
}

// <img> embedding contract for external Mermaid SVGs on a page.
export function checkPageHtml(html, file) {
  const problems = [];
  for (const m of html.matchAll(/<img\b[^>]*>/gi)) {
    const tag = m[0];
    const src = tag.match(/src\s*=\s*["']([^"']+)["']/i)?.[1] ?? "";
    if (!/\.svg(\?|#|$)/i.test(src)) continue;
    const label = `${file}: <img src="${src}">`;
    const alt = tag.match(/alt\s*=\s*["']([^"']*)["']/i);
    if (!alt || alt[1].trim().length === 0) problems.push(`${label}: missing or empty alt text`);
    if (!/\bwidth\s*=\s*["']\d+["']/i.test(tag) || !/\bheight\s*=\s*["']\d+["']/i.test(tag))
      problems.push(`${label}: missing intrinsic width/height`);
    // Depth-counted, case-insensitive figure containment (handles nesting).
    const lower = html.toLowerCase();
    let depth = 0;
    let figureOpen = -1;
    for (const t of lower.slice(0, m.index).matchAll(/<figure\b|<\/figure>/g)) {
      if (t[0] === "</figure>") depth = Math.max(0, depth - 1);
      else {
        depth += 1;
        figureOpen = t.index;
      }
    }
    const figureClose = lower.indexOf("</figure>", m.index);
    if (depth === 0 || figureClose === -1)
      problems.push(`${label}: not inside a <figure>`);
    else if (!/<figcaption\b/i.test(html.slice(figureOpen, figureClose)))
      problems.push(`${label}: enclosing <figure> has no <figcaption>`);
  }
  return problems;
}

function selfTest() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "render-diagram-"));
  let ok = true;
  const expect = (name, condition) => {
    if (!condition) {
      console.error(`[render-diagram] self-test FAILED: ${name}`);
      ok = false;
    }
  };

  // 1. Unsafe SVG content is rejected for every rule class.
  const unsafe = `<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script>` +
    `<g onclick="x()"><foreignObject></foreignObject></g>` +
    `<image href="https://example.invalid/x.png"/><style>@import "https://x/y.css";</style></svg>`;
  expect("unsafe svg detected (5 rules)", securityScan("t", unsafe).length >= 5);
  expect("clean svg passes", securityScan("t", `<svg xmlns="http://www.w3.org/2000/svg"><rect/></svg>`).length === 0);

  // 2. Stale detection: record hashes, then tamper source and output.
  const pageDir = path.join(dir, "page");
  fs.mkdirSync(path.join(pageDir, "media"), { recursive: true });
  fs.writeFileSync(path.join(pageDir, "media", "d.mmd"), "flowchart LR\n  a --> b\n");
  fs.writeFileSync(path.join(pageDir, "media", "d.svg"), `<svg xmlns="http://www.w3.org/2000/svg"><rect/></svg>`);
  const entry = {
    id: "d",
    learnerQuestion: "test question",
    source: "media/d.mmd",
    output: "media/d.svg",
    fallbackSelector: "#d-fallback",
    sourceHash: combinedSourceHash("flowchart LR\n  a --> b\n"),
    outputHash: sha256(`<svg xmlns="http://www.w3.org/2000/svg"><rect/></svg>`),
    cliVersion: cliVersion(),
  };
  fs.writeFileSync(path.join(pageDir, "media", "diagrams.json"), JSON.stringify([entry], null, 2));
  expect("fresh page passes check", processPage("check", pageDir).length === 0);
  fs.appendFileSync(path.join(pageDir, "media", "d.mmd"), "  b --> c\n");
  const stale = processPage("check", pageDir);
  expect("tampered source flagged STALE", stale.some((p) => p.includes("STALE — source")));
  fs.writeFileSync(path.join(pageDir, "media", "d.svg"), `<svg xmlns="http://www.w3.org/2000/svg"><circle/></svg>`);
  expect("tampered output flagged STALE", processPage("check", pageDir).some((p) => p.includes("STALE — output")));

  // 3. Page embedding contract: missing alt / dimensions / figure fail.
  const badPage = `<figure><img src="media/d.svg" width="800" height="400"></figure>`;
  expect("missing alt detected", checkPageHtml(badPage, "bad.html").some((p) => p.includes("alt")));
  const noDims = `<figure><img src="media/d.svg" alt="leírás"><figcaption>x</figcaption></figure>`;
  expect("missing dimensions detected", checkPageHtml(noDims, "bad.html").some((p) => p.includes("width/height")));
  const bare = `<p><img src="media/d.svg" alt="leírás" width="800" height="400"></p>`;
  expect("img outside figure detected", checkPageHtml(bare, "bad.html").some((p) => p.includes("<figure>")));
  const good = `<figure><img src="media/d.svg" alt="leírás" width="800" height="400"><figcaption>x</figcaption></figure>`;
  expect("compliant embedding passes", checkPageHtml(good, "good.html").length === 0);

  fs.rmSync(dir, { recursive: true, force: true });
  if (!ok) process.exit(1);
  console.log("[render-diagram] self-test passed (unsafe, stale source/output, alt/dimensions/figure fixtures behaved as intended)");
  process.exit(0);
}

export function main() {
  const [mode, target] = process.argv.slice(2);
  if (mode === "--self-test") return selfTest();
  if (!mode || !["render", "check", "check-page"].includes(mode) || (!target && mode !== "--self-test")) {
    console.error("usage: node toolkit/material-site/render-diagram.mjs <render|check|check-page> <page-dir|file.html> | --self-test");
    process.exit(2);
  }
  let problems;
  try {
    if (mode === "check-page") {
      problems = checkPageHtml(fs.readFileSync(target, "utf8"), target);
    } else {
      problems = processPage(mode, path.resolve(target));
    }
  } catch (err) {
    console.error(`[render-diagram] ${err.message}`);
    process.exit(1);
  }
  if (problems.length > 0) {
    for (const p of problems) console.error(`[render-diagram] ${p}`);
    process.exit(1);
  }
  console.log(`[render-diagram] ${mode} OK (${target})`);
}

// CLI entry point only when executed directly — importing the exported
// helpers (securityScan, checkPageHtml) must not trigger argument parsing.
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main();
}
