import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { checkFiles, checkText } from "./check-no-cli.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));

test("accepts an explicitly agent-owned command trace", () => {
  const html = `<p>Ask the agent to run the check. This is an agent-run technical contract; the participant does not type it.</p><pre><code>npm run test</code></pre>`;
  assert.deepEqual(checkText("materials/example/index.html", html), []);
});

test("rejects participant-directed exact syntax", () => {
  const fixture = path.join(HERE, "fixtures/no-cli-negative/materials/bad.html");
  const failures = checkFiles([fixture]);
  assert.ok(failures.some((failure) => failure.includes("participant-directed exact command syntax")));
  assert.ok(failures.some((failure) => failure.includes("command block is not labeled")));
});

test("negative fixture remains intentionally violating", () => {
  const fixture = fs.readFileSync(path.join(HERE, "fixtures/no-cli-negative/materials/bad.html"), "utf8");
  assert.match(fixture, /Futtasd/);
  assert.match(fixture, /npm run test/);
});
