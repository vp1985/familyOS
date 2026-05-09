import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { FormField } from "@/components/ui/form-field";
import { checklistKindLabel, checklistProgressLabel, checklistStatusLabel, getChecklistsPageData } from "@/lib/checklists";
import { archiveChecklistInstanceAction, checkChecklistItemAction, createChecklistInstanceAction, createChecklistTemplateAction, uncheckChecklistItemAction } from "./actions";

function taskLabel(task: Awaited<ReturnType<typeof getChecklistsPageData>>["tasks"][number]) {
  return `${task.titleSnapshot} · ${task.member.name}`;
}

export default async function ChecklistsPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const [{ templates, instances, members, tasks }, params] = await Promise.all([getChecklistsPageData(), searchParams]);
  const error = params.error ? "Bitte prüfe die Eingaben." : null;

  return (
    <div className="space-y-5">
      <section className="rounded-[2rem] bg-gradient-to-br from-slate-950 via-emerald-950 to-teal-900 p-5 text-white shadow-sm">
        <p className="text-sm text-emerald-200">Checklisten</p>
        <h2 className="mt-2 text-2xl font-bold">Rüstlisten & Aufgaben-Checklisten</h2>
        <p className="mt-3 text-sm leading-6 text-slate-300">Vorlagen für Urlaub, Ausflüge, Schule oder wiederkehrende Aufgaben erstellen und konkret abhaken.</p>
      </section>

      {error ? <p className="rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-800">{error}</p> : null}

      <Card>
        <CardHeader><CardTitle>Neue Vorlage</CardTitle></CardHeader>
        <CardContent>
          <form action={createChecklistTemplateAction} className="space-y-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <FormField label="Titel" name="title" placeholder="Schwimmbad, Urlaub, Schultasche" required />
              <FormField label="Kategorie" name="category" defaultValue="Rüstliste" required />
            </div>
            <label className="grid gap-2 text-sm font-medium text-slate-800" htmlFor="kind">
              Typ
              <select id="kind" name="kind" defaultValue="PACKING" className="min-h-11 rounded-2xl border border-slate-200 bg-white px-4 text-base text-slate-950 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100">
                <option value="GENERAL">Checkliste</option>
                <option value="PACKING">Rüstliste</option>
              </select>
            </label>
            <label className="grid gap-2 text-sm font-medium text-slate-800" htmlFor="description">
              Beschreibung optional
              <textarea id="description" name="description" rows={2} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-950 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100" />
            </label>
            <fieldset className="space-y-3 rounded-3xl bg-slate-50 p-4">
              <legend className="text-sm font-semibold text-slate-950">Punkte</legend>
              {[0, 1, 2, 3, 4, 5].map((index) => (
                <div key={index} className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                  <FormField label={`Punkt ${index + 1}`} name="itemTitle" placeholder={index === 0 ? "Handtuch" : "optional"} />
                  <FormField label="Menge" name="quantityLabel" placeholder="1x, 3 Paar" />
                  <FormField label="Notiz" name="itemNote" placeholder="optional" />
                </div>
              ))}
            </fieldset>
            <Button type="submit" className="w-full">Vorlage speichern</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Vorlage verwenden</CardTitle></CardHeader>
        <CardContent>
          {templates.length === 0 ? <EmptyState title="Noch keine Vorlagen" description="Lege zuerst eine Checkliste oder Rüstliste an." /> : (
            <form action={createChecklistInstanceAction} className="space-y-4">
              <label className="grid gap-2 text-sm font-medium text-slate-800" htmlFor="templateId">
                Vorlage
                <select id="templateId" name="templateId" required className="min-h-11 rounded-2xl border border-slate-200 bg-white px-4 text-base text-slate-950 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100">
                  <option value="">Bitte wählen</option>
                  {templates.map((template) => <option key={template.id} value={template.id}>{checklistKindLabel(template.kind)}: {template.title}</option>)}
                </select>
              </label>
              <label className="grid gap-2 text-sm font-medium text-slate-800" htmlFor="assignedFamilyMemberId">
                Für Person
                <select id="assignedFamilyMemberId" name="assignedFamilyMemberId" className="min-h-11 rounded-2xl border border-slate-200 bg-white px-4 text-base text-slate-950 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100">
                  <option value="">Aus Aufgabe übernehmen / Familie</option>
                  {members.map((member) => <option key={member.id} value={member.id}>{member.icon ?? "👤"} {member.name}</option>)}
                </select>
              </label>
              <label className="grid gap-2 text-sm font-medium text-slate-800" htmlFor="taskOccurrenceId">
                Aufgabe optional
                <select id="taskOccurrenceId" name="taskOccurrenceId" className="min-h-11 rounded-2xl border border-slate-200 bg-white px-4 text-base text-slate-950 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100">
                  <option value="">Ohne Aufgabe</option>
                  {tasks.map((task) => <option key={task.id} value={task.id}>{taskLabel(task)}</option>)}
                </select>
              </label>
              <Button type="submit" className="w-full">Konkrete Liste starten</Button>
            </form>
          )}
        </CardContent>
      </Card>

      <section className="space-y-3">
        <h3 className="text-lg font-semibold text-slate-950">Aktive Listen</h3>
        {instances.length === 0 ? <EmptyState title="Keine aktiven Checklisten" description="Starte eine Vorlage für eine Aufgabe, ein Kind oder die Familie." /> : null}
        <div className="grid gap-3">
          {instances.map((instance) => (
            <Card key={instance.id}>
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle>{instance.titleSnapshot}</CardTitle>
                    <p className="mt-1 text-sm text-slate-500">{checklistKindLabel(instance.kindSnapshot)} · {instance.assignedMember?.name ?? "Familie"} · {checklistProgressLabel(instance.items)} · {checklistStatusLabel(instance.status)}</p>
                  </div>
                  <form action={archiveChecklistInstanceAction.bind(null, instance.id)}><Button type="submit" className="min-h-9 bg-transparent px-3 text-xs text-slate-600 shadow-none hover:bg-slate-100">Archiv</Button></form>
                </div>
              </CardHeader>
              <CardContent className="grid gap-2">
                {instance.taskOccurrence ? <p className="rounded-2xl bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800">Aufgabe: {instance.taskOccurrence.titleSnapshot}</p> : null}
                {instance.items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between gap-3 rounded-2xl bg-slate-50 px-3 py-2">
                    <div>
                      <p className={item.checked ? "font-semibold text-slate-400 line-through" : "font-semibold text-slate-950"}>{item.titleSnapshot}{item.quantityLabelSnapshot ? ` · ${item.quantityLabelSnapshot}` : ""}</p>
                      {item.noteSnapshot ? <p className="text-xs text-slate-500">{item.noteSnapshot}</p> : null}
                    </div>
                    <form action={item.checked ? uncheckChecklistItemAction.bind(null, item.id) : checkChecklistItemAction.bind(null, item.id)}>
                      <Button type="submit" className="min-h-9 px-3 text-xs">{item.checked ? "Zurück" : "✓"}</Button>
                    </form>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
