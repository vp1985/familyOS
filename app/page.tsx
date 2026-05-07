import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const features = [
  "Kinder-Finanzen und Guthaben sichtbar machen",
  "Gemeinsame Ausgaben sauber aufteilen",
  "Regeln, Konsequenzen und Belohnungen dokumentieren",
];

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-100 px-5 py-8">
      <section className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-md flex-col justify-between">
        <div className="space-y-8 pt-12 text-white">
          <div className="inline-flex rounded-full border border-white/15 bg-white/10 px-3 py-1 text-sm text-white/80">
            FamilyOS MVP
          </div>
          <div className="space-y-4">
            <h1 className="text-4xl font-bold tracking-tight">Familien-Cockpit für Geld, Regeln und Belohnungen.</h1>
            <p className="text-lg leading-8 text-slate-200">
              Sprint 0 legt die technische Basis für eine mobile Familien-App: schnell, klar und modular erweiterbar.
            </p>
          </div>
        </div>

        <Card className="mb-4 border-white/50 bg-white/95 shadow-2xl">
          <CardHeader>
            <CardTitle>V1-Fokus</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="space-y-3 text-sm text-slate-700">
              {features.map((feature) => (
                <li key={feature} className="flex gap-2">
                  <span className="mt-1 h-2 w-2 rounded-full bg-emerald-500" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
            <Button asChild className="w-full">
              <Link href="/app">App-Shell ansehen</Link>
            </Button>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
