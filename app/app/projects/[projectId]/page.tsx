import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCents } from "@/lib/money";
import { getProjectDetail } from "@/lib/projects";
import {
  addProjectGuestsAction,
  createProjectSettlementPlanAction,
  settleProjectSettlementAction,
  updateProjectStatusAction,
  voidProjectExpenseAction,
} from "../actions";
import { preferenceCategoryLabel } from "@/lib/relationships";

function balanceText(netCents: number) {
  if (netCents > 0) return `bekommt noch ${formatCents(netCents)}`;
  if (netCents < 0) return `offen: ${formatCents(Math.abs(netCents))}`;
  return "ausgeglichen";
}

function statusLabel(status: string) {
  if (status === "done") return "Abgeschlossen";
  if (status === "archived") return "Archiviert";
  return "Aktiv";
}

function preferenceSentimentLabel(sentiment: string) {
  if (sentiment === "LIKES") return "mag";
  if (sentiment === "DISLIKES") return "mag nicht";
  return "Hinweis";
}

export default async function ProjectDetailPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const { project, balance, settlementSuggestions, availableRelationshipContacts, guestPreferenceSummary } = await getProjectDetail(projectId);
  const openSettlements = project.settlements.filter((settlement) => settlement.status === "open");
  const settledSettlements = project.settlements.filter((settlement) => settlement.status === "settled");
  const selectedGuestContactIds = new Set(project.relationshipGuests.map((guest) => guest.contactId));
  const unselectedRelationshipContacts = availableRelationshipContacts.filter((contact) => !selectedGuestContactIds.has(contact.id));

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-emerald-600">Projekt · {statusLabel(project.status)}</p>
          <h2 className="text-2xl font-bold text-slate-950">{project.title}</h2>
          {project.description ? <p className="mt-1 text-sm text-slate-600">{project.description}</p> : null}
        </div>
        <div className="flex shrink-0 flex-col gap-2">
          {project.status === "active" ? (
            <form action={updateProjectStatusAction.bind(null, project.id, "done")}>
              <Button type="submit" className="w-full">Abschließen</Button>
            </form>
          ) : null}
          {project.status !== "archived" ? (
            <form action={updateProjectStatusAction.bind(null, project.id, "archived")}>
              <Button type="submit" className="w-full bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50">Archivieren</Button>
            </form>
          ) : null}
          {project.status === "done" ? (
            <form action={updateProjectStatusAction.bind(null, project.id, "active")}>
              <Button type="submit" className="w-full bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50">Reaktivieren</Button>
            </form>
          ) : null}
          <Button asChild className="w-full">
            <Link href={`/app/projects/${project.id}/expenses/new`}>Ausgabe</Link>
          </Button>
        </div>
      </div>

      {project.planningEvent ? (
        <Link href={`/app/planning/${project.planningEvent.id}`} className="flex items-center justify-between gap-3 rounded-2xl bg-violet-50 px-4 py-3 text-sm font-semibold text-violet-800">
          <span>🗓️ Mit einer Planung verknüpft</span>
          <span>Öffnen →</span>
        </Link>
      ) : null}

      <section className="rounded-3xl bg-emerald-600 p-5 text-white shadow-sm">
        <p className="text-sm text-emerald-50">Gesamtausgaben</p>
        <h3 className="mt-2 text-3xl font-bold">{formatCents(balance.totalCents)}</h3>
        <p className="mt-2 text-sm text-emerald-50">{project.expenses.filter((expense) => expense.status === "active").length} aktive Ausgaben</p>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Bilanz</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3">
          {balance.rows.map((row) => (
            <div key={row.familyMemberId} className="rounded-2xl bg-slate-50 p-3 text-sm">
              <div className="flex items-center justify-between gap-3">
                <p className="font-semibold text-slate-950">{row.name}</p>
                <p className="font-bold text-slate-950">{balanceText(row.netCents)}</p>
              </div>
              <p className="mt-1 text-slate-500">Bezahlt {formatCents(row.paidCents)} · Anteil {formatCents(row.owedShareCents)}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Abrechnung</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {openSettlements.length === 0 ? (
            <>
              {settlementSuggestions.length === 0 ? (
                <p className="text-sm text-slate-600">Alles ausgeglichen. Keine Zahlung nötig.</p>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm text-slate-600">Vorschläge für den Projektausgleich:</p>
                  {settlementSuggestions.map((suggestion) => (
                    <div
                      key={`${suggestion.fromMemberId}-${suggestion.toMemberId}-${suggestion.amountCents}`}
                      className="rounded-2xl bg-slate-50 p-3 text-sm"
                    >
                      <span className="font-semibold text-slate-950">{suggestion.fromName}</span> zahlt{" "}
                      <span className="font-semibold text-slate-950">{suggestion.toName}</span>{" "}
                      <span className="font-bold text-slate-950">{formatCents(suggestion.amountCents)}</span>
                    </div>
                  ))}
                  <form action={createProjectSettlementPlanAction.bind(null, project.id)}>
                    <Button type="submit" className="w-full">Ausgleich vorbereiten</Button>
                  </form>
                </div>
              )}
            </>
          ) : (
            <div className="space-y-2">
              {openSettlements.map((settlement) => (
                <div key={settlement.id} className="rounded-2xl bg-amber-50 p-3 text-sm">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <p>
                      <span className="font-semibold text-slate-950">{settlement.fromMember.name}</span> zahlt{" "}
                      <span className="font-semibold text-slate-950">{settlement.toMember.name}</span>{" "}
                      <span className="font-bold text-slate-950">{formatCents(settlement.amountCents)}</span>
                    </p>
                    <form action={settleProjectSettlementAction.bind(null, project.id, settlement.id)}>
                      <Button type="submit" className="w-full bg-white text-slate-700 ring-1 ring-amber-200 hover:bg-amber-100 sm:w-auto">
                        Bezahlt markieren
                      </Button>
                    </form>
                  </div>
                </div>
              ))}
            </div>
          )}
          {settledSettlements.length > 0 ? (
            <div className="space-y-1 border-t border-slate-100 pt-3 text-xs text-slate-500">
              <p className="font-medium text-slate-700">Erledigt</p>
              {settledSettlements.map((settlement) => (
                <p key={settlement.id}>
                  {settlement.fromMember.name} → {settlement.toMember.name}: {formatCents(settlement.amountCents)} bezahlt
                </p>
              ))}
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Beteiligte</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {project.participants.map((participant) => (
            <span key={participant.id} className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700">
              {participant.member.icon ?? "👤"} {participant.member.name}
            </span>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Gäste & Einkaufshinweise</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {project.relationshipGuests.length === 0 ? (
            <p className="text-sm text-slate-600">Noch keine Beziehungskontakte eingeladen.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {project.relationshipGuests.map((guest) => (
                <span key={guest.id} className="rounded-full bg-violet-50 px-3 py-1 text-sm font-medium text-violet-700">
                  {guest.contact.name}
                </span>
              ))}
            </div>
          )}

          {unselectedRelationshipContacts.length > 0 ? (
            <form action={addProjectGuestsAction.bind(null, project.id)} className="space-y-3 rounded-2xl bg-slate-50 p-3">
              <p className="text-sm font-semibold text-slate-800">Beziehungskontakte einladen</p>
              <div className="grid gap-2">
                {unselectedRelationshipContacts.map((contact) => (
                  <label key={contact.id} className="flex items-center gap-3 rounded-xl bg-white px-3 py-2 text-sm text-slate-700">
                    <input type="checkbox" name="contactIds" value={contact.id} />
                    {contact.name}
                  </label>
                ))}
              </div>
              <Button type="submit" className="w-full">Vorlieben anzeigen</Button>
            </form>
          ) : availableRelationshipContacts.length === 0 ? (
            <p className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-500">Lege zuerst unter Beziehungen Kontakte mit Vorlieben an.</p>
          ) : null}

          {guestPreferenceSummary.length > 0 ? (
            <div className="space-y-3">
              <p className="text-sm font-semibold text-slate-800">Einkaufshinweise</p>
              {guestPreferenceSummary.map((group) => (
                <div key={group.category} className="rounded-2xl bg-slate-50 p-3">
                  <p className="text-sm font-semibold text-slate-900">{preferenceCategoryLabel(group.category)}</p>
                  <div className="mt-2 space-y-2">
                    {group.entries.map((entry) => (
                      <div key={`${group.category}-${entry.sentiment}-${entry.label}`} className={entry.isSafetyHint ? "rounded-xl bg-red-50 px-3 py-2 text-sm text-red-800" : "rounded-xl bg-white px-3 py-2 text-sm text-slate-700"}>
                        <span className="font-semibold">{entry.label}</span>
                        <span className="text-slate-500"> · {preferenceSentimentLabel(entry.sentiment)} · {entry.contactNames.join(", ")}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : project.relationshipGuests.length > 0 ? (
            <p className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-500">Für diese Gäste sind noch keine Vorlieben oder Allergien gespeichert.</p>
          ) : null}
        </CardContent>
      </Card>

      <section className="space-y-3">
        <h3 className="text-lg font-semibold text-slate-950">Ausgaben</h3>
        {project.expenses.length === 0 ? (
          <Card>
            <CardContent className="text-sm text-slate-600">Noch keine Ausgaben. Füge die erste gemeinsame Ausgabe hinzu.</CardContent>
          </Card>
        ) : (
          <div className="grid gap-3">
            {project.expenses.map((expense) => (
              <Card key={expense.id} className={expense.status === "voided" ? "opacity-60" : undefined}>
                <CardContent className="space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-950">{expense.title}</p>
                      <p className="text-sm text-slate-500">Bezahlt von {expense.paidByMember.name}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <p className="font-bold text-slate-950">{formatCents(expense.amountCents)}</p>
                      {expense.status === "active" ? (
                        <form action={voidProjectExpenseAction.bind(null, project.id, expense.id)}>
                          <Button
                            type="submit"
                            className="min-h-9 rounded-xl bg-white px-3 py-1 text-xs text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50"
                          >
                            Stornieren
                          </Button>
                        </form>
                      ) : null}
                    </div>
                  </div>
                  <p className="text-xs text-slate-500">
                    Aufgeteilt auf {expense.shares.map((share) => share.member.name).join(", ")}
                    {expense.status === "voided" ? " · storniert" : ""}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
