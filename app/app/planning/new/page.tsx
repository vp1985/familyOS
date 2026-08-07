import Link from "next/link";
import { createPlanningAction } from "@/app/app/planning/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { FormField } from "@/components/ui/form-field";
import { checklistKindLabel } from "@/lib/checklists";
import { getPlanningFormData } from "@/lib/planning";

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function errorText(error?: string) {
  if (error === "invalid-links") return "Mindestens eine Verknüpfung gehört nicht zu dieser Familie.";
  if (error === "invalid-planning") return "Bitte prüfe Typ, Titel, Zuständige und Zeitraum. Bei Urlaub ist ein Enddatum Pflicht.";
  return null;
}

export default async function NewPlanningPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const [{ members, contacts, giftLists, checklistTemplates }, params] = await Promise.all([getPlanningFormData(), searchParams]);
  const error = errorText(params.error);

  return (
    <div className="space-y-5">
      <section>
        <p className="text-sm font-medium text-emerald-600">Neue Planung</p>
        <h2 className="text-2xl font-bold text-slate-950">Anlass planen</h2>
        <p className="mt-1 text-sm leading-6 text-slate-600">Ein Termin bündelt Gäste, Zuständigkeiten, Listen, Dokumente, Geschenke und Kosten.</p>
      </section>

      {members.length === 0 ? (
        <EmptyState
          title="Noch keine Familienprofile"
          description="Lege zuerst unter Familie mindestens eine verantwortliche Person an."
          action={<Link href="/app/family" className="font-semibold text-emerald-700">Familienprofil anlegen</Link>}
        />
      ) : (
        <form action={createPlanningAction} className="space-y-4">
          {error ? <p className="rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-900">{error}</p> : null}

          <Card>
            <CardHeader><CardTitle>Anlass & Termin</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <label className="grid gap-2 text-sm font-medium text-slate-800" htmlFor="type">
                Typ
                <select id="type" name="type" defaultValue="BIRTHDAY" className="min-h-11 rounded-2xl border border-slate-200 bg-white px-4 text-base text-slate-950 shadow-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100">
                  <option value="BIRTHDAY">🎂 Geburtstag</option>
                  <option value="VACATION">🏖️ Urlaub</option>
                  <option value="VISIT">🏡 Besuch</option>
                  <option value="OUTING">🎒 Ausflug</option>
                </select>
              </label>
              <FormField label="Titel" name="title" placeholder="z. B. Mias Geburtstag" required />
              <label className="grid gap-2 text-sm font-medium text-slate-800" htmlFor="description">
                Beschreibung optional
                <textarea id="description" name="description" rows={3} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-950 shadow-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100" placeholder="Was soll vorbereitet werden?" />
              </label>
              <FormField label="Ort optional" name="location" placeholder="z. B. Zuhause oder Nordsee" />
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <FormField label="Startdatum" name="startDate" type="date" defaultValue={todayIso()} required />
                <FormField label="Enddatum" name="endDate" type="date" hint="Bei Urlaub Pflicht; sonst optional." />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Zuständige Familie</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-slate-600">Diese Personen können Aufgaben, Dokumente und Listen übernehmen.</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {members.map((member) => (
                  <label key={member.id} className="flex min-h-11 items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-800">
                    <input type="checkbox" name="participantIds" value={member.id} defaultChecked={member.role === "parent"} className="h-5 w-5 rounded border-slate-300 text-emerald-600" />
                    <span aria-hidden="true" className="text-xl">{member.icon ?? "👤"}</span>
                    <span>{member.name}</span>
                  </label>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Gäste & Geschenklisten</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {contacts.length === 0 ? (
                <p className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">Noch keine Kontakte unter Beziehungen. Gäste können später ergänzt werden.</p>
              ) : (
                <fieldset className="space-y-2">
                  <legend className="text-sm font-semibold text-slate-800">Gäste optional</legend>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {contacts.map((contact) => (
                      <label key={contact.id} className="flex min-h-11 items-center gap-3 rounded-2xl bg-slate-50 px-3 py-2 text-sm text-slate-700">
                        <input type="checkbox" name="guestContactIds" value={contact.id} className="h-5 w-5 rounded border-slate-300" />
                        {contact.name}
                      </label>
                    ))}
                  </div>
                </fieldset>
              )}

              {giftLists.length > 0 ? (
                <fieldset className="space-y-2 border-t border-slate-100 pt-4">
                  <legend className="text-sm font-semibold text-slate-800">Geschenklisten verknüpfen</legend>
                  <div className="grid gap-2">
                    {giftLists.map((giftList) => (
                      <label key={giftList.id} className="flex min-h-11 items-center gap-3 rounded-2xl bg-violet-50 px-3 py-2 text-sm text-violet-900">
                        <input type="checkbox" name="giftListIds" value={giftList.id} className="h-5 w-5 rounded border-violet-300" />
                        <span><span className="font-semibold">{giftList.title}</span> · {giftList.contact.name}</span>
                      </label>
                    ))}
                  </div>
                </fieldset>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Checklisten & Packlisten</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <label className="flex items-start gap-3 rounded-2xl bg-emerald-50 p-3 text-sm text-emerald-950">
                <input type="checkbox" name="addStarterChecklist" defaultChecked className="mt-0.5 h-5 w-5 rounded border-emerald-300" />
                <span><span className="block font-semibold">Passende Starterliste anlegen</span><span className="text-emerald-800">Geburtstagsvorbereitung, Urlaubskoffer, Besuch oder Tagesrucksack passend zum Typ.</span></span>
              </label>
              {checklistTemplates.length > 0 ? (
                <fieldset className="space-y-2">
                  <legend className="text-sm font-semibold text-slate-800">Eigene Vorlagen zusätzlich starten</legend>
                  <div className="grid gap-2">
                    {checklistTemplates.map((template) => (
                      <label key={template.id} className="flex min-h-11 items-center gap-3 rounded-2xl bg-slate-50 px-3 py-2 text-sm text-slate-700">
                        <input type="checkbox" name="checklistTemplateIds" value={template.id} className="h-5 w-5 rounded border-slate-300" />
                        <span><span className="font-semibold">{template.title}</span> · {checklistKindLabel(template.kind)} · {template.items.length} Punkte</span>
                      </label>
                    ))}
                  </div>
                </fieldset>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Kostenprojekt</CardTitle></CardHeader>
            <CardContent>
              <label className="flex items-start gap-3 rounded-2xl bg-slate-50 p-3 text-sm text-slate-700">
                <input type="checkbox" name="createCostProject" defaultChecked className="mt-0.5 h-5 w-5 rounded border-slate-300" />
                <span><span className="block font-semibold text-slate-950">Projekt für gemeinsame Ausgaben anlegen</span><span>Übernimmt Zuständige und Gäste und bleibt mit dieser Planung verknüpft.</span></span>
              </label>
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 gap-3">
            <Button asChild className="bg-white text-slate-800 ring-1 ring-slate-200 hover:bg-slate-50"><Link href="/app/planning">Abbrechen</Link></Button>
            <Button type="submit">Planung anlegen</Button>
          </div>
        </form>
      )}
    </div>
  );
}
