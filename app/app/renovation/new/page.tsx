import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormField } from "@/components/ui/form-field";
import { createRenovationProjectAction } from "../actions";

function errorText(error?: string) {
  if (error === "invalid-project") return "Bitte gib mindestens einen Titel ein. Das Budget ist optional.";
  return null;
}

export default async function NewRenovationPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const params = await searchParams;
  const error = errorText(params.error);

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm font-medium text-emerald-600">Neue Renovierung</p>
        <h2 className="text-2xl font-bold text-slate-950">Renovierungsprojekt anlegen</h2>
        <p className="mt-1 text-sm text-slate-600">Starte mit einem Vorhaben. Räume und Grundriss kommen im nächsten Schritt dazu.</p>
      </div>

      <Card>
        <CardHeader><CardTitle>Projekt</CardTitle></CardHeader>
        <CardContent>
          <form action={createRenovationProjectAction} className="space-y-4">
            {error ? <p className="rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-800">{error}</p> : null}
            <FormField label="Titel" name="title" placeholder="z. B. Kinderzimmer renovieren" required />
            <label className="grid gap-2 text-sm font-medium text-slate-800" htmlFor="description">
              Beschreibung optional
              <textarea id="description" name="description" rows={3} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-950 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100" placeholder="Was soll gemacht werden?" />
            </label>
            <FormField label="Budget optional" name="budget" inputMode="decimal" placeholder="1200,00" />
            <div className="grid grid-cols-2 gap-3">
              <Button asChild className="bg-white text-slate-800 ring-1 ring-slate-200 hover:bg-slate-50"><Link href="/app/renovation">Abbrechen</Link></Button>
              <Button type="submit">Speichern</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
