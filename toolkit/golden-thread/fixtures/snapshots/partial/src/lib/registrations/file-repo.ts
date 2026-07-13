import type { Registration } from "./domain";
import type { RegistrationRepo } from "./repo";

/** Invented workshop catalog entry — read-only, comes from the seed file. */
export interface Workshop {
  id: string;
  title: string;
  /** ISO 8601 */
  startsAt: string;
}

// TASK-03 is intentionally unimplemented in this catch-up snapshot: the
// file-backed adapter must read/write data/registrations.json (created from
// data/registrations.seed.json) with a temp-file + rename write, and pass the
// SAME contract suite as MemoryRegistrationRepo. See spec-package/tasks.md.
const NOT_IMPLEMENTED = "TODO(TASK-03): implement the file-backed adapter";

export async function readWorkshops(): Promise<Workshop[]> {
  throw new Error(NOT_IMPLEMENTED);
}

// Implementing methods may declare fewer parameters than the port — these
// stubs take none, so the skeleton lints clean while still satisfying the
// RegistrationRepo contract at the type level.
export class FileRegistrationRepo implements RegistrationRepo {
  async list(): Promise<Registration[]> {
    throw new Error(NOT_IMPLEMENTED);
  }

  async create(): Promise<void> {
    throw new Error(NOT_IMPLEMENTED);
  }

  async findActiveByEmail(): Promise<Registration | null> {
    throw new Error(NOT_IMPLEMENTED);
  }

  async cancel(): Promise<Registration | null> {
    throw new Error(NOT_IMPLEMENTED);
  }
}
