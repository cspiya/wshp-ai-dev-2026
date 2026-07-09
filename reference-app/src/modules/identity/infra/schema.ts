// Drizzle schema of the identity module. The golden-path schema (real tables
// used by a tRPC CRUD slice) lands with the Day 2 `tasks` module prep.
// Until then this file exists so the schema glob in drizzle.config.ts
// (src/modules/*/infra/schema.ts) matches at least one file, because
// drizzle-kit errors out on an empty glob. With zero tables exported,
// `db:generate` and `db:push` are clean no-ops.
export {};
