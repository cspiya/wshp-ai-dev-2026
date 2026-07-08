import { createTRPCReact } from "@trpc/react-query";

import type { AppRouter } from "@/platform/api/root";

/** Typed client hooks: `trpc.<router>.<procedure>.useQuery/useMutation`. */
export const trpc = createTRPCReact<AppRouter>();
