#!/usr/bin/env node
// SVG normalizer (WEN-257, DIAGRAM-TOOLS). Deliberately minimal per the
// v3 spec: converts CRLF to LF and removes XML comments (the generator's
// timestamp/attribution comments are the only comments mermaid emits).
// It does NOT reorder, rewrite or prettify structure — determinism must
// come from the renderer, not from post-processing.
//
//   node toolkit/material-site/normalize-svg.mjs <file.svg> [more.svg...]
//
// Files are normalized in place; exits 1 on unreadable input.

import fs from "node:fs";

export function normalizeSvg(text) {
  return text.replace(/\r\n/g, "\n").replace(/<!--[\s\S]*?-->/g, "");
}

import { fileURLToPath } from "node:url";
import path from "node:path";

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const files = process.argv.slice(2);
  if (files.length === 0) {
    console.error("usage: node toolkit/material-site/normalize-svg.mjs <file.svg> [...]");
    process.exit(2);
  }
  let failed = false;
  for (const file of files) {
    try {
      const raw = fs.readFileSync(file, "utf8");
      fs.writeFileSync(file, normalizeSvg(raw));
      console.log(`[normalize-svg] ${file}`);
    } catch (err) {
      console.error(`[normalize-svg] ${file}: ${err.message}`);
      failed = true;
    }
  }
  process.exit(failed ? 1 : 0);
}
