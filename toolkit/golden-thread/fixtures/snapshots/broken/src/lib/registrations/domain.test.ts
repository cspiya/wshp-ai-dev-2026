import { describe, expect, it } from "vitest";
import {
  canCancel,
  createRegistration,
  type CreateRegistrationInput,
} from "./domain";

// Fixed, far-future INVENTED dates — the clock is injected, so these tests
// stay deterministic no matter when they run.
const WORKSHOP_START = new Date("2026-08-25T09:00:00.000Z");

const VALID_INPUT: CreateRegistrationInput = {
  workshopId: "ws-2026-08-alap",
  workshopStartsAt: WORKSHOP_START.toISOString(),
  name: "  Példa Panna  ",
  email: "Panna.Pelda@example.invalid",
};

function deps(overrides: Partial<Parameters<typeof createRegistration>[1]> = {}) {
  return {
    id: "reg-test-0001",
    now: new Date("2026-07-01T10:00:00.000Z"),
    hasActiveRegistration: () => false,
    ...overrides,
  };
}

describe("canCancel — AC-02 cancellation window", () => {
  it("allows cancellation before the window closes (49h before start)", () => {
    const now = new Date(WORKSHOP_START.getTime() - 49 * 60 * 60 * 1000);
    expect(canCancel(now, WORKSHOP_START)).toBe(true);
  });

  it("rejects cancellation inside the 48h window (47h before start)", () => {
    const now = new Date(WORKSHOP_START.getTime() - 47 * 60 * 60 * 1000);
    expect(canCancel(now, WORKSHOP_START)).toBe(false);
  });
});

describe("createRegistration — AC-01 validation, AC-03 duplicates", () => {
  it("creates an active registration and normalizes name/email (SC-01A)", () => {
    const result = createRegistration(VALID_INPUT, deps());
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.registration).toMatchObject({
      id: "reg-test-0001",
      workshopId: "ws-2026-08-alap",
      name: "Példa Panna",
      email: "panna.pelda@example.invalid",
      status: "active",
      cancelledAt: null,
    });
  });

  it("rejects an invalid email address (SC-01B failure path)", () => {
    const result = createRegistration({ ...VALID_INPUT, email: "not-an-email" }, deps());
    expect(result).toEqual({ ok: false, error: "email-invalid" });
  });

  it("rejects a blank name", () => {
    const result = createRegistration({ ...VALID_INPUT, name: "   " }, deps());
    expect(result).toEqual({ ok: false, error: "name-required" });
  });

  it("rejects a duplicate active registration for the same email+workshop (SC-03A)", () => {
    const result = createRegistration(
      VALID_INPUT,
      deps({ hasActiveRegistration: () => true }),
    );
    expect(result).toEqual({ ok: false, error: "duplicate-registration" });
  });
});
