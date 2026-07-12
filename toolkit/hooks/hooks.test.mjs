import assert from "node:assert/strict";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const guard = path.join(here, "guard-public-content.mjs");
const links = path.join(here, "check-links.mjs");
const runner = path.join(here, "run-stop-checks.mjs");

function run(script, args, cwd) {
  return spawnSync(process.execPath, [script, ...args], {
    cwd,
    encoding: "utf8",
    shell: false,
    timeout: 5000,
  });
}

function git(args, cwd) {
  const result = spawnSync("git", args, {
    cwd,
    encoding: "utf8",
    shell: false,
    timeout: 5000,
  });
  assert.equal(result.status, 0, result.stderr);
}

async function initializeTrackedLinkFixture(directory, safeContents) {
  const negativeFixture = path.join(
    directory,
    "toolkit",
    "material-qa",
    "fixtures",
    "broken-resource.html",
  );
  const safeMaterial = path.join(directory, "materials", "safe.md");
  await mkdir(path.dirname(negativeFixture), { recursive: true });
  await mkdir(path.dirname(safeMaterial), { recursive: true });
  await writeFile(negativeFixture, '<img src="missing.png">\n', "utf8");
  await writeFile(safeMaterial, safeContents, "utf8");
  git(["init", "--quiet"], directory);
  git(["add", "."], directory);
  return { negativeFixture, safeMaterial };
}

test("default link scan excludes only material-QA negative fixtures", async () => {
  await withTempFiles(async (directory) => {
    await initializeTrackedLinkFixture(directory, "Safe material.\n");

    const result = run(links, [], directory);
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /passed 1 file\(s\)/);
  });
});

test("explicit link scan still validates a material-QA negative fixture", async () => {
  await withTempFiles(async (directory) => {
    const { negativeFixture } = await initializeTrackedLinkFixture(
      directory,
      "Safe material.\n",
    );

    const result = run(links, [negativeFixture], directory);
    assert.equal(result.status, 1);
    assert.match(result.stderr, /broken-resource\.html:1: broken internal link "missing\.png"/);
  });
});

test("default link scan still validates tracked publishable material", async () => {
  await withTempFiles(async (directory) => {
    await initializeTrackedLinkFixture(directory, "[Missing](missing.md)\n");

    const result = run(links, [], directory);
    assert.equal(result.status, 1);
    assert.match(result.stderr, /materials\/safe\.md:1: broken internal link "missing\.md"/);
    assert.doesNotMatch(result.stderr, /broken-resource\.html/);
  });
});

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

test("protected-path guard blocks protected targets and allows safe ones", async () => {
  await withTempFiles(async (directory) => {
    const config = path.join(directory, "protected.json");
    await writeFile(
      config,
      JSON.stringify({ protected: [".env", "drizzle/", ".github/workflows/"] }),
      "utf8",
    );
    const pathGuard = path.join(here, "guard-protected-paths.mjs");

    assert.equal(run(pathGuard, [config, "src/modules/workshops/ui/page.tsx"]).status, 0);

    const blockedEnv = run(pathGuard, [config, "reference-app/.env.local"]);
    assert.equal(blockedEnv.status, 1);
    assert.match(blockedEnv.stderr, /protected by rule "\.env"/);

    const blockedDir = run(pathGuard, [config, "drizzle/0001_add_table.sql"]);
    assert.equal(blockedDir.status, 1);

    assert.equal(run(pathGuard, [config]).status, 2);
  });
});
