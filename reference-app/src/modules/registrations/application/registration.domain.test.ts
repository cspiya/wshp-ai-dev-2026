import { expect, it } from "vitest";

import { canCancelRegistration } from "../domain/registration";

const now = new Date("2027-01-01T10:00:00.000Z");

it("rejects cancellation exactly at the 48-hour cutoff instant", () => {
  // workshopStartsAt minus 48 hours === now: exactly at the cutoff.
  // Exclusive boundary mandated by the approved spec (WEN-118 AC1).
  expect(canCancelRegistration("2027-01-03T10:00:00.000Z", now)).toBe(false);
});

it("allows cancellation one millisecond before the 48-hour cutoff", () => {
  // now is 48 hours and 1 ms before the workshop start: still outside the window.
  expect(canCancelRegistration("2027-01-03T10:00:00.001Z", now)).toBe(true);
});

it("rejects cancellation exactly 48 hours before an offset workshop instant", () => {
  // 2027-01-03T12:00:00+02:00 === 2027-01-03T10:00:00Z: exactly at the cutoff,
  // so the exclusive boundary rejects it regardless of timezone offset.
  expect(canCancelRegistration("2027-01-03T12:00:00+02:00", now)).toBe(false);
});

it("rejects cancellation one millisecond inside the 48-hour window", () => {
  expect(canCancelRegistration("2027-01-03T09:59:59.999Z", now)).toBe(false);
});

it("honors a configured cancellation window (24h): exclusive boundary holds", () => {
  const dayWindowMs = 24 * 60 * 60 * 1_000;
  expect(canCancelRegistration("2027-01-02T10:00:00.000Z", now, dayWindowMs)).toBe(false);
  expect(canCancelRegistration("2027-01-02T10:00:00.001Z", now, dayWindowMs)).toBe(true);
});
