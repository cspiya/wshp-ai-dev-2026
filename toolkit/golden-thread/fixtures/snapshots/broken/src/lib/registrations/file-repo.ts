import { promises as fs } from "node:fs";
import path from "node:path";
import type { Registration } from "./domain";
import type { RegistrationRepo } from "./repo";

/** Invented workshop catalog entry — read-only, comes from the seed file. */
export interface Workshop {
  id: string;
  title: string;
  /** ISO 8601 */
  startsAt: string;
}

interface SeedFile {
  workshops: Workshop[];
  registrations: Registration[];
}

const DEFAULT_DATA_DIR = path.join(process.cwd(), "data");

async function readSeed(dataDir: string): Promise<SeedFile> {
  try {
    const raw = await fs.readFile(path.join(dataDir, "registrations.seed.json"), "utf8");
    return JSON.parse(raw) as SeedFile;
  } catch {
    return { workshops: [], registrations: [] };
  }
}

/** The invented workshop list lives next to the registration seed rows. */
export async function readWorkshops(dataDir: string = DEFAULT_DATA_DIR): Promise<Workshop[]> {
  return (await readSeed(dataDir)).workshops;
}

/**
 * File-backed adapter. The runtime store data/registrations.json is created
 * from data/registrations.seed.json on first use and is gitignored (see
 * .gitignore-additions.txt in this snapshot).
 */
export class FileRegistrationRepo implements RegistrationRepo {
  constructor(private readonly dataDir: string = DEFAULT_DATA_DIR) {}

  private get storePath(): string {
    return path.join(this.dataDir, "registrations.json");
  }

  private async load(): Promise<Registration[]> {
    try {
      const raw = await fs.readFile(this.storePath, "utf8");
      return JSON.parse(raw) as Registration[];
    } catch {
      const seed = await readSeed(this.dataDir);
      await this.save(seed.registrations);
      return seed.registrations;
    }
  }

  private async save(rows: Registration[]): Promise<void> {
    await fs.mkdir(this.dataDir, { recursive: true });
    const tmpPath = `${this.storePath}.tmp`;
    await fs.writeFile(tmpPath, JSON.stringify(rows, null, 2), "utf8");
    JSON.parse(await fs.readFile(tmpPath, "utf8"));
    await fs.rename(tmpPath, this.storePath);
  }

  async list(): Promise<Registration[]> {
    return this.load();
  }

  async create(registration: Registration): Promise<void> {
    const rows = await this.load();
    rows.push(registration);
    await this.save(rows);
  }

  async findActiveByEmail(email: string, workshopId: string): Promise<Registration | null> {
    const rows = await this.load();
    return (
      rows.find(
        (r) => r.email === email && r.workshopId === workshopId && r.status === "active",
      ) ?? null
    );
  }

  async cancel(id: string, cancelledAt: string): Promise<Registration | null> {
    const rows = await this.load();
    const row = rows.find((r) => r.id === id && r.status === "active");
    if (!row) return null;
    row.status = "cancelled";
    row.cancelledAt = cancelledAt;
    await this.save(rows);
    return { ...row };
  }
}
