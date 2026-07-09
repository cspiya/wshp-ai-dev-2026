import { describe, expect, it } from "vitest";

import { toIsoTimestamp } from "./timestamps";

describe("toIsoTimestamp (read-side normalization)", () => {
  it("converts Postgres timestamptz text format to strict UTC ISO", () => {
    expect(toIsoTimestamp("2026-01-15 09:00:00+00")).toBe("2026-01-15T09:00:00.000Z");
  });

  it("converts an ISO string with a non-UTC offset to UTC", () => {
    expect(toIsoTimestamp("2026-01-15T09:00:00+02:00")).toBe("2026-01-15T07:00:00.000Z");
  });

  it("leaves an already-canonical UTC ISO string unchanged", () => {
    expect(toIsoTimestamp("2026-01-15T09:00:00.000Z")).toBe("2026-01-15T09:00:00.000Z");
  });
});
