import assert from "node:assert/strict";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const guard = path.join(here, "guard-public-content.mjs");
const runner = path.join(here, "run-stop-checks.mjs");

function run(script, args) {
  return spawnSync(process.execPath, [script, ...args], {
    encoding: "utf8",
    shell: false,
    timeout: 5000,
  });
}

async function withTempFiles(callback) {
  const directory = await mkdtemp(path.join(tmpdir(), "toolkit-hooks-"));
  try {
    await callback(directory);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}

test("public guard accepts safe content and blocks an explicit private marker", async () => {
  await withTempFiles(async (directory) => {
    const safe = path.join(directory, "safe.md");
    const blocked = path.join(directory, "blocked.md");
    await writeFile(safe, "Synthetic public example.\n", "utf8");
    await writeFile(blocked, "TODO-PRIVATE remove before publish.\n", "utf8");

    assert.equal(run(guard, [safe]).status, 0);
    const result = run(guard, [blocked]);
    assert.equal(result.status, 1);
    assert.match(result.stderr, /blocked explicit private marker/);
  });
});

test("stop runner propagates child failure", async () => {
  await withTempFiles(async (directory) => {
    const config = path.join(directory, "failure.json");
    await writeFile(config, JSON.stringify({
      checks: [{
        name: "intentional failure",
        command: process.execPath,
        args: ["-e", "process.exit(7)"],
        timeoutMs: 1000,
      }],
    }), "utf8");

    const result = run(runner, [config]);
    assert.equal(result.status, 1);
    assert.match(result.stderr, /failed \(exit 7\): intentional failure/);
  });
});

test("stop runner reports and propagates timeout", async () => {
  await withTempFiles(async (directory) => {
    const config = path.join(directory, "timeout.json");
    await writeFile(config, JSON.stringify({
      checks: [{
        name: "intentional timeout",
        command: process.execPath,
        args: ["-e", "setTimeout(() => {}, 2000)"],
        timeoutMs: 50,
      }],
    }), "utf8");

    const result = run(runner, [config]);
    assert.equal(result.status, 1);
    assert.match(result.stderr, /timed out after 50ms: intentional timeout/);
  });
});
