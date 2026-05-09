import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { formatCents } from "@/lib/finances";
import {
  getHouseholdBudgetData,
  householdBudgetCategorySuggestions,
  householdBudgetDirectionLabel,
  householdBudgetKindLabel,
} from "@/lib/household-budget";
import {
  createHouseholdBudgetEntryAction,
  createHouseholdBudgetPlanItemAction,
  deactivateHouseholdBudgetPlanItemAction,
} from "./actions";

function errorText(error?: string) {
  if (error === "invalid-amount") return "Bitte gib einen gültigen Betrag ein, z. B. 50 oder 50,00.";
  if (error === "invalid-plan-item") return "Bitte fülle Titel, Kategorie und Betrag aus.";
  if (error === "invalid-entry") return "Bitte fülle die Ausgabe/Einnahme vollständig aus.";
  if (error === "invalid-date") return "Bitte wähle ein gültiges Datum.";
  return null;
}

const directionOptions = [
  ["INCOME", "Einnahme"],
  ["EXPENSE", "Ausgabe"],
] as const;

const kindOptions = [
  ["FIXED", "Fixkosten"],
  ["VARIABLE", "Variabel"],
  ["SAVING", "Sparen"],
  ["DEBT", "Schulden"],
  ["OTHER", "Sonstiges"],
] as const;

