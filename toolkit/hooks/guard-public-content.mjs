#!/usr/bin/env node

import { readFile } from "node:fs/promises";

const files = process.argv.slice(2);

if (files.length === 0) {
  console.error("Usage: node guard-public-content.mjs <file> [file ...]");
  process.exit(2);
}

const forbidden = [
  ["private key", /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/],
  ["AWS access key", /\bAKIA[0-9A-Z]{16}\b/],
  ["GitHub token", /\bgh[oprsu]_[A-Za-z0-9_]{30,}\b/],
  ["explicit private marker", /\b(?:TODO-PRIVATE|CONFIDENTIAL-CLIENT)\b/i],
];

let blocked = false;

for (const file of files) {
  let contents;
  try {
    contents = await readFile(file, "utf8");
  } catch (error) {
    console.error(`[guard] cannot read ${file}: ${error.message}`);
    blocked = true;
    continue;
  }

  for (const [label, pattern] of forbidden) {
    if (pattern.test(contents)) {
      console.error(`[guard] ${file}: blocked ${label}`);
      blocked = true;
    }
  }
}

if (blocked) process.exit(1);
console.log(`[guard] passed ${files.length} file(s)`);
