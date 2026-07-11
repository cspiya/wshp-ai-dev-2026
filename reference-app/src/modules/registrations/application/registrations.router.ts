import { TRPCError } from "@trpc/server";

import { publicProcedure, router } from "@/platform/api/trpc";

import {
  canCancelRegistration,
  registrationInputSchema,
  registrationSchema,
  type Registration,
  type RegistrationRecordInput,
  type RegistrationStatus,
} from "../domain/registration";

export interface RegistrationRepo {
  list(): Promise<Registration[]>;
  getById(id: string): Promise<Registration | null>;
  create(input: RegistrationRecordInput): Promise<Registration>;
  transitionStatus(
    id: string,
    expectedStatuses: RegistrationStatus[],
    nextStatus: RegistrationStatus,
    cancelledAt: string | null,
  ): Promise<Registration | null>;
}

export interface WorkshopSchedule {
  getStartsAt(workshopId: string): Promise<string | null>;
}

export type Clock = () => Date;

const idInput = registrationSchema.pick({ id: true });
const notFound = (id: string) =>
  new TRPCError({ code: "NOT_FOUND", message: `Registration ${id} not found` });

const conflict = (message: string) => new TRPCError({ code: "CONFLICT", message });

export function createRegistrationsRouter(
  repo: RegistrationRepo,
  schedule: WorkshopSchedule,
  clock: Clock = () => new Date(),
) {
  return router({
    list: publicProcedure.query(() => repo.list()),
    create: publicProcedure.input(registrationInputSchema).mutation(async ({ input }) => {
      const workshopStartsAt = await schedule.getStartsAt(input.workshopId);
      if (!workshopStartsAt) {
        throw new TRPCError({ code: "NOT_FOUND", message: `Workshop ${input.workshopId} not found` });
      }
      return repo.create({ ...input, workshopStartsAt });
    }),
    confirm: publicProcedure.input(idInput).mutation(async ({ input }) => {
      const registration = await repo.getById(input.id);
      if (!registration) throw notFound(input.id);
      if (registration.status !== "pending") {
        throw conflict("Only pending registrations can be confirmed");
      }
      const updated = await repo.transitionStatus(input.id, ["pending"], "confirmed", null);
      if (!updated) throw conflict("Registration status changed concurrently");
      return updated;
    }),
    cancel: publicProcedure.input(idInput).mutation(async ({ input }) => {
      const registration = await repo.getById(input.id);
      if (!registration) throw notFound(input.id);
      if (registration.status === "cancelled") {
        throw conflict("Registration is already cancelled");
      }
      const now = clock();
      if (!canCancelRegistration(registration.workshopStartsAt, now)) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "Cancellation closes 48 hours before the workshop starts",
        });
      }
      const updated = await repo.transitionStatus(
        input.id,
        ["pending", "confirmed"],
        "cancelled",
        now.toISOString(),
      );
      if (!updated) throw conflict("Registration status changed concurrently");
      return updated;
    }),
  });
}
