import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormField } from "@/components/ui/form-field";
import { createProjectExpenseAction } from "@/app/app/projects/actions";
import { getProjectDetail, getProjectFormData } from "@/lib/projects";

function errorText(error?: string) {
  if (error === "invalid-members") return "Bitte wähle nur gültige Projektbeteiligte aus.";
  if (error === "invalid-split") return "Die Aufteilung konnte nicht sauber berechnet werden.";
  if (error === "invalid-expense") return "Bitte fülle Titel, Betrag, Zahler und Beteiligte korrekt aus.";
  return null;
}

export default async function NewProjectExpensePage({
  params,
  searchParams,
}: {
  params: Promise<{ projectId: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const [{ projectId }, paramsValue] = await Promise.all([params, searchParams]);
  const [{ project }, { members }] = await Promise.all([getProjectDetail(projectId), getProjectFormData()]);
  const error = errorText(paramsValue.error);
  const action = createProjectExpenseAction.bind(null, project.id);

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm font-medium text-emerald-600">{project.title}</p>
        <h2 className="text-2xl font-bold text-slate-950">Ausgabe hinzufügen</h2>
        <p className="mt-1 text-sm text-slate-600">Sprint 4 teilt Ausgaben gleichmäßig auf die ausgewählten Personen auf.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ausgabe</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={action} className="space-y-4">
            {error ? <p className="rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-800">{error}</p> : null}
            <FormField label="Titel" name="title" placeholder="z. B. Eintritt" required />
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Betrag" name="amount" inputMode="decimal" placeholder="120,00" required />
              <label className="grid gap-2 text-sm font-medium text-slate-800" htmlFor="paidByMemberId">
                Bezahlt von
                <select
                  id="paidByMemberId"
                  name="paidByMemberId"
                  required
                  className="min-h-11 rounded-2xl border border-slate-200 bg-white px-4 text-base text-slate-950 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                >
                  <option value="">Bitte wählen</option>
                  {members.map((member) => (
                    <option key={member.id} value={member.id}>{member.name}</option>
                  ))}
                </select>
              </label>
            </div>
            <label className="grid gap-2 text-sm font-medium text-slate-800" htmlFor="description">
              Notiz optional
              <textarea
                id="description"
                name="description"
                rows={3}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-950 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                placeholder="Kurze Info zur Ausgabe"
              />
            </label>

            <fieldset className="space-y-2">
              <legend className="text-sm font-semibold text-slate-800">Aufteilen auf</legend>
              <div className="grid gap-2">
                {project.participants.map((participant) => (
                  <label key={participant.id} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-800">
                    <input name="shareMemberIds" value={participant.familyMemberId} type="checkbox" className="h-5 w-5 rounded border-slate-300 text-emerald-600" />
                    <span className="text-xl" aria-hidden="true">{participant.member.icon ?? "👤"}</span>
                    <span>{participant.member.name}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
              Die Summe wird automatisch gleichmäßig verteilt. Rundungsreste gehen an die zuerst ausgewählten Personen.
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button asChild className="bg-white text-slate-800 ring-1 ring-slate-200 hover:bg-slate-50">
                <Link href={`/app/projects/${project.id}`}>Abbrechen</Link>
              </Button>
              <Button type="submit">Speichern</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
