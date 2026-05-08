import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormField } from "@/components/ui/form-field";
import { createConsequenceAction } from "@/app/app/consequences/actions";
import { getConsequenceFormData } from "@/lib/consequences";

function errorText(error?: string) {
  if (error === "invalid-consequence") return "Bitte gib Titel und Familienmitglied an.";
  if (error === "invalid-context") return "Familienmitglied oder Regelereignis passt nicht zu deiner Familie.";
  return null;
}

export default async function NewConsequencePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const [{ members, ruleEvents }, params] = await Promise.all([getConsequenceFormData(), searchParams]);
  const error = errorText(params.error);

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm font-medium text-emerald-600">Neue Konsequenz</p>
        <h2 className="text-2xl font-bold text-slate-950">Konsequenz anlegen</h2>
        <p className="mt-1 text-sm text-slate-600">Lege fest, was gilt, für wen und bis wann.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Konsequenz</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createConsequenceAction} className="space-y-4">
            {error ? <p className="rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-800">{error}</p> : null}
            <FormField label="Titel" name="title" placeholder="z. B. Kein Tablet" required />
            <label className="grid gap-2 text-sm font-medium text-slate-800" htmlFor="familyMemberId">
              Für wen?
              <select id="familyMemberId" name="familyMemberId" required defaultValue="" className="min-h-11 rounded-2xl border border-slate-200 bg-white px-4 text-base text-slate-950 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100">
                <option value="" disabled>Bitte wählen</option>
                {members.map((member) => (
                  <option key={member.id} value={member.id}>{member.name}</option>
                ))}
              </select>
            </label>
            <label className="grid gap-2 text-sm font-medium text-slate-800" htmlFor="ruleEventId">
              Bezug zu Regelverstoß optional
              <select id="ruleEventId" name="ruleEventId" defaultValue="" className="min-h-11 rounded-2xl border border-slate-200 bg-white px-4 text-base text-slate-950 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100">
                <option value="">Ohne direkten Bezug</option>
                {ruleEvents.map((event) => (
                  <option key={event.id} value={event.id}>{event.member.name}: {event.rule.title}</option>
                ))}
              </select>
            </label>
            <label className="grid gap-2 text-sm font-medium text-slate-800" htmlFor="description">
              Beschreibung optional
              <textarea id="description" name="description" rows={3} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-950 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100" placeholder="Was genau gilt?" />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Start" name="startDate" type="date" />
              <FormField label="Ende optional" name="endDate" type="date" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button asChild className="bg-white text-slate-800 ring-1 ring-slate-200 hover:bg-slate-50">
                <Link href="/app/consequences">Abbrechen</Link>
              </Button>
              <Button type="submit" disabled={members.length === 0}>Speichern</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
