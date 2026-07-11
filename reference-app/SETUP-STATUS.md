# Setup status — manual steps (need interactive OAuth / browser)

Everything code-side is wired; the items below require clicking through
accounts and cannot be done from the CLI without interactive OAuth.
Check them off as you go.

## Vercel

- [ ] **Create the Vercel project from the repo:** vercel.com → *Add New… →
      Project* → import `cspiya/wshp-ai-dev-2026` → set **Root Directory** to
      `reference-app` → Framework preset: Next.js → Deploy.
- [ ] **Verify preview deployments:** open a test PR and confirm a preview URL
      appears on the PR.

## Neon

- [ ] **Create a Neon project** (neon.com console) — region close to the Vercel
      deployment region.
- [ ] **Install the Neon integration on the Vercel project:** Vercel →
      *Integrations → Neon* (or Neon console → *Integrations → Vercel*) →
      connect it to this Vercel project.
- [ ] **Enable "database branch per preview deployment"** in the integration
      settings — this is the workshop centerpiece (per-PR DB branches).
- [ ] **Confirm env vars:** the integration should inject `DATABASE_URL` into
      Production/Preview. If not, set it manually in Vercel → Project →
      Settings → Environment Variables (value from Neon → Connect).

## Local

- [ ] **`.env`:** copy `.env.example` → `.env`, paste the Neon `DATABASE_URL`.
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
