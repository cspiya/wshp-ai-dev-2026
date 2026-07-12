#!/usr/bin/env node
// Structural check for the teaching notebooks: standalone, renderable HTML.
// Default scope: tracked materials/notebooks/*.html; pass explicit paths to
// override (fixture testing).
import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";

function trackedNotebooks() {
  const out = execFileSync("git", ["ls-files", "materials/notebooks"], { encoding: "utf8" });
  return out.split("\n").filter((f) => f.endsWith(".html"));
}

const files = process.argv.length > 2 ? process.argv.slice(2) : trackedNotebooks();
let failed = false;

const fail = (file, message) => {
  console.error(`[notebooks] ${file}: ${message}`);
  failed = true;
};

for (const file of files) {
  const contents = await readFile(file, "utf8");

  if (!/^\s*<!doctype html/i.test(contents)) fail(file, "missing <!doctype html> at the top");
  if (!/<title>[^<]+<\/title>/i.test(contents)) fail(file, "missing or empty <title>");
  if (!/<\/html>\s*$/i.test(contents)) fail(file, "missing closing </html>");
  // Self-contained rule: no external scripts/styles — offline rendering must work.
  if (/<script[^>]+src\s*=\s*["'](?:https?:)?\/\//i.test(contents))
    fail(file, "external <script src> breaks the self-contained rule");
  if (/<link[^>]+href\s*=\s*["'](?:https?:)?\/\/[^"']+\.css/i.test(contents))
    fail(file, "external stylesheet breaks the self-contained rule");
}

if (failed) process.exit(1);
console.log(`[notebooks] passed ${files.length} file(s)`);
