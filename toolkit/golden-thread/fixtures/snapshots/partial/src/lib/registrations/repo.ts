import type { Registration } from "./domain";

/**
 * Port: the storage boundary of the KK-Regisztracio slice. Every adapter
 * (file-backed, in-memory) must stay contract-equal — the shared suite in
 * repo-contract.test.ts runs against ALL adapters to prove it.
 */
export interface RegistrationRepo {
  list(): Promise<Registration[]>;
  create(registration: Registration): Promise<void>;
  /** Active registration for this email+workshop pair, or null. */
  findActiveByEmail(email: string, workshopId: string): Promise<Registration | null>;
  /**
   * Marks the active registration cancelled and returns the updated row;
   * returns null when no ACTIVE registration has this id.
   */
  cancel(id: string, cancelledAt: string): Promise<Registration | null>;
}
