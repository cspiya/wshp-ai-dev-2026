# Setup status — manual steps (need interactive OAuth / browser)

Everything code-side is wired; the items below require clicking through
accounts and cannot be done from the CLI without interactive OAuth.
Check them off as you go.

## Vercel

- [x] **Create the Vercel project from the repo:** done 2026-07-11 — team
      `wenova-projects`, project `wshp-ai-dev-2026`, Root Directory
      `reference-app`, Next.js preset; first production deploy green.
- [ ] **Verify preview deployments:** open a test PR and confirm a preview URL
      appears on the PR. *(this PR is that test)*

## Neon

- [x] **Create a Neon project:** done 2026-07-11 — project `wshp-ai-dev-2026`,
      region `eu-central-1` (Frankfurt).
- [x] **Install the Neon integration on the Vercel project:** done 2026-07-11
      (Previews Integration, linked Neon account).
- [ ] **Enable "database branch per preview deployment"** in the integration
      settings — this is the workshop centerpiece (per-PR DB branches).
      *(verified by this PR: the preview must get its own Neon branch)*
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

## Done code-side, waiting on the clicks above

- **DB schema/migrations:** the `workshops` golden path and `registrations`
  slices are built (Drizzle schemas + adapters + contract tests); migrations are committed in
  `drizzle/`. Once Neon exists: `npm run db:push` (or apply the migration),
  then `npm run db:seed`. `getDb()` stays lazy, so build/tests pass without
  `DATABASE_URL`.
- **Playwright-on-preview:** the happy path runs locally with no DB
  (`npm run test:e2e`, in-memory repo). Once previews deploy, point it at one:
  `PLAYWRIGHT_BASE_URL=https://<preview-url> npm run test:e2e`.

## Neon Auth — blocked on external setup, not marked done

- [ ] Provision Neon Auth on the production branch after the Neon project exists.
- [ ] Install `@neondatabase/auth` only after provisioning, then use the current
      unified `createNeonAuth()` server API (not the retired v0.1 helpers).
- [ ] Set `NEON_AUTH_BASE_URL` and a stable, 32+ character
      `NEON_AUTH_COOKIE_SECRET` in local, Preview, and Production environments.
- [ ] Add the auth route handler and obtain the session server-side; enforce
      registration authorization in the server use-case, close to persistence.
- [ ] Verify that preview branches receive their own Auth configuration.

Until those steps are complete, `/shop` is an explicitly unauthenticated local
teaching flow. It demonstrates pricing, the payment port, and registration
status rules; it is not evidence that Neon Auth or RBAC is complete. Full RBAC
and a custom auth implementation remain out of scope.
