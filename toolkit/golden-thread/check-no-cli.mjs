#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(SCRIPT_DIR, "../..");

const DEFAULT_FILES = [
  "materials/README.md",
  "materials/setup-guide.md",
  "materials/agenda.md",
  "materials/big-picture.md",
  "materials/felkeszules/index.html",
  "materials/napirend/index.html",
];

const COMMAND = /(?:^|[\s>`])(?:git\s+(?:clone|add|commit|push|switch|checkout|rev-parse)|npm\s+(?:run|ci|install)|node\s+[^\s<]+\.mjs|powershell\b|invoke-restmethod\b|dotnet\s+(?:test|build|run)|new-item\b|set-content\b|remove-item\b|claude\s+--|codex\s+--)/i;
const HUMAN_DIRECTIVE = /\b(?:futtasd|futtassátok|másold|másoljátok|gépeld|gépeljétek|írd\s+be|írjátok\s+be|add\s+ki|commitold)\b/i;
const AGENT_OWNED = /(?:agent-run|agent által|az agent|agentet|agentnek|claude code vagy codex|technical contract|technikai kontraktus|technikai trace|recorded evidence|non-executable|nem résztvevői|nem gépeli be|nem parancslista|replay transcript|sablon)/i;

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const target = path.join(dir, entry.name);
    if (entry.isDirectory()) return walk(target);
    return [target];
  });
}

function defaultTargets(root) {
  const modulePages = walk(path.join(root, "materials/modulok"))
    .filter((file) => path.basename(file) === "index.html");
  const goldenDocs = walk(path.join(root, "toolkit/golden-thread"))
    .filter((file) => file.endsWith(".md") && !file.replaceAll("\\", "/").includes("/fixtures/"));
  return [...DEFAULT_FILES.map((file) => path.join(root, file)), ...modulePages, ...goldenDocs];
}

function lineAt(text, index) {
  return text.slice(0, index).split(/\r?\n/).length;
}

function bootstrapException(file, fragment) {
  const normalized = file.replaceAll("\\", "/");
  if (!/(?:materials\/setup-guide\.md|materials\/felkeszules\/index\.html)$/.test(normalized)) return false;
  return /(?:scoop-telepito\.cmd|(?:^|[>`\s])claude(?:[<`\s]|$)|(?:^|[>`\s])codex(?:[<`\s]|$)|workshop-lab)/i.test(fragment)
    && !/(?:git\s+clone|npm\s|powershell\b|invoke-restmethod|dotnet\s|node\s+)/i.test(fragment);
}

export function checkText(file, text) {
  const failures = [];

  for (const match of text.matchAll(/<(?:li|p)[^>]*>[\s\S]*?<\/(?:li|p)>/gi)) {
    const fragment = match[0];
    if (!COMMAND.test(fragment) || !HUMAN_DIRECTIVE.test(fragment)) continue;
    if (AGENT_OWNED.test(fragment) || bootstrapException(file, fragment)) continue;
    failures.push(`${file}:${lineAt(text, match.index)} participant-directed exact command syntax`);
  }

  for (const match of text.matchAll(/<pre[^>]*>[\s\S]*?<\/pre>/gi)) {
    if (!COMMAND.test(match[0])) continue;
    const lead = text.slice(Math.max(0, match.index - 250), match.index);
    const context = text.slice(Math.max(0, match.index - 450), match.index + match[0].length);
    if (HUMAN_DIRECTIVE.test(lead) && !AGENT_OWNED.test(lead) && !bootstrapException(file, lead + match[0])) {
      failures.push(`${file}:${lineAt(text, match.index)} participant-directed exact command syntax`);
    }
    if (AGENT_OWNED.test(context)) continue;
    failures.push(`${file}:${lineAt(text, match.index)} command block is not labeled agent-run or non-executable`);
  }

  for (const match of text.matchAll(/```(?:powershell|bash|sh|shell|console)?[\s\S]*?```/gi)) {
    if (!COMMAND.test(match[0])) continue;
    const hasFileContract = /(?:execution ownership|agent-run technical contract)/i.test(text);
    if (!hasFileContract && !/materials[\\/]setup-guide\.md$/i.test(file)) {
      failures.push(`${file}:${lineAt(text, match.index)} command fence lacks a file-level agent-run contract`);
    }
  }

  return failures;
}

export function checkFiles(files) {
  const failures = [];
  for (const file of files) {
    if (!fs.existsSync(file)) {
      failures.push(`${file}: file does not exist`);
      continue;
    }
    failures.push(...checkText(file, fs.readFileSync(file, "utf8")));
  }
  return failures;
}

function parseArgs(argv) {
  const explicit = argv.filter((arg) => !arg.startsWith("--"));
  return {
    selfTest: argv.includes("--self-test"),
    files: explicit.map((file) => path.resolve(process.cwd(), file)),
  };
}

function main() {
  const { selfTest, files } = parseArgs(process.argv.slice(2));
  const targets = selfTest
    ? [path.join(SCRIPT_DIR, "fixtures/no-cli-negative/materials/bad.html")]
    : files.length ? files : defaultTargets(REPO_ROOT);
  const failures = checkFiles(targets);

  if (selfTest) {
    if (!failures.length) {
      console.error("NO-CLI SELF-TEST FAIL: negative fixture was accepted");
      process.exitCode = 1;
      return;
    }
    console.log(`NO-CLI SELF-TEST PASS: rejected ${failures.length} regression(s)`);
    return;
  }

  if (failures.length) {
    console.error(`NO-CLI FAIL (${failures.length})`);
    for (const failure of failures) console.error(`- ${failure}`);
    process.exitCode = 1;
    return;
  }
  console.log(`NO-CLI PASS (${targets.length} files)`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
