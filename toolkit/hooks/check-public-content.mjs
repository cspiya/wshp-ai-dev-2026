#!/usr/bin/env node
// Repo-wide public-content guard: runs guard-public-content.mjs over every
// tracked .md/.html file so the standards can quote ONE copy-pasteable
// command. Pass explicit paths to override (fixture testing).
import { execFileSync, spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

function trackedFiles() {
  const out = execFileSync("git", ["ls-files"], { encoding: "utf8" });
  return out.split("\n").filter((f) => /\.(html|md)$/.test(f));
}

const files = process.argv.length > 2 ? process.argv.slice(2) : trackedFiles();
const guard = join(dirname(fileURLToPath(import.meta.url)), "guard-public-content.mjs");

let failed = false;
const CHUNK = 50; // stay well under Windows command-line limits

for (let i = 0; i < files.length; i += CHUNK) {
  const result = spawnSync(process.execPath, [guard, ...files.slice(i, i + CHUNK)], {
    stdio: ["ignore", "ignore", "inherit"],
  });
  if (result.status !== 0) failed = true;
}

if (failed) process.exit(1);
console.log(`[public-content] passed ${files.length} file(s)`);