export default async function BudgetPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; month?: string }>;
}) {
  const params = await searchParams;
  const { month, planItems, entries, summary } = await getHouseholdBudgetData(params.month);
  const error = errorText(params.error);

  return (
    <div className="space-y-5">
      <section className="rounded-3xl bg-slate-950 p-5 text-white shadow-sm">
        <p className="text-sm text-slate-300">Eltern-Haushaltsplan</p>
        <h2 className="mt-2 text-3xl font-bold">{formatCents(summary.plannedBalanceCents)}</h2>
        <p className="mt-2 text-sm text-slate-300">Geplant übrig pro Monat · Ist diesen Monat: {formatCents(summary.actualBalanceCents)}</p>
      </section>

      {error ? <p className="rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-800">{error}</p> : null}

      <section className="grid grid-cols-2 gap-3">
        <Card><CardContent><p className="text-xs font-semibold uppercase text-emerald-700">Geplante Einnahmen</p><p className="mt-1 text-xl font-black text-slate-950">{formatCents(summary.plannedIncomeCents)}</p></CardContent></Card>
        <Card><CardContent><p className="text-xs font-semibold uppercase text-rose-700">Geplante Ausgaben</p><p className="mt-1 text-xl font-black text-slate-950">{formatCents(summary.plannedExpenseCents)}</p></CardContent></Card>
        <Card><CardContent><p className="text-xs font-semibold uppercase text-emerald-700">Ist-Einnahmen {month}</p><p className="mt-1 text-xl font-black text-slate-950">{formatCents(summary.actualIncomeCents)}</p></CardContent></Card>
        <Card><CardContent><p className="text-xs font-semibold uppercase text-rose-700">Ist-Ausgaben {month}</p><p className="mt-1 text-xl font-black text-slate-950">{formatCents(summary.actualExpenseCents)}</p></CardContent></Card>
      </section>

      <Card>
        <CardHeader><CardTitle>Monatlichen Posten planen</CardTitle></CardHeader>
        <CardContent>
          <form action={createHouseholdBudgetPlanItemAction} className="space-y-4">
            <FormField label="Titel" name="title" placeholder="Miete" required />
            <FormField label="Kategorie" name="category" placeholder="Wohnen" list="budget-categories" required />
            <FormField label="Betrag" name="amount" placeholder="850,00" inputMode="decimal" required />
            <div className="grid grid-cols-2 gap-3">
              <label className="grid gap-1 text-sm font-medium text-slate-700">
                Art
                <select name="direction" className="min-h-11 rounded-2xl border border-slate-200 bg-white px-3 text-base text-slate-950" defaultValue="EXPENSE">
                  {directionOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
              </label>
              <label className="grid gap-1 text-sm font-medium text-slate-700">
                Typ
                <select name="kind" className="min-h-11 rounded-2xl border border-slate-200 bg-white px-3 text-base text-slate-950" defaultValue="FIXED">
                  {kindOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
              </label>
            </div>
            <datalist id="budget-categories">
              {householdBudgetCategorySuggestions.map((suggestion) => <option key={suggestion} value={suggestion} />)}
            </datalist>
            <Button className="w-full" type="submit">Posten speichern</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Ausgabe oder Einnahme eintragen</CardTitle></CardHeader>
        <CardContent>
          <form action={createHouseholdBudgetEntryAction} className="space-y-4">
            <label className="grid gap-1 text-sm font-medium text-slate-700">
              Planposten optional
              <select name="planItemId" className="min-h-11 rounded-2xl border border-slate-200 bg-white px-3 text-base text-slate-950">
                <option value="">Freier Eintrag</option>
                {planItems.map((item) => <option key={item.id} value={item.id}>{item.title} · {formatCents(item.amountCents)}</option>)}
              </select>
            </label>
            <FormField label="Titel" name="title" placeholder="Wocheneinkauf" required />
            <FormField label="Kategorie" name="category" placeholder="Lebensmittel" list="budget-categories" required />
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Betrag" name="amount" placeholder="73,45" inputMode="decimal" required />
              <FormField label="Datum" name="occurredAt" type="date" />
            </div>
            <label className="grid gap-1 text-sm font-medium text-slate-700">
              Art
              <select name="direction" className="min-h-11 rounded-2xl border border-slate-200 bg-white px-3 text-base text-slate-950" defaultValue="EXPENSE">
                {directionOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </label>
            <Button className="w-full" type="submit">Eintrag speichern</Button>
          </form>
        </CardContent>
      </Card>

      <section className="space-y-3">
        <h3 className="text-lg font-semibold text-slate-950">Geplante Posten</h3>
        {planItems.length === 0 ? (
          <Card><CardContent className="text-sm text-slate-600">Noch keine Budgetposten. Starte mit Gehalt, Miete, Lebensmittel oder Sparen.</CardContent></Card>
        ) : (
          <div className="grid gap-3">
            {planItems.map((item) => (
              <Card key={item.id}>
                <CardContent className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-slate-950">{item.title}</p>
                    <p className="text-xs text-slate-500">{householdBudgetDirectionLabel(item.direction)} · {householdBudgetKindLabel(item.kind)} · {item.category}</p>
                  </div>
                  <div className="text-right">
                    <p className={item.direction === "INCOME" ? "font-black text-emerald-700" : "font-black text-rose-700"}>{item.direction === "INCOME" ? "+" : "-"}{formatCents(item.amountCents)}</p>
                    <form action={deactivateHouseholdBudgetPlanItemAction}>
                      <input type="hidden" name="itemId" value={item.id} />
                      <button type="submit" className="text-xs font-semibold text-slate-400">ausblenden</button>
                    </form>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h3 className="text-lg font-semibold text-slate-950">Ist-Buchungen {month}</h3>
        {entries.length === 0 ? (
          <Card><CardContent className="text-sm text-slate-600">Noch keine Ist-Buchungen für diesen Monat.</CardContent></Card>
        ) : (
          <div className="grid gap-3">
            {entries.map((entry) => (
              <Card key={entry.id}>
                <CardContent className="flex items-center justify-between gap-3 text-sm">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-slate-950">{entry.title}</p>
                    <p className="text-xs text-slate-500">{entry.category} · {new Intl.DateTimeFormat("de-DE").format(entry.occurredAt)}</p>
                  </div>
                  <p className={entry.direction === "INCOME" ? "font-black text-emerald-700" : "font-black text-rose-700"}>{entry.direction === "INCOME" ? "+" : "-"}{formatCents(entry.amountCents)}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
