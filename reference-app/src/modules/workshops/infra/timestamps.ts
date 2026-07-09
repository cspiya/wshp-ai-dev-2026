/**
 * Read-side timestamp normalization, shared by every WorkshopRepo adapter.
 *
 * Postgres returns `timestamptz` columns in its own text format
 * ("2026-01-15 09:00:00+00") and clients may submit any ISO offset
 * ("2026-01-15T09:00:00+02:00"). Adapters convert everything they hand out
 * to strict UTC ISO 8601 (`Date#toISOString`), so the domain read schema
 * (domain/workshop.ts) can promise one canonical date shape.
 */
export function toIsoTimestamp(value: string): string {
  return new Date(value).toISOString();
}
