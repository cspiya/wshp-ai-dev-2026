# Material-QA render harness

Ez a tananyagkészítők és reviewer-ek **agent által futtatott technikai szerződése**. Kérd meg Claude Code-ot
vagy Codexet a releváns render-mátrix futtatására, majd az evidence könyvtár, a manifest, a hibák és a
maradék vizuális kockázat visszaadására; a résztvevőknek nem kell begépelniük ezeket a parancsokat.

Deterministic local rendering of standalone workshop HTML (notebooks and
similar self-contained pages) into per-viewport evidence plus a
machine-readable manifest. Built for material builders and fresh-context
reviewers who need desktop / narrow-mobile / print evidence without
hand-built commands or an interactive browser session.

## Usage (Windows-first, portable Node)

```powershell
# whole notebooks directory, all modes
node toolkit/material-qa/material-qa.mjs materials/notebooks

# explicit files, selected modes, custom timeout
node toolkit/material-qa/material-qa.mjs --modes desktop,print --timeout 20000 materials/notebooks/00-bevezeto.html
```

Options: `--out <dir>` (default `toolkit/material-qa/evidence`, git-ignored) ·
`--modes desktop,mobile,print` · `--timeout <ms>` (default 15000) ·
`--playwright-root <dir>` (or `MATERIAL_QA_PLAYWRIGHT_ROOT`) ·
`--assert <file.mjs>` (adapter, see below).

Exit codes: `0` all rendered clean · `1` at least one entry failed ·
`2` usage or setup error.

## What a run produces

For every input file × mode: `NAME.desktop.png`, `NAME.mobile.png`
(full-page screenshots) and `NAME.print.pdf` (A4, backgrounds on), plus
`manifest.json`:

```json
{
  "summary": { "total": 24, "passed": 23, "failed": 1 },
  "serveRoot": "<absolute directory the pages were served from>",
  "entries": [{
    "source": "00-bevezeto.html",
    "sourceSha": "<git HEAD of the source repo>",
    "sourceDirty": false,
    "mode": "desktop",
    "viewport": { "width": 1440, "height": 900 },
    "output": "00-bevezeto.desktop.png",
    "ok": true,
    "failures": []
  }]
}
```

`source` is relative to `serveRoot` and `output` to the evidence directory,
so manifests from identical inputs are comparable regardless of the CLI's
working directory. Output names mirror the serve-root-relative path
(`one/index.html` → `one__index.desktop.png`), so same-named files never
overwrite each other; failed entries keep their capture file referenced for
triage.

An entry FAILS (never silently passes) on: load timeout, page/console
error, failed local request, HTTP ≥ 400 from the built-in server, or an
adapter assertion. Failure kinds: `render-failure`, `page-error`,
`console-error`, `request-failed`, `http-error`, `assert`.

## Determinism contract

Pages are served from a loopback static server (no network), rendered with
fixed viewport, `deviceScaleFactor 1`, `hu-HU` locale, Europe/Budapest
timezone, light color scheme and `reducedMotion: reduce`. The **manifest**
(entry set, pass/fail, failure kinds) is the deterministic, comparable
artifact; pixel-identical screenshots across machines are NOT promised
(font rasterization differs). Re-runs are idempotent and never dirty Git.

## Evidence stays out of Git — mechanically

The output directory must be either git-ignored or outside any git work
tree; anything else is rejected before rendering (this enforces the
"no committed screenshots/PDFs from participant content" rule). The default
`evidence/` directory is ignored via this folder's `.gitignore`.

## Browser toolchain contract

No second browser dependency is introduced. `playwright-core` is resolved
from the repository's already-locked toolchain at `reference-app/`
(prerequisite: `npm ci --prefix reference-app`, which also provisions the
shared Chromium build). Override with `--playwright-root` or
`MATERIAL_QA_PLAYWRIGHT_ROOT` when running against a different installation.

## Adapter point

`--assert <file.mjs>` loads a module exporting
`assertPage({ page, file, mode, failures })`, called after load and before
capture; push `{ kind: 'assert', detail }` into `failures` to fail the
entry. The accessibility/static-fallback assertions and CI
wiring plug in here — those final assertions are intentionally NOT encoded
in this harness (`fixtures/assert-example.mjs` documents the contract).
Screenshot/PDF evidence alone does not constitute semantic accessibility
validation.

## Tests

```powershell
node --test toolkit/material-qa/material-qa.test.mjs
```

Negative fixtures prove the blockers: missing input file, broken local
resource, page error, load timeout, path traversal against the server, and
invalid (committable or file-occupied) output destinations.

## Limitations

- Chromium-only (the repo's locked engine); no cross-browser matrix.
- `print` uses Chromium's PDF pipeline as the offline/print evidence.
- Directory inputs are scanned one level deep (notebooks live flat).
- Visual *judgment* stays with the reviewer; the harness only guarantees
  the pages render cleanly and hands over comparable evidence.
