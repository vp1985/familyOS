import Link from "next/link";
import { createMealPlanEntryAction } from "@/app/app/meals/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormField } from "@/components/ui/form-field";
import { getMealPlannerPageData, mealKindLabel } from "@/lib/meal-planner";

function errorText(error?: string) {
  if (error === "invalid-plan") return "Bitte gib Gericht und Datum korrekt an.";
  if (error === "invalid-member") return "Bitte wähle nur Personen aus deiner Familie.";
  return null;
}

function isoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

export default async function MealsPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const [{ members, week, days }, params] = await Promise.all([getMealPlannerPageData(), searchParams]);
  const error = errorText(params.error);

  return (
    <div className="space-y-5">
      <section className="rounded-[2rem] bg-gradient-to-br from-orange-950 via-slate-900 to-emerald-950 p-5 text-white shadow-sm">
        <p className="text-sm text-orange-200">Essensplaner</p>
        <h2 className="mt-2 text-2xl font-bold">Wochenplan fürs Essen</h2>
        <p className="mt-3 text-sm leading-6 text-slate-300">
          Plane Frühstück, Mittag und Abendessen für die ganze Woche. Sichtbare Gerichte sind als Vorschlagsquelle für VeraVital vorbereitet.
        </p>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Gericht eintragen</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createMealPlanEntryAction} className="space-y-4">
            {error ? <p className="rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-800">{error}</p> : null}
            <FormField label="Gericht" name="dishName" placeholder="z. B. Nudeln mit Tomatensauce" required />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <FormField label="Datum" name="plannedDate" type="date" defaultValue={isoDate(new Date())} required />
              <label className="grid gap-2 text-sm font-medium text-slate-800" htmlFor="mealKind">
                Mahlzeit
                <select
                  id="mealKind"
                  name="mealKind"
                  defaultValue="DINNER"
                  className="min-h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-base text-slate-950 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                >
                  <option value="BREAKFAST">Frühstück</option>
                  <option value="LUNCH">Mittag</option>
                  <option value="DINNER">Abendessen</option>
                  <option value="UNSPECIFIED">Essen</option>
                </select>
              </label>
            </div>
            <label className="grid gap-2 text-sm font-medium text-slate-800" htmlFor="familyMemberId">
              Person optional
              <select
                id="familyMemberId"
                name="familyMemberId"
                defaultValue=""
                className="min-h-11 rounded-2xl border border-slate-200 bg-white px-4 text-base text-slate-950 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              >
                <option value="">Alle / Familie</option>
                {members.map((member) => (
                  <option key={member.id} value={member.id}>{member.name}</option>
                ))}
              </select>
            </label>
            <label className="grid gap-2 text-sm font-medium text-slate-800" htmlFor="note">
              Notiz optional
              <textarea
                id="note"
                name="note"
                rows={3}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-950 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                placeholder="z. B. Reste verwerten, Rezept-Link, Einkaufshinweis ..."
              />
            </label>
            <label className="flex items-start gap-3 rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-950">
              <input type="checkbox" name="visibleInNutrition" defaultChecked className="mt-1" />
              <span>Für spätere VeraVital-Gerichte-Vorschläge freigeben</span>
            </label>
            <Button type="submit" className="w-full">Gericht speichern</Button>
          </form>
        </CardContent>
      </Card>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-slate-950">Wochenübersicht</h3>
            <p className="text-sm text-slate-500">{isoDate(week.start)} bis {isoDate(new Date(week.end.getTime() - 1))}</p>
          </div>
          <Link href="/app" className="text-sm font-semibold text-emerald-700">Start</Link>
        </div>
        <div className="grid gap-3">
          {days.map((day) => (
            <article key={day.key} className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <h4 className="font-semibold text-slate-950">{day.label}</h4>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">{day.plans.length}</span>
              </div>
              {day.plans.length > 0 ? (
                <div className="mt-3 grid gap-2">
                  {day.plans.map((plan) => (
                    <div key={plan.id} className="rounded-2xl bg-slate-50 px-4 py-3 text-sm">
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-semibold text-slate-950">{plan.dishName}</p>
                        <span className="text-xs font-semibold text-orange-700">{mealKindLabel(plan.mealKind)}</span>
                      </div>
                      <p className="mt-1 text-xs text-slate-500">{plan.member?.name ?? "Familie"}{plan.visibleInNutrition ? " · VeraVital-Vorschlag" : ""}</p>
                      {plan.note ? <p className="mt-2 text-sm text-slate-600">{plan.note}</p> : null}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-3 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-500">Noch kein Essen geplant.</p>
              )}
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
