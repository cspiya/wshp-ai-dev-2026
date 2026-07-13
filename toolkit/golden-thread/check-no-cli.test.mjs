import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  checkFiles,
  checkNegativeFixtures,
  checkText,
} from "./check-no-cli.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));

test("accepts an explicitly agent-owned command trace", () => {
  const html = `<p>Ask the agent to run the check. This is an agent-run technical contract; the participant does not type it.</p><pre><code>npm run test</code></pre>`;
  assert.deepEqual(checkText("materials/example/index.html", html), []);

  const agentOwnedHtml = `<div>Futtasd az agenttel ezt az ellenőrzést: <code>curl -X POST https://example.invalid</code>.</div>`;
  assert.deepEqual(checkText("materials/example/index.html", agentOwnedHtml), []);

  const agentOwnedMarkdown = "Futtasd az agenttel: `npx playwright test`.";
  assert.deepEqual(checkText("materials/example.md", agentOwnedMarkdown), []);

  const nonExecutableMarkdown = "Másold a dokumentációba ezt a non-executable sablont: `curl -X POST https://example.invalid`.";
  assert.deepEqual(checkText("materials/example.md", nonExecutableMarkdown), []);
});

test("rejects participant-directed exact syntax", () => {
  const fixture = path.join(HERE, "fixtures/no-cli-negative/materials/bad.html");
  const failures = checkFiles([fixture]);
  assert.ok(failures.some((failure) => failure.includes("participant-directed exact command syntax")));
  assert.ok(failures.some((failure) => failure.includes("command block is not labeled")));
});

test("rejects participant-directed Node commands with flags", () => {
  const markdown = "Futtasd: `node --test toolkit/example.test.mjs`.";
  const failures = checkText("materials/example.md", markdown);
  assert.ok(
    failures.some((failure) =>
      failure.includes("participant-directed exact command syntax"),
    ),
    failures.join(" | "),
  );
});

test("negative fixture remains intentionally violating", () => {
  const fixture = fs.readFileSync(path.join(HERE, "fixtures/no-cli-negative/materials/bad.html"), "utf8");
  assert.match(fixture, /Futtasd/);
  assert.match(fixture, /npm run test/);
});

test("negative fixture evaluation reports every accepted file", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "no-cli-fixtures-"));
  const rejected = path.join(dir, "rejected.md");
  const accepted = path.join(dir, "accepted.md");
  try {
    fs.writeFileSync(rejected, "Futtasd: `node --test toolkit/example.test.mjs`.\n");
    fs.writeFileSync(accepted, "Ask the agent to choose and run the right check.\n");
    const results = checkNegativeFixtures([rejected, accepted]);
    assert.ok(results.find((result) => result.file === rejected)?.failures.length);
    assert.deepEqual(
      results.filter((result) => !result.failures.length).map((result) => result.file),
      [accepted],
    );
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test("rejects curl, npx, HTML div and Markdown prose/table bypass fixtures", () => {
  const cases = [
    ["curl-div.html", /participant-directed exact command syntax/],
    ["node-flags.md", /participant-directed exact command syntax/],
    ["npx-inline.md", /participant-directed exact command syntax/],
    ["plain-prose.md", /participant-directed exact command syntax/],
    ["table.md", /participant-directed exact command syntax/],
  ];

  for (const [name, expected] of cases) {
    const fixture = path.join(HERE, "fixtures/no-cli-negative/materials", name);
    const failures = checkFiles([fixture]);
    assert.ok(failures.some((failure) => expected.test(failure)), `${name} should be rejected: ${failures.join(" | ")}`);
  }
});
