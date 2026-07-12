# Deterministic hook commands

These scripts are product-neutral commands. Connect them to the selected agent product's official pre-write/pre-commit/stop hook mechanism. The hook event name, JSON schema, and configuration location are adapter points; this toolkit intentionally does not invent them.

## Public-content guard

Run on the exact files about to be published or committed:

```powershell
node toolkit/hooks/guard-public-content.mjs README.md materials/example.md
```

Exit `0` permits the operation; exit `1` blocks known secret/private markers or unreadable inputs; exit `2` means incorrect usage. Extend the `forbidden` list with reviewed project-specific patterns. This is a backstop, not a complete secret scanner.

## Repo quality gates (WEN-185)

Self-globbing validators behind the canonical standards' "mechanical gates"
sections — each scans the tracked repo files by default and accepts explicit
file paths as arguments; exit `1` on any violation:

```powershell
node toolkit/hooks/check-placeholders.mjs   # unfinished-work and template-leftover markers
node toolkit/hooks/check-notebooks.mjs      # notebook HTML: doctype, title, self-contained, shell, SVG a11y
node toolkit/hooks/check-links.mjs          # relative links resolve; directory links need a landing page
node toolkit/hooks/check-public-content.mjs # guard-public-content over all tracked md/html
```

### WEN-216 gate extensions

- Every validator has a `--self-test` mode: it generates violating fixtures
  in a temp directory and exits `0` only if its own detection fails them
  for the intended reason. CI runs all four self-tests.
- Default scans exclude `fixtures/` directories (negative fixtures violate
  on purpose); explicit file arguments still check them.
- `check-notebooks.mjs`: pages that opt into the shared shell (contain
  `<main`) must carry module navigation (skeleton files prefixed `_` are
  exempt) and no visible content after `</main>`. Every inline `<svg>`
  needs `role="img"`, `aria-labelledby` matched to its own
  `<title id>`/`<desc id>`, and a `static-fallback` equivalent
  (see `materials/notebooks/visual-contract.md`). `--strict-shell` enforces
  the end-state contract (shell + nav + `aria-current="step"` checkpoint
  strip on every notebook) — switches on when Wave-2 converts 04–07.
- `check-links.mjs`: directory links must have `README.md`/`index.html`
  in the target (published directories 404 otherwise). `.md` links inside
  `.html` are raw-Markdown-routing WARNINGS (`--strict-md-routing` fails
  them). `--publication-smoke [baseUrl]` records URL, HTTP status and
  content-type for the published site's key routes; it fails only on
  transport errors.
- CI: `.github/workflows/materials.yml` runs these exact commands plus the
  `toolkit/material-qa` render matrix; local and CI command lists are
  intentionally identical.

## Protected-path guard (PreToolUse)

Blocks writes to paths no agent may touch without a human decision (env
files, migrations, CI, agent rules). Copy `protected-paths.example.json`,
adjust the list, then wire the command to the product's pre-write hook with
the candidate path(s):

```powershell
node toolkit/hooks/guard-protected-paths.mjs toolkit/hooks/protected-paths.example.json reference-app/.env
```

Exit `0` allows, `1` blocks with the matched rule, `2` means incorrect usage.
Entry forms: `dir/` prefix, exact `path/file`, or bare filename (matches in
any directory, including `name.*` variants).

## Stop-runs-checks

Copy `checks.project.example.json`, replace commands and working directories with real project gates, then run:

```powershell
node toolkit/hooks/run-stop-checks.mjs toolkit/hooks/checks.project.json
```

The runner uses argument arrays without a shell and returns non-zero if any check fails or times out. Set an optional positive integer `timeoutMs` on each check; a timeout is reported by check name and makes the complete runner exit `1`. Treat the JSON as trusted repository configuration. Wire this command to the product's stop/completion hook so an agent cannot report completion without the gates running.

Smoke-test the supplied scripts:

```powershell
node toolkit/hooks/run-stop-checks.mjs toolkit/hooks/checks.smoke.json
node toolkit/hooks/guard-public-content.mjs toolkit/README.md
node --test toolkit/hooks/hooks.test.mjs
```

`hooks.test.mjs` persistently covers the guard's blocking path, child failure propagation, and deterministic timeout reporting with platform-neutral Node child processes and temporary fixtures.

For Claude Code or Codex, consult the installed version's official hook documentation and map its event payload to a concrete file list or this stop command. If the product has no suitable deterministic hook, run these commands in pre-commit and CI instead.
