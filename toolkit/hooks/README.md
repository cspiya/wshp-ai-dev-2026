# Deterministic hook commands

These scripts are product-neutral commands. Connect them to the selected agent product's official pre-write/pre-commit/stop hook mechanism. The hook event name, JSON schema, and configuration location are adapter points; this toolkit intentionally does not invent them.

## Public-content guard

Run on the exact files about to be published or committed:

```powershell
node toolkit/hooks/guard-public-content.mjs README.md materials/example.md
```

Exit `0` permits the operation; exit `1` blocks known secret/private markers or unreadable inputs; exit `2` means incorrect usage. Extend the `forbidden` list with reviewed project-specific patterns. This is a backstop, not a complete secret scanner.

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
