#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import path from "node:path";

const configPath = process.argv[2];
if (!configPath) {
  console.error("Usage: node run-stop-checks.mjs <checks.json>");
  process.exit(2);
}

const config = JSON.parse(await readFile(configPath, "utf8"));
if (!Array.isArray(config.checks) || config.checks.length === 0) {
  throw new Error("Config must contain a non-empty checks array.");
}

const base = path.dirname(path.resolve(configPath));
let failed = false;

for (const check of config.checks) {
  if (!check.name || !check.command || !Array.isArray(check.args ?? [])) {
    throw new Error("Each check needs name, command, and optional args array.");
  }
  if (
    check.timeoutMs !== undefined &&
    (!Number.isInteger(check.timeoutMs) || check.timeoutMs <= 0)
  ) {
    throw new Error(`Check "${check.name}" timeoutMs must be a positive integer.`);
  }

  const command = process.platform === "win32" && check.command === "npm" ? "npm.cmd" : check.command;
  const cwd = path.resolve(base, check.cwd ?? ".");
  console.log(`\n[stop-check] ${check.name}`);
  const result = spawnSync(command, check.args ?? [], {
    cwd,
    stdio: "inherit",
    shell: false,
    timeout: check.timeoutMs,
    killSignal: "SIGTERM",
  });
  if (result.error?.code === "ETIMEDOUT") {
    console.error(`[stop-check] timed out after ${check.timeoutMs}ms: ${check.name}`);
    failed = true;
    continue;
  }
  if (result.error || result.status !== 0) {
    const detail = result.status === null ? "no exit status" : `exit ${result.status}`;
    console.error(`[stop-check] failed (${detail}): ${check.name}`);
    if (result.error) console.error(result.error.message);
    failed = true;
  }
}

process.exit(failed ? 1 : 0);
