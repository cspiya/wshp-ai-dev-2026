# Setup status — current truth and remaining interactive proof

This is the operational checklist for the existing shared infrastructure. The
canonical completion strategy and the reason behind these steps live in
[`PLAN.md`](PLAN.md). Check an item only when the named environment has been
observed; code being present is not proof that an external integration works.

## Vercel

- [x] **Create the Vercel project from the repo:** done 2026-07-11 — team
      `wenova-projects`, project `wshp-ai-dev-2026`, Root Directory
      `reference-app`, Next.js preset; first production deploy green.
- [x] **Verify preview deployments:** verified 2026-07-11 — PR #1 produced a
      preview URL; Playwright happy path 2/2 green against it.
- [x] **Deployment Protection decision:** Vercel Authentication DISABLED for
      this project (2026-07-11) — previews must be publicly reachable for
      participants and Playwright; the repo is public and all data is
      invented. Enterprise alternative (kept for the legacy block): a
      Protection Bypass for Automation token in CI.

## Neon

- [x] **Create a Neon project:** done 2026-07-11 — project `wshp-ai-dev-2026`,
      region `eu-central-1` (Frankfurt).
- [x] **Install the Neon integration on the Vercel project:** done 2026-07-11
      (Previews Integration, linked Neon account).
- [x] **"Database branch per preview deployment" works:** verified 2026-07-11 —
      PR #1's preview got its own `preview/ai/wen-116-preview-plumbing` Neon
      branch, and the full test suite ran against it with zero skips (70/70,
      Drizzle contract tests included).
- [x] **Confirm env vars:** `DATABASE_URL` + `DATABASE_URL_UNPOOLED` injected
      into Development/Production 2026-07-11; preview values are injected
      per-deployment by the integration.
- [x] **Schema + seed on the production branch:** `npm run db:push` +
      `npm run db:seed` ran 2026-07-11 (3 invented sample workshops).

## Local

- [x] **`.env`:** pulled via `npx vercel env pull .env --environment=production`
      (project linked with `npx vercel link`), 2026-07-11.
- [ ] **`.mcp.json`:** copy `.mcp.json.example` → `.mcp.json`, then run the
      OAuth flow for each server on first use (`/mcp` in Claude Code).

## Existing application and database proof

- **DB schema/migrations:** the `workshops` golden path and `registrations`
  slices are built (Drizzle schemas + adapters + contract tests); migrations are
  committed in `drizzle/` and were applied to the existing Neon project.
  `getDb()` stays lazy, so build/tests pass without `DATABASE_URL`.
- **Playwright-on-preview:** the happy path runs locally with no DB
  (`npm run test:e2e`, in-memory repo). To prove the current application against a
  new preview, point it at that preview:
  `PLAYWRIGHT_BASE_URL=https://<preview-url> npm run test:e2e`.

## Neon Auth — code present, live integration not yet accepted

### Merged code-side work

- [x] `@neondatabase/auth` is installed (`0.4.x` beta line).
- [x] The lazy `createNeonAuth()` server wrapper exists in
      `src/platform/auth/server.ts`.
- [x] The `/api/auth/[...path]` route proxies Neon Auth requests.
- [x] The tRPC request context obtains the server-side session when Auth is
      configured; protected write procedures reject anonymous callers.
- [x] `/shop` states and enforces guest checkout: account creation and sign-in are
      not required while the live Auth integration remains unaccepted.
- [ ] Confirm on a fresh Preview that local and deployed E2E use the same
      signed-out guest path; the implementation no longer signs up and the
      local-only in-memory seam remains guarded from Vercel.

### External/runtime proof still required

- [ ] Confirm/provision Neon Auth on the production branch and record sanitized
      evidence that the expected Auth schema/configuration exists.
- [ ] Restore a truthful optional account UI only after the complete Auth runtime
      proof below is accepted; it must never become a guest-purchase prerequisite.
- [ ] Set `NEON_AUTH_BASE_URL` and a stable, 32+ character
      `NEON_AUTH_COOKIE_SECRET` in local, Preview, and Production environments.
- [ ] Verify that preview branches receive their own Auth configuration.
- [ ] Produce a fresh Preview deployment after the auth merge and run the complete
      `@happy-path` Playwright set against its URL (no skipped deployment event).
- [ ] Capture browser → tRPC → session → Neon data evidence for one accepted Preview
      SHA, including an anonymous write rejection.
- [ ] Promote only the accepted SHA and perform a Production auth/shop smoke test.

Until those runtime checks are complete, the local in-memory `/shop` remains a
teaching flow and the presence of Auth code is **not** evidence that live Neon Auth
is complete. Full RBAC and a custom auth implementation remain out of scope.
