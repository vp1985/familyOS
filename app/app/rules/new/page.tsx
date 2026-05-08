import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormField } from "@/components/ui/form-field";
import { createRuleAction } from "@/app/app/rules/actions";
import { getRuleFormData } from "@/lib/rules";

function errorText(error?: string) {
  if (error === "invalid-rule") return "Bitte gib Titel und Kategorie an.";
  return null;
}

export default async function NewRulePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const [, params] = await Promise.all([getRuleFormData(), searchParams]);
  const error = errorText(params.error);

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm font-medium text-emerald-600">Neue Regel</p>
        <h2 className="text-2xl font-bold text-slate-950">Regel anlegen</h2>
        <p className="mt-1 text-sm text-slate-600">Formuliere klar, was in eurer Familie gilt.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Regel</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createRuleAction} className="space-y-4">
            {error ? <p className="rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-800">{error}</p> : null}
            <FormField label="Titel" name="title" placeholder="z. B. Handyzeit" required />
            <label className="grid gap-2 text-sm font-medium text-slate-800" htmlFor="category">
              Kategorie
              <select
                id="category"
                name="category"
                required
                defaultValue=""
                className="min-h-11 rounded-2xl border border-slate-200 bg-white px-4 text-base text-slate-950 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              >
                <option value="" disabled>Bitte wählen</option>
                <option value="medien">Medien</option>
                <option value="ordnung">Ordnung</option>
                <option value="schule">Schule</option>
                <option value="umgang">Umgang</option>
                <option value="gesundheit">Gesundheit</option>
              </select>
            </label>
            <label className="grid gap-2 text-sm font-medium text-slate-800" htmlFor="description">
              Beschreibung optional
              <textarea
                id="description"
                name="description"
                rows={4}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-950 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                placeholder="Was genau gilt?"
              />
            </label>
            <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-800">
              <input name="isActive" type="checkbox" defaultChecked className="h-5 w-5 rounded border-slate-300 text-emerald-600" />
              Regel ist aktiv
            </label>

            <div className="grid grid-cols-2 gap-3">
              <Button asChild className="bg-white text-slate-800 ring-1 ring-slate-200 hover:bg-slate-50">
                <Link href="/app/rules">Abbrechen</Link>
              </Button>
              <Button type="submit">Speichern</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
