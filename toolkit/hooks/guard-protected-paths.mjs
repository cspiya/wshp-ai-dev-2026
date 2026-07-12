#!/usr/bin/env node
// PreToolUse protected-path guard: block edits to files no agent may touch
// without an explicit human decision (env files, migrations, CI, agent
// rules). Product-neutral: wire it to the selected agent product's
// pre-write hook and pass the candidate path(s).
//
// Usage: node guard-protected-paths.mjs <config.json> <path> [path ...]
// Config: { "protected": ["<entry>", ...] } where an entry is
//   - a directory prefix when it ends with "/" (e.g. "drizzle/"),
//   - an exact relative path (e.g. ".github/workflows/ci.yml"),
//   - a bare filename matched in any directory (e.g. ".env").
import { readFile } from "node:fs/promises";
import { basename } from "node:path";

const [configPath, ...paths] = process.argv.slice(2);

if (!configPath || paths.length === 0) {
  console.error("Usage: node guard-protected-paths.mjs <config.json> <path> [path ...]");
  process.exit(2);
}

const { protected: entries } = JSON.parse(await readFile(configPath, "utf8"));
if (!Array.isArray(entries) || entries.length === 0) {
  console.error("[protected-paths] config must contain a non-empty 'protected' array");
  process.exit(2);
}

const normalize = (p) => p.replaceAll("\\", "/").replace(/^\.\//, "");

let blocked = false;

for (const rawPath of paths) {
  const candidate = normalize(rawPath);
  for (const entry of entries.map(normalize)) {
    const hit = entry.endsWith("/")
      ? candidate.startsWith(entry)
      : entry.includes("/")
        ? candidate === entry
        : basename(candidate) === entry || basename(candidate).startsWith(`${entry}.`);
    if (hit) {
      console.error(`[protected-paths] ${rawPath}: protected by rule "${entry}" — needs a human decision`);
      blocked = true;
    }
  }
}

if (blocked) process.exit(1);
console.log(`[protected-paths] allowed ${paths.length} path(s)`);
