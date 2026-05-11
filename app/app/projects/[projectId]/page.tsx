import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCents } from "@/lib/money";
import { getProjectDetail } from "@/lib/projects";
import {
  createProjectSettlementPlanAction,
  settleProjectSettlementAction,
  updateProjectStatusAction,
  voidProjectExpenseAction,
} from "../actions";

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

export default async function ProjectDetailPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const { project, balance, settlementSuggestions } = await getProjectDetail(projectId);
  const openSettlements = project.settlements.filter((settlement) => settlement.status === "open");
  const settledSettlements = project.settlements.filter((settlement) => settlement.status === "settled");

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
