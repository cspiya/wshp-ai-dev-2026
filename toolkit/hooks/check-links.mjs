#!/usr/bin/env node
// Internal-link validity: every relative href/src in tracked .md/.html files
// must point at an existing file. External URLs, anchors, mailto: and data:
// are out of scope. Pass explicit paths to override (fixture testing).
import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

function trackedFiles() {
  const out = execFileSync("git", ["ls-files"], { encoding: "utf8" });
  return out.split("\n").filter(
    (f) =>
      /\.(html|md)$/.test(f) &&
      // Material-QA negative fixtures are test inputs, not publishable content.
      !f.startsWith("toolkit/material-qa/fixtures/"),
  );
}

const linkPatterns = [
  /href\s*=\s*["']([^"']+)["']/gi, // HTML links
  /src\s*=\s*["']([^"']+)["']/gi, // HTML embeds
  /\]\(([^)\s]+)\)/g, // Markdown links/images
];

const isExternal = (target) =>
  /^(?:[a-z][a-z0-9+.-]*:|\/\/|#)/i.test(target) || target.startsWith("/");

const files = process.argv.length > 2 ? process.argv.slice(2) : trackedFiles();
let failed = false;

for (const file of files) {
  const contents = await readFile(file, "utf8");
  for (const pattern of linkPatterns) {
    for (const match of contents.matchAll(pattern)) {
      const raw = match[1];
      if (isExternal(raw)) continue;
      const target = raw.split("#")[0].split("?")[0];
      if (!target) continue;
      if (!existsSync(resolve(dirname(file), decodeURIComponent(target)))) {
        const line = contents.slice(0, match.index).split("\n").length;
        console.error(`[links] ${file}:${line}: broken internal link "${raw}"`);
        failed = true;
      }
    }
  }
}

if (failed) process.exit(1);
console.log(`[links] passed ${files.length} file(s)`);
