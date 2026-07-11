# Parallel AI work — Git worktrees + Linear lane leases

Two writing AI sessions must never share one physical working tree. They may share the same repository,
but each session gets its own Git worktree, branch, Linear issue, and file scope.

## Stable lanes

| Lane | Linear label | Default file ownership |
|---|---|---|
| Materials | `AI lane / materials` | `materials/**`, participant-facing `toolkit/**`, delivery documentation |
| Reference app | `AI lane / reference-app` | `reference-app/**`, `participant-starter/**`, app-specific CI and setup |

Root files, `.github/**`, and `HANDOFF.md` belong to the coordinating session unless the active issue
explicitly transfers ownership. Do not edit a file owned by the other lane without first releasing and
reassigning it in Linear.

## One issue = one branch = one worktree lease

Branch format:

```text
ai/<linear-id>-<short-slug>
```

Recommended worktree root on this machine:

```text
C:\tmp\wshp-ai-worktrees\
```

Create worktrees from a clean, pushed `main` checkpoint:

```powershell
git switch main
git pull --ff-only
New-Item -ItemType Directory -Force C:\tmp\wshp-ai-worktrees | Out-Null
git worktree add C:\tmp\wshp-ai-worktrees\wen-129 -b ai/wen-129-notebook-qa main
git worktree add C:\tmp\wshp-ai-worktrees\wen-116 -b ai/wen-116-preview-plumbing main
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
- Worktree: `C:\tmp\wshp-ai-worktrees\<issue>`
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
git worktree remove C:\tmp\wshp-ai-worktrees\wen-129
git worktree remove C:\tmp\wshp-ai-worktrees\wen-116
git worktree prune
```
