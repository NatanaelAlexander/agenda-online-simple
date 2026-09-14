import Link from "next/link";
import { Button } from "@/components/ui/button";

export function LandingHero() {
  return (
    <div className="relative flex min-h-[100dvh] flex-col overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,oklch(0.72_0.08_180/0.35),transparent_55%),radial-gradient(ellipse_60%_50%_at_100%_50%,oklch(0.65_0.06_200/0.2),transparent_50%),linear-gradient(to_bottom,oklch(0.985_0.012_90),oklch(0.97_0.01_85))]"
        aria-hidden
      />
      <header className="relative z-10 px-6 py-8">
        <span className="font-heading text-lg font-semibold tracking-tight text-foreground">
          Agenda online simple
        </span>
      </header>
      <main className="relative z-10 flex flex-1 flex-col justify-center px-6 pb-24">
        <div className="mx-auto w-full max-w-2xl text-center">
          <h1 className="font-heading text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            Tu agenda, sin complicaciones
          </h1>
          <p className="mx-auto mt-4 max-w-lg text-base text-muted-foreground sm:text-lg">
            Reservas online para tu negocio y un panel claro para el equipo.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/login">
              <Button size="lg">Entrar al panel</Button>
            </Link>
            <Link href="/r/barberia-demo">
              <Button variant="outline" size="lg">
                Ver demo pública
              </Button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
