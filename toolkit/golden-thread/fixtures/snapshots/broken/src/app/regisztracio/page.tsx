import { FileRegistrationRepo, readWorkshops } from "@/lib/registrations/file-repo";
import { RegistrationPanel } from "./registration-panel";

// The page reads the file store per request, never at build time.
export const dynamic = "force-dynamic";

// Server component: reads the invented workshop catalog plus the current
// registrations and hands both to the interactive client panel. UI copy is
// Hungarian (participant-facing).
export default async function RegisztracioPage() {
  const workshops = await readWorkshops();
  const initialRegistrations = await new FileRegistrationRepo().list();
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-6 p-8">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">KK-Regisztráció</h1>
        <p className="text-sm text-muted-foreground">
          Kitalált minta-munkadarab: jelentkezés műhelyre névvel és e-mail-címmel.
          A regisztráció a kezdés előtt 48 óráig mondható le.
        </p>
      </header>
      <RegistrationPanel workshops={workshops} initialRegistrations={initialRegistrations} />
    </main>
  );
}
