import { expect, it } from "vitest";

import { canCancelRegistration } from "../domain/registration";

const now = new Date("2027-01-01T10:00:00.000Z");

it("allows cancellation exactly 48 hours before an offset workshop instant", () => {
  expect(canCancelRegistration("2027-01-03T12:00:00+02:00", now)).toBe(true);
});

it("rejects cancellation one millisecond inside the 48-hour window", () => {
  expect(canCancelRegistration("2027-01-03T09:59:59.999Z", now)).toBe(false);
});
