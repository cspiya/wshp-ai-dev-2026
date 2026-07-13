/**
 * Display formatting shared across module UIs. One locale, defined once —
 * a slice that formats a date or a price imports these instead of
 * hand-rolling its own `toLocaleString` options.
 */

/** UTC ISO timestamp → "14 Jan 2027, 09:00" (browser-local time). */
export function formatDate(value: string): string {
  return new Date(value).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" });
}

/** 99000 → "99,000" (the HUF label lives in the surrounding UI). */
export function formatHuf(value: number): string {
  return value.toLocaleString("en-US");
}

/** 12700 → "12,700 HUF" — the shop's standard amount rendering. */
export function formatHufAmount(value: number): string {
  return `${formatHuf(value)} HUF`;
}
