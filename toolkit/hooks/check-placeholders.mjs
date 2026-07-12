#!/usr/bin/env node
// Placeholder/TODO scan: teaching artifacts must ship without template
// leftovers. Default scope: tracked materials/**/*.{html,md} and
// toolkit/**/*.md; pass explicit file paths to override (fixture testing).
// `--self-test` proves the gate fails on a violating fixture (WEN-216).
import { execFileSync, spawnSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

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
    .filter((f) => !f.endsWith(".mjs"))
    .filter((f) => !/(^|\/)fixtures\//.test(f)); // negative fixtures violate on purpose
}

const args = process.argv.slice(2);

const badFlags = args.filter((a, i) => a.startsWith("--") && !(a === "--self-test" && i === 0));
if (badFlags.length > 0) {
  console.error(`[placeholders] unrecognized or misplaced flag(s): ${badFlags.join(" ")}`);
  process.exit(2);
}

if (args[0] === "--self-test") {
  const self = fileURLToPath(import.meta.url);
  const dir = mkdtempSync(join(tmpdir(), "check-placeholders-"));
  const bad = join(dir, "bad.md");
  const good = join(dir, "good.md");
  writeFileSync(bad, "A leftover " + "TO" + "DO: finish this section\n");
  writeFileSync(good, "Complete invented teaching prose.\n");
  const failing = spawnSync(process.execPath, [self, bad], { stdio: "ignore" });
  const passing = spawnSync(process.execPath, [self, good], { stdio: "ignore" });
  rmSync(dir, { recursive: true, force: true });
  if (failing.status === 1 && passing.status === 0) {
    console.log("[placeholders] self-test passed (violation detected, clean file accepted)");
    process.exit(0);
  }
  console.error(
    `[placeholders] self-test FAILED (violating fixture exit ${failing.status}, clean fixture exit ${passing.status})`
  );
  process.exit(1);
}

const files = args.length > 0 ? args : trackedFiles();
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
