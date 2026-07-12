# Final technical verification — 2026-07-12 (WEN-186)

Evidence pack for the pre-dry-run acceptance (WEN-125). Scope: the
reference workload's documented gates + the fast-moving platform claims
cited in participant-facing material. Curriculum consistency is owned by
the orchestrator lane; this file records platform facts only.

## 1. Reference-app gates on `main @ e6ee464` (post 6-branch merge)

| Gate | Command | Result |
|---|---|---|
| Typecheck | `npm --prefix reference-app run typecheck` | PASS |
| Lint | `npm --prefix reference-app run lint` | PASS |
| Unit/contract | `npm --prefix reference-app run test` | PASS (63 + 11 DB-dependent skips locally; 74/74 zero-skip proven with `TEST_DATABASE_URL` on 2026-07-11) |
| Build | `npm --prefix reference-app run build` | PASS |
| E2E (local seam) | `npm --prefix reference-app run test:e2e` | PASS 2/2 |
| Repo quality gates | `node toolkit/hooks/check-*.mjs` (4 validators) | PASS (46/9/73/73 files) |
| Hook regression | `node --test toolkit/hooks/hooks.test.mjs` | PASS 4/4 |
| Legacy lab | `dotnet test` (sample) | PASS 3/3 |

Preview-side (re-verified via the PR carrying this file): preview URL on
the PR, isolated `preview/<branch>` Neon database branch, CI `e2e` check
against the preview URL. Teardown is keyed to git-branch deletion
(integration marks the branch Obsolete, auto-delete enabled).

## 2. Fast-moving platform claims (verified 2026-07-12)

| Claim | Verified fact | Source | Confidence |
|---|---|---|---|
| Neon branch-per-preview | Proven live: PR → auto `preview/<branch>` DB branch → zero-skip suite against it | this repo, PR #1 chain | HIGH (first-hand) |
| Neon free plan limits | 100 compute-hours/mo, 0.5 GB storage, 10 branches/project, scale-to-zero (endpoints go Idle) | Neon console, observed live | HIGH (first-hand) |
| Neon Auth | Provisioning creates `neon_auth` schema in-project; current SDK `@neondatabase/auth` (0.4.x beta), `createNeonAuth()` server API | live DB query + installed package + neon.com quickstart | HIGH |
| Neon MCP `create_branch` | Exists; takes `project_id`, `parent_branch` (name) — parent selectable, defaults to project default branch | neon.com/docs/ai/neon-mcp-server | HIGH |
| Vercel preview behavior | Preview per PR; **Pro-team previews default to Vercel Authentication (SSO wall)** — disable or use bypass token for public labs | observed live + project settings | HIGH (first-hand) |
| Linear Agents + MCP | Linear Agent connects to external tools via MCP (changelog 2026-04-23); official Linear MCP covers issues/comments/projects/docs/releases | linear.app/changelog | HIGH |
| GitHub Agentic Workflows | **PUBLIC preview since 2026-06-11** (was technical preview); PAT no longer required — built-in `GITHUB_TOKEN` works | github.blog changelog | HIGH |
| Vercel coding-agent template | `vercel-labs/coding-agent-template` deployable one-click; auto-provisions Neon Postgres; multi-agent (Claude Code, Codex CLI, Copilot CLI, Cursor, Gemini) | vercel.com/templates + GitHub | HIGH |
| v0 free tier | $5 credits/month, no rollover; generation pauses when exhausted; domain is **v0.app** (v0.dev redirects) | v0.app/pricing + observed redirect | HIGH |
| Copilot `@modernize` | GA for Java and .NET (since 2025-09-22); C++ out of preview (VS 2026 18.7); works from Copilot Free tier upward (VS 2026 18.1+) | github.blog + learn.microsoft.com | HIGH |
| shadcn MCP | `npx shadcn@latest mcp` responds to JSON-RPC initialize (protocol 2025-06-18) | verified by handshake | HIGH (first-hand) |

## 3. Stale claims to correct in materials (→ orchestrator lane)

1. Any "GitHub Agentic Workflows technical preview / needs a PAT" wording →
   **public preview, `GITHUB_TOKEN` suffices** (changed 2026-06-11).
2. Any `v0.dev` reference → **v0.app** (permanent redirect).
3. Any "Copilot @modernize preview" wording → **GA (Java/.NET), C++ also out
   of preview**; available from the Free tier in current Visual Studio.
4. Cancellation-window claims: the rule is now **configurable**
   (`CANCELLATION_WINDOW_HOURS`, default 48, exclusive boundary — ratified
   2026-07-12).

## 4. Fallbacks / de-scope

- If v0 credits run out in the lab: shadcn MCP covers the registry demo;
  generation falls back to the v0.app web UI.
- If a participant preview stays behind SSO: trainer demonstrates on the
  reference project (protection disabled there by decision).
- Neon Auth end-to-end (signup on preview) still pends `NEON_AUTH_BASE_URL`
  (tracked on WEN-141) — not a blocker for the framework modules.
