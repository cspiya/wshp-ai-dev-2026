import type { Registration } from "./domain";
import type { RegistrationRepo } from "./repo";

/** In-memory adapter — used by tests; contract-equal to the file adapter. */
export class MemoryRegistrationRepo implements RegistrationRepo {
  private rows: Registration[];

  constructor(seed: Registration[] = []) {
    this.rows = seed.map((row) => ({ ...row }));
  }

  async list(): Promise<Registration[]> {
    return this.rows.map((row) => ({ ...row }));
  }

  async create(registration: Registration): Promise<void> {
    this.rows.push({ ...registration });
  }

  async findActiveByEmail(email: string, workshopId: string): Promise<Registration | null> {
    const row = this.rows.find(
      (r) => r.email === email && r.workshopId === workshopId && r.status === "active",
    );
    return row ? { ...row } : null;
  }

  async cancel(id: string, cancelledAt: string): Promise<Registration | null> {
    const row = this.rows.find((r) => r.id === id && r.status === "active");
    if (!row) return null;
    row.status = "cancelled";
    row.cancelledAt = cancelledAt;
    return { ...row };
  }
}
