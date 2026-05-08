import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const features = [
  "Familienprofile für Kinder, Eltern und weitere Personen",
  "Kinder-Finanzen mit Guthaben und Transaktionshistorie",
  "Gemeinsame Ausgaben in Projekten sauber aufteilen",
  "Regeln mit Kategorien und aktivem Status verwalten",
  "Regel-Ereignisse dokumentieren und nachvollziehen",
  "Folgen bzw. Konsequenzen erfassen und abschließen",
  "Punkte vergeben, abziehen und Rangliste sehen",
  "Belohnungen anlegen und gegen Punkte einlösen",
  "Badges manuell vergeben",
  "Start-Dashboard mit Heute-wichtig-Übersicht",
  "Wochenplan mit Terminen von Montag bis Sonntag",
];

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-100 px-5 py-8">
      <section className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-md flex-col justify-between gap-6">
        <div className="space-y-8 pt-12 text-white">
          <div className="inline-flex rounded-full border border-white/15 bg-white/10 px-3 py-1 text-sm text-white/80">
            FamilyOS Beta-Variante
          </div>
          <div className="space-y-4">
            <h1 className="text-4xl font-bold tracking-tight">FamilyOS für euren Familienalltag.</h1>
            <p className="text-lg leading-8 text-slate-200">
              FamilyOS ist aktuell in der Beta-Variante. Die App bündelt Geld, Regeln, Folgen, Punkte, Belohnungen und Wochenplanung in einem mobilen Familien-Cockpit.
            </p>
          </div>
        </div>

        <Card className="mb-4 border-white/50 bg-white/95 shadow-2xl">
          <CardHeader>
            <CardTitle>Aktuell enthaltene Funktionen</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="space-y-3 text-sm text-slate-700">
              {features.map((feature) => (
                <li key={feature} className="flex gap-2">
                  <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-emerald-500" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
            <div className="grid gap-2">
              <Button asChild className="w-full">
                <Link href="/register">Familie erstellen</Link>
              </Button>
              <Link className="text-center text-sm font-semibold text-slate-700" href="/login">
                Einloggen
              </Link>
            </div>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
