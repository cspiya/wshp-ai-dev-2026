import { readWorkshops } from "@/lib/registrations/file-repo";
import { RegistrationPanel } from "./registration-panel";

// Server component: reads the invented workshop catalog and hands it to the
// interactive client panel. UI copy is Hungarian (participant-facing).
export default async function RegisztracioPage() {
  const workshops = await readWorkshops();
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-6 p-8">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">KK-Regisztráció</h1>
        <p className="text-sm text-muted-foreground">
          Kitalált minta-munkadarab: jelentkezés műhelyre névvel és e-mail-címmel.
          A regisztráció a kezdés előtt 48 óráig mondható le.
        </p>
      </header>
      <RegistrationPanel workshops={workshops} />
    </main>
  );
}
