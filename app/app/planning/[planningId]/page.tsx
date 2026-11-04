import Link from "next/link";
import {
  addPlanningGiftListsAction,
  addPlanningGuestsAction,
  checkPlanningChecklistItemAction,
  createPlanningChecklistAction,
  createPlanningCostProjectAction,
  createPlanningDocumentAction,
  createPlanningTaskAction,
  uncheckPlanningChecklistItemAction,
  updatePlanningDocumentStatusAction,
  updatePlanningStatusAction,
  updatePlanningTaskAction,
} from "@/app/app/planning/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { FormField } from "@/components/ui/form-field";
import { checklistKindLabel, checklistProgressLabel, checklistStatusLabel } from "@/lib/checklists";
import { formatCents } from "@/lib/money";
import {
  formatPlanningDateRange,
  getPlanningDetailData,
  planningDocumentStatusLabel,
  planningStatusLabel,
  planningTypeIcon,
  planningTypeLabel,
} from "@/lib/planning";
import { giftStatusLabel, preferenceCategoryLabel } from "@/lib/relationships";

function taskStatusLabel(status: string) {
  if (status === "in_progress") return "In Arbeit";
  if (status === "done") return "Wartet auf Bestätigung";
  if (status === "confirmed") return "Erledigt";
  if (status === "skipped") return "Übersprungen";
  return "Offen";
}

function preferenceSentimentLabel(sentiment: string) {
  if (sentiment === "LIKES") return "mag";
  if (sentiment === "DISLIKES") return "mag nicht";
  return "Hinweis";
}

function isoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function errorText(error?: string) {
  if (!error) return null;
  if (error === "invalid-member" || error === "invalid-document-member") return "Bitte wähle eine zuständige Person aus dieser Planung.";
  if (error === "not-found") return "Diese Planung wurde nicht gefunden.";
  return "Bitte prüfe die Eingaben und Verknüpfungen.";
}

