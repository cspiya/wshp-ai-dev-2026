import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

// TASK-05 is intentionally unimplemented in this catch-up snapshot: the page
// must render the registration form, the active list with cancel buttons, and
// a visible error surface for the 409 paths. UI copy is Hungarian.
export default function RegisztracioPage() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-6 p-8">
      <Card>
        <CardHeader>
          <CardTitle>KK-Regisztráció — folyamatban</CardTitle>
          <CardDescription>Kitalált minta-munkadarab (catch-up kiindulópont).</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 text-sm text-muted-foreground">
          <p>
            Ez a szelet még készül: a domain és a memória-adapter kész, a
            fájl-adapter (TASK-03), az API (TASK-04) és ez az oldal (TASK-05)
            a te feladatod.
          </p>
          <p>A jóváhagyott szerződést a spec-csomag rögzíti — onnan indulj.</p>
        </CardContent>
      </Card>
    </main>
  );
}
