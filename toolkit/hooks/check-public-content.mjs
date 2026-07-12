#!/usr/bin/env node
// Repo-wide public-content guard: runs guard-public-content.mjs over every
// tracked .md/.html file so the standards can quote ONE copy-pasteable
// command. Pass explicit paths to override (fixture testing).
// `--self-test` proves the gate fails on a violating fixture.
import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

function trackedFiles() {
  const out = execFileSync("git", ["ls-files"], { encoding: "utf8" });
  return out
    .split("\n")
    .filter((f) => /\.(html|md)$/.test(f))
    .filter((f) => !/(^|\/)fixtures\//.test(f)); // negative fixtures violate on purpose
}

const guard = join(dirname(fileURLToPath(import.meta.url)), "guard-public-content.mjs");
const args = process.argv.slice(2);

const badFlags = args.filter((a, i) => a.startsWith("--") && !(a === "--self-test" && i === 0));
if (badFlags.length > 0) {
  console.error(`[public-content] unrecognized or misplaced flag(s): ${badFlags.join(" ")}`);
  process.exit(2);
}

if (args[0] === "--self-test") {
  const self = fileURLToPath(import.meta.url);
  const dir = mkdtempSync(join(tmpdir(), "check-public-"));
  const bad = join(dir, "bad.md");
  const good = join(dir, "good.md");
  writeFileSync(bad, "Internal note " + "CONFIDENTIAL-" + "CLIENT do not publish\n");
  writeFileSync(good, "Public-safe invented sample content.\n");
  const failing = spawnSync(process.execPath, [self, bad], { stdio: "ignore" });
  const passing = spawnSync(process.execPath, [self, good], { stdio: "ignore" });
  rmSync(dir, { recursive: true, force: true });
  if (failing.status === 1 && passing.status === 0) {
    console.log("[public-content] self-test passed (violation detected, clean file accepted)");
    process.exit(0);
  }
  console.error(
    `[public-content] self-test FAILED (violating fixture exit ${failing.status}, clean fixture exit ${passing.status})`
  );
  process.exit(1);
}

const files = args.length > 0 ? args : trackedFiles();

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
