import { createTaskTemplateAction } from "@/app/app/tasks/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { FormField } from "@/components/ui/form-field";
import { getNewTaskPageData } from "@/lib/tasks";

function isoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

export default async function NewTaskPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const [{ members }, params] = await Promise.all([getNewTaskPageData(), searchParams]);
  const error = params.error === "invalid-task" ? "Bitte prüfe Titel, Person, Datum und Belohnungen." : params.error === "invalid-member" ? "Bitte wähle nur Personen aus deiner Familie." : null;

  return (
    <div className="space-y-5">
      <section>
        <p className="text-sm font-medium text-emerald-600">Aufgaben</p>
        <h2 className="text-2xl font-bold text-slate-950">Aufgabe anlegen</h2>
        <p className="mt-1 text-sm text-slate-600">Mit Unteraufgaben, Wiederholung und optionaler Belohnung: Drachmen, XP, Geldbonus oder Badge.</p>
      </section>

      {members.length === 0 ? <EmptyState title="Noch keine Familienprofile" description="Lege zuerst Personen an, dann können Aufgaben zugewiesen werden." /> : null}

      <Card>
        <CardHeader><CardTitle>Neue Aufgabe</CardTitle></CardHeader>
        <CardContent>
          <form action={createTaskTemplateAction} className="space-y-4">
            {error ? <p className="rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-800">{error}</p> : null}
            <FormField label="Titel" name="title" placeholder="z. B. Zimmer aufräumen" required />
            <label className="grid gap-2 text-sm font-medium text-slate-800" htmlFor="description">
              Beschreibung optional
              <textarea id="description" name="description" rows={3} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-950 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100" placeholder="Was genau soll erledigt werden?" />
            </label>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <FormField label="Kategorie" name="category" defaultValue="haushalt" required />
              <label className="grid gap-2 text-sm font-medium text-slate-800" htmlFor="priority">
                Priorität
                <select id="priority" name="priority" defaultValue="medium" className="min-h-11 rounded-2xl border border-slate-200 bg-white px-4 text-base text-slate-950 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100">
                  <option value="low">Niedrig</option>
                  <option value="medium">Normal</option>
                  <option value="high">Hoch</option>
                </select>
              </label>
            </div>

            <fieldset className="space-y-2 rounded-3xl bg-slate-50 p-4">
              <legend className="text-sm font-semibold text-slate-950">Personen zuweisen</legend>
              {members.map((member) => (
                <label key={member.id} className="flex items-center gap-2 text-sm text-slate-700">
                  <input type="checkbox" name="familyMemberId" value={member.id} className="h-4 w-4 rounded border-slate-300" />
                  <span>{member.icon ?? "👤"} {member.name}</span>
                </label>
              ))}
            </fieldset>

            <fieldset className="space-y-3 rounded-3xl bg-slate-50 p-4">
              <legend className="text-sm font-semibold text-slate-950">Unteraufgaben</legend>
              <FormField label="Unteraufgabe 1" name="subtask" placeholder="z. B. Bett machen" />
              <FormField label="Unteraufgabe 2" name="subtask" placeholder="z. B. Wäsche in den Korb" />
              <FormField label="Unteraufgabe 3" name="subtask" placeholder="optional" />
            </fieldset>

            <fieldset className="space-y-3 rounded-3xl bg-slate-50 p-4">
              <legend className="text-sm font-semibold text-slate-950">Wiederholung</legend>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="grid gap-2 text-sm font-medium text-slate-800" htmlFor="recurrenceType">
                  Wiederholung
                  <select id="recurrenceType" name="recurrenceType" defaultValue="once" className="min-h-11 rounded-2xl border border-slate-200 bg-white px-4 text-base text-slate-950 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100">
                    <option value="once">Einmalig</option>
                    <option value="daily">Täglich</option>
                    <option value="weekly">Wöchentlich</option>
                    <option value="monthly">Monatlich</option>
                    <option value="weekdays">Bestimmte Wochentage</option>
                  </select>
                </label>
                <FormField label="Startdatum" name="startsAt" type="date" defaultValue={isoDate(new Date())} required />
                <FormField label="Enddatum optional" name="endsAt" type="date" />
                <FormField label="Uhrzeit optional" name="dueTime" type="time" />
              </div>
              <div className="grid grid-cols-4 gap-2 text-sm sm:grid-cols-7">
                {["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"].map((label, index) => (
                  <label key={label} className="flex items-center gap-1 rounded-2xl bg-white px-2 py-2">
                    <input type="checkbox" name="weekday" value={index} className="h-4 w-4 rounded border-slate-300" /> {label}
                  </label>
                ))}
              </div>
            </fieldset>

            <fieldset className="space-y-3 rounded-3xl bg-emerald-50 p-4">
              <legend className="text-sm font-semibold text-emerald-950">Optionale Belohnung</legend>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <FormField label="Drachmen" name="drachmenReward" type="number" min="0" placeholder="10" />
                <FormField label="XP" name="xpReward" type="number" min="0" placeholder="5" />
                <FormField label="Geldbonus" name="moneyRewardEuro" inputMode="decimal" placeholder="1,50" />
                <FormField label="Badge" name="badgeRewardTitle" placeholder="z. B. Ordnungsheld" />
                <FormField label="Badge-Icon" name="badgeRewardIcon" placeholder="🏅" />
              </div>
            </fieldset>

            <label className="flex items-center gap-2 text-sm font-medium text-slate-800">
              <input type="checkbox" name="requiresConfirmation" defaultChecked className="h-4 w-4 rounded border-slate-300" />
              Elternbestätigung erforderlich
            </label>
            <Button type="submit" disabled={members.length === 0} className="w-full">Aufgabe speichern</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
