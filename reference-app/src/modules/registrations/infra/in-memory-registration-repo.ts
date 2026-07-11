import type { RegistrationRepo } from "../application/registrations.router";
import type { Registration } from "../domain/registration";
import { toIsoTimestamp } from "./timestamps";

export function createInMemoryRegistrationRepo(seed: Registration[] = []): RegistrationRepo {
  const rows = new Map(seed.map((item) => [item.id, { ...item }]));
  return {
    list: async () =>
      [...rows.values()]
        .sort((a, b) => Date.parse(a.registeredAt) - Date.parse(b.registeredAt))
        .slice(0, 50)
        .map((item) => ({ ...item })),
    getById: async (id) => {
      const item = rows.get(id);
      return item ? { ...item } : null;
    },
    create: async (input) => {
      const registration: Registration = {
        ...input,
        id: crypto.randomUUID(),
        workshopStartsAt: toIsoTimestamp(input.workshopStartsAt),
        status: "pending",
        registeredAt: new Date().toISOString(),
        cancelledAt: null,
      };
      rows.set(registration.id, registration);
      return { ...registration };
    },
    transitionStatus: async (id, expectedStatuses, nextStatus, cancelledAt) => {
      const existing = rows.get(id);
      if (!existing || !expectedStatuses.includes(existing.status)) return null;
      const updated = { ...existing, status: nextStatus, cancelledAt };
      rows.set(id, updated);
      return { ...updated };
    },
  };
}
