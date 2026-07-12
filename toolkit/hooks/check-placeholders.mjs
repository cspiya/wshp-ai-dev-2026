#!/usr/bin/env node
// Placeholder/TODO scan: teaching artifacts must ship without template
// leftovers. Default scope: tracked materials/**/*.{html,md} and
// toolkit/**/*.md; pass explicit file paths to override (fixture testing).
import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";

const markers = [
  ["unfinished TODO", /\bTODO[:(\]]/],
  ["FIXME marker", /\bFIXME\b/],
  ["TBD marker", /\bTBD\b/],
  ["placeholder marker", /\bPLACEHOLDER\b/],
  ["lorem ipsum filler", /lorem ipsum/i],
  ["unreplaced command placeholder", /<command>/],
];

function trackedFiles() {
  const out = execFileSync("git", ["ls-files", "materials", "toolkit"], { encoding: "utf8" });
  return out
    .split("\n")
    .filter((f) => /\.(html|md)$/.test(f))
    .filter((f) => !f.endsWith(".mjs"));
}

const files = process.argv.length > 2 ? process.argv.slice(2) : trackedFiles();
let failed = false;

for (const file of files) {
  const contents = await readFile(file, "utf8");
  for (const [label, pattern] of markers) {
    const match = contents.match(pattern);
    if (match) {
      const line = contents.slice(0, match.index).split("\n").length;
      console.error(`[placeholders] ${file}:${line}: ${label} ("${match[0]}")`);
      failed = true;
    }
  }
}

if (failed) process.exit(1);
console.log(`[placeholders] passed ${files.length} file(s)`);
