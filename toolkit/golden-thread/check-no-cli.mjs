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

const COMMAND = /(?:^|[\s>`])(?:git\s+(?:clone|add|commit|push|switch|checkout|rev-parse)|npm\s+(?:run|ci|install)|npx\s+(?:--yes\s+)?[\w@./-]+|curl(?:\.exe)?\s+(?:-[A-Za-z]+|https?:\/\/|["']https?:\/\/|\$[A-Za-z_])|node\s+(?:(?:--?[\w-]+(?:=[^\s<]+)?)(?:\s+[^\s<]+)*|[^\s<]+\.m?js)|powershell\b|invoke-restmethod\b|dotnet\s+(?:test|build|run)|new-item\b|set-content\b|remove-item\b|claude\s+--|codex\s+--)/i;
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
  const seen = new Set();

  function addFailure(index, reason) {
    const failure = `${file}:${lineAt(text, index)} ${reason}`;
    if (seen.has(failure)) return;
    seen.add(failure);
    failures.push(failure);
  }

  function checkDirectiveFragment(fragment, index) {
    if (!COMMAND.test(fragment) || !HUMAN_DIRECTIVE.test(fragment)) return;
    if (AGENT_OWNED.test(fragment) || bootstrapException(file, fragment)) return;
    addFailure(index, "participant-directed exact command syntax");
  }

  if (/\.html?$/i.test(file)) {
    const teachingTags = ["p", "li", "div", "td", "th", "dd", "dt", "blockquote", "figcaption", "summary", "h1", "h2", "h3", "h4", "h5", "h6"];
    for (const tag of teachingTags) {
      const pattern = new RegExp(`<${tag}\\b[^>]*>[\\s\\S]*?<\\/${tag}>`, "gi");
      for (const match of text.matchAll(pattern)) checkDirectiveFragment(match[0], match.index);
    }
  }

  if (/\.md$/i.test(file)) {
    const prose = text.replace(/```(?:powershell|bash|sh|shell|console)?[\s\S]*?```/gi, (fence) => fence.replace(/[^\r\n]/g, " "));
    for (const match of prose.matchAll(/[^\r\n]+/g)) checkDirectiveFragment(match[0], match.index);
    for (const match of prose.matchAll(/[^\s][\s\S]*?(?=\r?\n\s*\r?\n|$)/g)) checkDirectiveFragment(match[0], match.index);
  }

  for (const match of text.matchAll(/<pre[^>]*>[\s\S]*?<\/pre>/gi)) {
    if (!COMMAND.test(match[0])) continue;
    const lead = text.slice(Math.max(0, match.index - 250), match.index);
    const context = text.slice(Math.max(0, match.index - 450), match.index + match[0].length);
    if (HUMAN_DIRECTIVE.test(lead) && !AGENT_OWNED.test(lead) && !bootstrapException(file, lead + match[0])) {
      addFailure(match.index, "participant-directed exact command syntax");
    }
    if (AGENT_OWNED.test(context)) continue;
    addFailure(match.index, "command block is not labeled agent-run or non-executable");
  }

  for (const match of text.matchAll(/```(?:powershell|bash|sh|shell|console)?[\s\S]*?```/gi)) {
    if (!COMMAND.test(match[0])) continue;
    const hasFileContract = /(?:execution ownership|agent-run technical contract)/i.test(text);
    if (!hasFileContract && !/materials[\\/]setup-guide\.md$/i.test(file)) {
      addFailure(match.index, "command fence lacks a file-level agent-run contract");
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

export function checkNegativeFixtures(files) {
  return files.map((file) => ({
    file,
    failures: checkFiles([file]),
  }));
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
    ? walk(path.join(SCRIPT_DIR, "fixtures/no-cli-negative")).filter((file) => /\.(?:html?|md)$/i.test(file))
    : files.length ? files : defaultTargets(REPO_ROOT);
  if (selfTest) {
    const results = checkNegativeFixtures(targets);
    const accepted = results.filter((result) => !result.failures.length);
    if (accepted.length) {
      console.error("NO-CLI SELF-TEST FAIL: negative fixture(s) were accepted");
      for (const result of accepted) {
        console.error(`- ${path.relative(REPO_ROOT, result.file)}`);
      }
      process.exitCode = 1;
      return;
    }
    const findingCount = results.reduce(
      (count, result) => count + result.failures.length,
      0,
    );
    console.log(
      `NO-CLI SELF-TEST PASS: rejected ${results.length} fixture(s) with ${findingCount} finding(s)`,
    );
    return;
  }

  const failures = checkFiles(targets);
  if (failures.length) {
    console.error(`NO-CLI FAIL (${failures.length})`);
    for (const failure of failures) console.error(`- ${failure}`);
    process.exitCode = 1;
    return;
  }
  console.log(`NO-CLI PASS (${targets.length} files)`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