export default async function PlanningDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ planningId: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const [{ planningId }, query] = await Promise.all([params, searchParams]);
  const { plan, contacts, checklistTemplates, giftLists, guestPreferenceSummary, progress } = await getPlanningDetailData(planningId);
  const error = errorText(query.error);
  const appointment = plan.calendarEvent;
  const selectedContactIds = new Set(plan.guests.map((guest) => guest.contactId));
  const selectedGiftListIds = new Set(plan.giftLists.map((link) => link.giftListId));
  const unselectedContacts = contacts.filter((contact) => !selectedContactIds.has(contact.id));
  const unselectedGiftLists = giftLists.filter((giftList) => !selectedGiftListIds.has(giftList.id));
  const projectTotalCents = plan.costProject?.expenses.reduce((total, expense) => total + expense.amountCents, 0) ?? 0;

  return (
    <div className="space-y-5">
      <section className="rounded-[2rem] bg-gradient-to-br from-slate-950 via-emerald-950 to-teal-900 p-5 text-white shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-emerald-200">{planningTypeIcon(plan.type)} {planningTypeLabel(plan.type)} · {planningStatusLabel(plan.status)}</p>
            <h2 className="mt-2 break-words text-2xl font-bold">{appointment.title}</h2>
            <p className="mt-2 text-sm text-slate-200">{formatPlanningDateRange(appointment.startsAt, appointment.endsAt ?? appointment.startsAt)}{appointment.location ? ` · ${appointment.location}` : ""}</p>
            {appointment.description ? <p className="mt-2 text-sm leading-6 text-slate-300">{appointment.description}</p> : null}
          </div>
          <span className="shrink-0 rounded-full bg-white/10 px-3 py-1 text-xs font-bold">{progress.done}/{progress.total}</span>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
          <div className="rounded-2xl bg-white/10 p-2"><strong className="block text-base">{progress.tasks.done}/{progress.tasks.total}</strong>Aufgaben</div>
          <div className="rounded-2xl bg-white/10 p-2"><strong className="block text-base">{progress.checklistItems.done}/{progress.checklistItems.total}</strong>Listenpunkte</div>
          <div className="rounded-2xl bg-white/10 p-2"><strong className="block text-base">{progress.documents.done}/{progress.documents.total}</strong>Dokumente</div>
        </div>
      </section>

      {error ? <p className="rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-900">{error}</p> : null}

      <div className="grid grid-cols-2 gap-3">
        <Button asChild className="bg-white text-slate-800 ring-1 ring-slate-200 hover:bg-slate-50"><Link href={`/app/calendar?week=${isoDate(appointment.startsAt)}&event=${appointment.id}#event-${appointment.id}`}>🗓️ Termin</Link></Button>
        {plan.costProject ? (
          <Button asChild><Link href={`/app/projects/${plan.costProject.id}`}>💶 Kosten</Link></Button>
        ) : (
          <Button asChild className="bg-white text-slate-800 ring-1 ring-slate-200 hover:bg-slate-50"><a href="#cost-project">💶 Kosten</a></Button>
        )}
      </div>

      <Card>
        <CardHeader><CardTitle>Zuständige</CardTitle></CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {plan.members.map(({ member }) => (
            <span key={member.id} className="rounded-full bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700">{member.icon ?? "👤"} {member.name}</span>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Gäste & Einkaufshinweise</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {plan.guests.length === 0 ? (
            <p className="text-sm text-slate-600">Noch keine Gäste verknüpft.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {plan.guests.map((guest) => <span key={guest.id} className="rounded-full bg-violet-50 px-3 py-2 text-sm font-medium text-violet-700">{guest.contact.name}</span>)}
            </div>
          )}

          {guestPreferenceSummary.length > 0 ? (
            <div className="space-y-3">
              {guestPreferenceSummary.map((group) => (
                <div key={group.category} className="rounded-2xl bg-slate-50 p-3">
                  <p className="text-sm font-semibold text-slate-900">{preferenceCategoryLabel(group.category)}</p>
                  <div className="mt-2 grid gap-2">
                    {group.entries.map((entry) => (
                      <p key={`${group.category}-${entry.sentiment}-${entry.label}`} className={entry.isSafetyHint ? "rounded-xl bg-red-50 px-3 py-2 text-sm text-red-800" : "rounded-xl bg-white px-3 py-2 text-sm text-slate-700"}>
                        <span className="font-semibold">{entry.label}</span><span className="text-slate-500"> · {preferenceSentimentLabel(entry.sentiment)} · {entry.contactNames.join(", ")}</span>
                      </p>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : plan.guests.length > 0 ? <p className="text-sm text-slate-500">Für diese Gäste sind noch keine Vorlieben oder Allergien gespeichert.</p> : null}

          {unselectedContacts.length > 0 ? (
            <details className="rounded-2xl border border-slate-200 p-3">
              <summary className="cursor-pointer text-sm font-semibold text-slate-800">Gäste ergänzen</summary>
              <form action={addPlanningGuestsAction.bind(null, plan.id)} className="mt-3 space-y-3">
                <div className="grid gap-2 sm:grid-cols-2">
                  {unselectedContacts.map((contact) => (
                    <label key={contact.id} className="flex min-h-11 items-center gap-3 rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-700">
                      <input type="checkbox" name="contactIds" value={contact.id} className="h-5 w-5 rounded border-slate-300" /> {contact.name}
                    </label>
                  ))}
                </div>
                <Button type="submit" className="w-full">Gäste übernehmen</Button>
              </form>
            </details>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Aufgaben & Zuständigkeiten</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {plan.taskOccurrences.length === 0 ? <EmptyState title="Noch keine Aufgaben" description="Lege konkrete Vorbereitungen mit einer zuständigen Person an." /> : (
            <div className="grid gap-2">
              {plan.taskOccurrences.map((task) => (
                <div key={task.id} className="flex items-center justify-between gap-3 rounded-2xl bg-slate-50 px-3 py-3">
                  <div className="min-w-0">
                    <p className={task.status === "confirmed" ? "font-semibold text-slate-400 line-through" : "font-semibold text-slate-950"}>{task.titleSnapshot}</p>
                    <p className="mt-1 text-xs text-slate-500">{task.member.icon ?? "👤"} {task.member.name} · {task.dueAt ? formatPlanningDateRange(task.dueAt, task.dueAt) : "ohne Datum"} · {taskStatusLabel(task.status)}</p>
                  </div>
                  {task.status === "open" ? (
                    <form action={updatePlanningTaskAction.bind(null, plan.id, task.id, "in_progress")}><Button type="submit" className="min-h-9 px-3 text-xs">Start</Button></form>
                  ) : task.status === "in_progress" || task.status === "done" ? (
                    <form action={updatePlanningTaskAction.bind(null, plan.id, task.id, "confirmed")}><Button type="submit" className="min-h-9 px-3 text-xs">✓</Button></form>
                  ) : null}
                </div>
              ))}
            </div>
          )}

          <details className="rounded-2xl border border-slate-200 p-3">
            <summary className="cursor-pointer text-sm font-semibold text-slate-800">Aufgabe hinzufügen</summary>
            <form action={createPlanningTaskAction.bind(null, plan.id)} className="mt-3 space-y-3">
              <FormField label="Aufgabe" name="title" placeholder="z. B. Unterkunft buchen" required />
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="grid gap-2 text-sm font-medium text-slate-800" htmlFor="task-familyMemberId">
                  Zuständig
                  <select id="task-familyMemberId" name="familyMemberId" required className="min-h-11 rounded-2xl border border-slate-200 bg-white px-4 text-base text-slate-950">
                    <option value="">Bitte wählen</option>
                    {plan.members.map(({ member }) => <option key={member.id} value={member.id}>{member.icon ?? "👤"} {member.name}</option>)}
                  </select>
                </label>
                <FormField label="Fällig am" name="dueDate" type="date" defaultValue={isoDate(appointment.startsAt)} required />
              </div>
              <Button type="submit" className="w-full">Aufgabe anlegen</Button>
            </form>
          </details>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Checklisten & Packlisten</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {plan.checklistInstances.length === 0 ? <EmptyState title="Noch keine Liste" description="Starte eine bestehende Vorlage für diese Planung." /> : (
            plan.checklistInstances.map((instance) => (
              <div key={instance.id} className="rounded-2xl border border-slate-200 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-950">{instance.titleSnapshot}</p>
                    <p className="mt-1 text-xs text-slate-500">{checklistKindLabel(instance.kindSnapshot)} · {instance.assignedMember?.name ?? "Familie"} · {checklistProgressLabel(instance.items)} · {checklistStatusLabel(instance.status)}</p>
                  </div>
                </div>
                <div className="mt-3 grid gap-2">
                  {instance.items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-3 py-2">
                      <div className="min-w-0">
                        <p className={item.checked ? "font-medium text-slate-400 line-through" : "font-medium text-slate-800"}>{item.titleSnapshot}{item.quantityLabelSnapshot ? ` · ${item.quantityLabelSnapshot}` : ""}</p>
                        {item.noteSnapshot ? <p className="text-xs text-slate-500">{item.noteSnapshot}</p> : null}
                      </div>
                      <form action={(item.checked ? uncheckPlanningChecklistItemAction : checkPlanningChecklistItemAction).bind(null, plan.id, item.id)}>
                        <Button type="submit" className="min-h-9 px-3 text-xs">{item.checked ? "↩" : "✓"}</Button>
                      </form>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}

          {checklistTemplates.length > 0 ? (
            <details className="rounded-2xl border border-slate-200 p-3">
              <summary className="cursor-pointer text-sm font-semibold text-slate-800">Weitere Liste starten</summary>
              <form action={createPlanningChecklistAction.bind(null, plan.id)} className="mt-3 space-y-3">
                <label className="grid gap-2 text-sm font-medium text-slate-800" htmlFor="templateId">
                  Vorlage
                  <select id="templateId" name="templateId" required className="min-h-11 rounded-2xl border border-slate-200 bg-white px-4 text-base text-slate-950">
                    <option value="">Bitte wählen</option>
                    {checklistTemplates.map((template) => <option key={template.id} value={template.id}>{checklistKindLabel(template.kind)}: {template.title}</option>)}
                  </select>
                </label>
                <label className="grid gap-2 text-sm font-medium text-slate-800" htmlFor="checklist-familyMemberId">
                  Zuständig optional
                  <select id="checklist-familyMemberId" name="familyMemberId" className="min-h-11 rounded-2xl border border-slate-200 bg-white px-4 text-base text-slate-950">
                    <option value="">Familie</option>
                    {plan.members.map(({ member }) => <option key={member.id} value={member.id}>{member.icon ?? "👤"} {member.name}</option>)}
                  </select>
                </label>
                <Button type="submit" className="w-full">Liste starten</Button>
              </form>
            </details>
          ) : <Link href="/app/checklists" className="block rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">Eigene Listenvorlage anlegen →</Link>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Dokumente</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-slate-600">Reisepässe, Tickets, Buchungen oder andere Nachweise mit klarer Zuständigkeit.</p>
          {plan.documents.length > 0 ? (
            <div className="grid gap-2">
              {plan.documents.map((document) => (
                <div key={document.id} className="flex items-center justify-between gap-3 rounded-2xl bg-slate-50 px-3 py-3">
                  <div className="min-w-0">
                    <p className={document.status === "READY" ? "font-semibold text-slate-400 line-through" : "font-semibold text-slate-950"}>{document.title}</p>
                    <p className="mt-1 text-xs text-slate-500">{document.responsibleMember?.name ?? "Familie"} · {planningDocumentStatusLabel(document.status)}{document.note ? ` · ${document.note}` : ""}</p>
                  </div>
                  <form action={updatePlanningDocumentStatusAction.bind(null, plan.id, document.id, document.status === "READY" ? "OPEN" : "READY")}>
                    <Button type="submit" className="min-h-9 px-3 text-xs">{document.status === "READY" ? "↩" : "✓"}</Button>
                  </form>
                </div>
              ))}
            </div>
          ) : null}
          <details className="rounded-2xl border border-slate-200 p-3">
            <summary className="cursor-pointer text-sm font-semibold text-slate-800">Dokument hinzufügen</summary>
            <form action={createPlanningDocumentAction.bind(null, plan.id)} className="mt-3 space-y-3">
              <FormField label="Dokument / Nachweis" name="title" placeholder="z. B. Reisepässe prüfen" required />
              <label className="grid gap-2 text-sm font-medium text-slate-800" htmlFor="document-familyMemberId">
                Zuständig optional
                <select id="document-familyMemberId" name="familyMemberId" className="min-h-11 rounded-2xl border border-slate-200 bg-white px-4 text-base text-slate-950">
                  <option value="">Familie</option>
                  {plan.members.map(({ member }) => <option key={member.id} value={member.id}>{member.icon ?? "👤"} {member.name}</option>)}
                </select>
              </label>
              <FormField label="Notiz optional" name="note" placeholder="z. B. noch mindestens 6 Monate gültig" />
              <Button type="submit" className="w-full">Dokument aufnehmen</Button>
            </form>
          </details>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Geschenklisten</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {plan.giftLists.length === 0 ? <p className="text-sm text-slate-600">Noch keine Geschenkliste verknüpft.</p> : (
            <div className="grid gap-2">
              {plan.giftLists.map(({ id, giftList }) => (
                <div key={id} className="rounded-2xl bg-violet-50 px-3 py-3 text-sm text-violet-950">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">{giftList.title}</p>
                      <p className="mt-1 text-xs text-violet-700">{giftList.contact.name} · {giftList.giftIdeas.length} Ideen</p>
                    </div>
                    <Link href={`/app/relationships#gift-list-${giftList.id}`} className="shrink-0 text-xs font-semibold text-violet-700">Verwalten →</Link>
                  </div>
                  {giftList.giftIdeas.length > 0 ? (
                    <div className="mt-3 grid gap-2">
                      {giftList.giftIdeas.map((idea) => (
                        <div key={idea.id} className="rounded-xl bg-white px-3 py-2">
                          <div className="flex items-start justify-between gap-3">
                            <p className="font-medium text-slate-900">{idea.url ? <a href={idea.url} target="_blank" rel="noreferrer" className="underline decoration-violet-300 underline-offset-2">{idea.title}</a> : idea.title}</p>
                            <span className="shrink-0 text-xs font-semibold text-violet-700">{giftStatusLabel(idea.status)}</span>
                          </div>
                          <p className="mt-1 text-xs text-slate-500">Priorität {idea.priority}{idea.estimatedPriceCents !== null ? ` · ${formatCents(idea.estimatedPriceCents)}` : ""}</p>
                          {idea.notes ? <p className="mt-1 text-xs text-slate-600">{idea.notes}</p> : null}
                        </div>
                      ))}
                    </div>
                  ) : <p className="mt-3 text-xs text-violet-700">Noch keine Geschenkideen.</p>}
                </div>
              ))}
            </div>
          )}
          {unselectedGiftLists.length > 0 ? (
            <details className="rounded-2xl border border-slate-200 p-3">
              <summary className="cursor-pointer text-sm font-semibold text-slate-800">Geschenklisten verknüpfen</summary>
              <form action={addPlanningGiftListsAction.bind(null, plan.id)} className="mt-3 space-y-3">
                <div className="grid gap-2">
                  {unselectedGiftLists.map((giftList) => (
                    <label key={giftList.id} className="flex min-h-11 items-center gap-3 rounded-xl bg-violet-50 px-3 py-2 text-sm text-violet-900">
                      <input type="checkbox" name="giftListIds" value={giftList.id} className="h-5 w-5 rounded border-violet-300" /> {giftList.title} · {giftList.contact.name}
                    </label>
                  ))}
                </div>
                <Button type="submit" className="w-full">Verknüpfen</Button>
              </form>
            </details>
          ) : null}
          <Link href="/app/relationships" className="block text-sm font-semibold text-emerald-700">Geschenklisten unter Beziehungen verwalten →</Link>
        </CardContent>
      </Card>

      <Card id="cost-project">
        <CardHeader><CardTitle>Kostenprojekt</CardTitle></CardHeader>
        <CardContent>
          {plan.costProject ? (
            <Link href={`/app/projects/${plan.costProject.id}`} className="flex items-center justify-between gap-3 rounded-2xl bg-emerald-50 px-4 py-3 text-sm">
              <span><span className="block font-semibold text-emerald-950">{plan.costProject.title}</span><span className="text-emerald-700">Gemeinsame Ausgaben, Aufteilung und Abrechnung</span></span>
              <span className="shrink-0 font-bold text-emerald-950">{formatCents(projectTotalCents)}</span>
            </Link>
          ) : (
            <form action={createPlanningCostProjectAction.bind(null, plan.id)} className="space-y-3">
              <p className="text-sm text-slate-600">Lege das verknüpfte Projekt nachträglich an. Zuständige und Gäste werden übernommen.</p>
              <Button type="submit" className="w-full">Kostenprojekt anlegen</Button>
            </form>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-3">
        {plan.status === "ACTIVE" ? (
          <form action={updatePlanningStatusAction.bind(null, plan.id, "DONE")}><Button type="submit" className="w-full">Abschließen</Button></form>
        ) : plan.status === "DONE" ? (
          <form action={updatePlanningStatusAction.bind(null, plan.id, "ACTIVE")}><Button type="submit" className="w-full">Reaktivieren</Button></form>
        ) : <Button asChild className="w-full"><Link href="/app/planning">Zur Übersicht</Link></Button>}
        {plan.status !== "ARCHIVED" ? (
          <form action={updatePlanningStatusAction.bind(null, plan.id, "ARCHIVED")}><Button type="submit" className="w-full bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50">Archivieren</Button></form>
        ) : <Button asChild className="w-full bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50"><Link href="/app/planning">Übersicht</Link></Button>}
      </div>
    </div>
  );
}
