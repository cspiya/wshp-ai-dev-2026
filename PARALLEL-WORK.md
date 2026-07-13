# Parallel AI work — Git worktrees + Linear lane leases

Two writing AI sessions must never share one physical working tree. They may share the same repository,
but each session gets its own Git worktree, branch, Linear issue, and file scope.

## Stable lanes

| Lane | Linear label | Default file ownership |
|---|---|---|
| Materials | `AI lane / materials` | `materials/**`, participant-facing `toolkit/**`, delivery documentation |
| Reference app | `AI lane / reference-app` | `reference-app/**`, `participant-starter/**`, app-specific CI and setup |

Root files and `.github/**` belong to the coordinating session unless the active issue
explicitly transfers ownership. Do not edit a file owned by the other lane without first releasing and
reassigning it in Linear.

Lane labels are file-ownership defaults, **not fixed session identities** (proven in practice
2026-07-13: the same session delivered both materials and reference-app packages). The constant is
that ASSIGNMENT comes from the human coordinator per issue — never self-grabbed. Before touching any
path, check that issue's `ACTIVE` lease comment in Linear; a takeover requires the human's instruction
plus a new `ACTIVE` lease. Never fix another session's breakage uninvited, even when delivery-critical —
surface it and let the human route it. An overdue date does not cancel a task.

## One issue = one branch = one worktree lease

Branch format:

```text
ai/<linear-id>-<short-slug>
```

Worktree root convention on this machine:

```text
C:\Zulu\git_wt\<repo-slug>\<linear-issue>\
```

For this repository the repo slug is `wshp-ai-dev-2026`.

Create worktrees from a clean, pushed `main` checkpoint:

```powershell
git switch main
git pull --ff-only
New-Item -ItemType Directory -Force C:\Zulu\git_wt\wshp-ai-dev-2026 | Out-Null
git worktree add C:\Zulu\git_wt\wshp-ai-dev-2026\wen-129 -b ai/wen-129-notebook-qa main
git worktree add C:\Zulu\git_wt\wshp-ai-dev-2026\wen-116 -b ai/wen-116-preview-plumbing main
git worktree list
```

Start each AI session from its own worktree path, never from the coordinator checkout.

## Linear coordination contract

When a session takes an issue:

1. Add exactly one child label from the `AI lane` group.
2. Move the issue to `In Progress`.
3. Keep the human owner as assignee; an ephemeral AI session is not a durable accountable identity.
4. Add this lease comment:

```md
## AI lane lease — ACTIVE

- Lane: `materials` or `reference-app`
- Worktree: `C:\Zulu\git_wt\wshp-ai-dev-2026\<issue>`
- Branch: `ai/<linear-id>-<short-slug>`
- Session: `<short human-readable session marker>`
- Scope: `<owned directories/files>`
- Started: `<ISO timestamp with timezone>`
- Base commit: `<SHA>`
- Exit: commit + validation evidence + fresh-context review + lease release comment
```

If the session stops without completing the issue, it adds a `PAUSED` comment containing the latest commit,
uncommitted state, completed checks, and exact next action. A replacement session writes a new `ACTIVE` lease;
it does not silently reuse the old identity.

When the issue is complete, add:

```md
## AI lane lease — RELEASED

- Result commit(s): `<SHA>`
- Validation: `<exact commands and outcomes>`
- Review: `<RUG outcome or residual findings>`
- Remaining risk: `<none or explicit item>`
- Released: `<ISO timestamp with timezone>`
```

Then move the issue to `Done` only if its full Linear acceptance criteria are met. A green local subset is not
enough when the issue requires preview, real database, browser, recording, or human evidence.

## Integration

The coordinating session reviews and merges one completed lane at a time:

```powershell
git switch main
git pull --ff-only
git merge --no-ff ai/wen-129-notebook-qa
git merge --no-ff ai/wen-116-preview-plumbing
```

Run the complete cross-repo validation after both merges. Remove finished worktrees only after their commits are
merged and pushed:

```powershell
git worktree remove C:\Zulu\git_wt\wshp-ai-dev-2026\wen-129
git worktree remove C:\Zulu\git_wt\wshp-ai-dev-2026\wen-116
git worktree prune
```

## New working machine bootstrap

Everything a session needs travels with the repo — clone and authenticate:

1. Clone the repo. Plugin/MCP configuration is tracked (`.mcp.json`, `.claude/settings.json`
   with `enableAllProjectMcpServers`); only authentication is per-machine.
2. Authenticate: Claude Code login; `gh auth login` for GitHub (the GitHub MCP server cannot
   OAuth from Claude Code — see the gotcha in `AGENTS.md`); Linear/Neon/Vercel MCP via the
   `/mcp` OAuth prompts.
3. Recreate the worktree root (`C:\Zulu\git_wt\<repo-slug>\`) when a parallel lane starts.
4. Machine-local and untracked by design: `.claude/settings.local.json` (e.g. silencing the
   github MCP entry). Claude's per-project memory does NOT travel between machines — durable
   project knowledge belongs in this repo (`AGENTS.md` gotchas, subproject rules, the journal),
   never only in `~/.claude`.
