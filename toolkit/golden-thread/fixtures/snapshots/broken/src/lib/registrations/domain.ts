// KK-Regisztracio domain — pure TypeScript, no imports, no I/O.
// All names, emails, and dates in this slice are INVENTED workshop data.

export const CANCELLATION_WINDOW_HOURS = 48;
export const CANCELLATION_WINDOW_MS = CANCELLATION_WINDOW_HOURS * 60 * 60 * 1000;

export type RegistrationStatus = "active" | "cancelled";

export interface Registration {
  id: string;
  workshopId: string;
  /** ISO 8601 — denormalized from the workshop at creation time. */
  workshopStartsAt: string;
  name: string;
  email: string;
  status: RegistrationStatus;
  /** ISO 8601 */
  registeredAt: string;
  /** ISO 8601 or null while the registration is active. */
  cancelledAt: string | null;
}

/**
 * AC-02 — EXCLUSIVE boundary: at exactly 48 hours before the workshop
 * starts, cancellation is NO LONGER allowed. Strictly earlier is allowed.
 * The clock is injected so tests stay deterministic.
 */
export function canCancel(now: Date, workshopStartsAt: Date): boolean {
  return workshopStartsAt.getTime() - now.getTime() >= CANCELLATION_WINDOW_MS;
}

export interface CreateRegistrationInput {
  workshopId: string;
  workshopStartsAt: string;
  name: string;
  email: string;
}

export type CreateRegistrationError =
  | "name-required"
  | "email-invalid"
  | "duplicate-registration";

export type CreateRegistrationResult =
  | { ok: true; registration: Registration }
  | { ok: false; error: CreateRegistrationError };

// Deliberately simple format check — pedagogy over RFC completeness.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * AC-01 (validation) + AC-03 (duplicate rejection). The duplicate check is a
 * callback so this module never touches storage; the caller resolves it
 * against the repository before invoking the domain.
 */
export function createRegistration(
  input: CreateRegistrationInput,
  deps: {
    id: string;
    now: Date;
    hasActiveRegistration: (email: string, workshopId: string) => boolean;
  },
): CreateRegistrationResult {
  const name = input.name.trim();
  if (name.length === 0) {
    return { ok: false, error: "name-required" };
  }
  const email = input.email.trim().toLowerCase();
  if (!EMAIL_PATTERN.test(email)) {
    return { ok: false, error: "email-invalid" };
  }
  if (deps.hasActiveRegistration(email, input.workshopId)) {
    return { ok: false, error: "duplicate-registration" };
  }
  return {
    ok: true,
    registration: {
      id: deps.id,
      workshopId: input.workshopId,
      workshopStartsAt: input.workshopStartsAt,
      name,
      email,
      status: "active",
      registeredAt: deps.now.toISOString(),
      cancelledAt: null,
    },
  };
}
