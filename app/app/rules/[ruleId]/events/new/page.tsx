import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createRuleEventAction } from "@/app/app/rules/actions";
import { getRuleEventFormData } from "@/lib/rules";

function errorText(error?: string) {
  if (error === "invalid-event") return "Bitte wähle ein Familienmitglied und beschreibe das Ereignis.";
  if (error === "invalid-context") return "Regel oder Familienmitglied passt nicht zu deiner Familie.";
  return null;
}

export default async function NewRuleEventPage({
  params,
  searchParams,
}: {
  params: Promise<{ ruleId: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const [{ ruleId }, query] = await Promise.all([params, searchParams]);
  const [{ rule, members }] = await Promise.all([getRuleEventFormData(ruleId)]);
  const action = createRuleEventAction.bind(null, rule.id);
  const error = errorText(query.error);

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm font-medium text-emerald-600">{rule.title}</p>
        <h2 className="text-2xl font-bold text-slate-950">Regelverstoß dokumentieren</h2>
        <p className="mt-1 text-sm text-slate-600">Kurz festhalten, was passiert ist und wen es betrifft.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ereignis</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={action} className="space-y-4">
            {error ? <p className="rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-800">{error}</p> : null}
            <label className="grid gap-2 text-sm font-medium text-slate-800" htmlFor="familyMemberId">
              Betroffenes Familienmitglied
              <select
                id="familyMemberId"
                name="familyMemberId"
                required
                defaultValue=""
                className="min-h-11 rounded-2xl border border-slate-200 bg-white px-4 text-base text-slate-950 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              >
                <option value="" disabled>Bitte wählen</option>
                {members.map((member) => (
                  <option key={member.id} value={member.id}>{member.name}</option>
                ))}
              </select>
            </label>
            <label className="grid gap-2 text-sm font-medium text-slate-800" htmlFor="note">
              Was ist passiert?
              <textarea
                id="note"
                name="note"
                rows={4}
                required
                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-950 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                placeholder="z. B. Tablet länger genutzt als vereinbart"
              />
            </label>

            <div className="grid grid-cols-2 gap-3">
              <Button asChild className="bg-white text-slate-800 ring-1 ring-slate-200 hover:bg-slate-50">
                <Link href="/app/rules">Abbrechen</Link>
              </Button>
              <Button type="submit" disabled={members.length === 0}>Speichern</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
