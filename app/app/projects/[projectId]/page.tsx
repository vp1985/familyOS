import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCents } from "@/lib/money";
import { getProjectDetail } from "@/lib/projects";

function balanceText(netCents: number) {
  if (netCents > 0) return `bekommt noch ${formatCents(netCents)}`;
  if (netCents < 0) return `offen: ${formatCents(Math.abs(netCents))}`;
  return "ausgeglichen";
}

export default async function ProjectDetailPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const { project, balance } = await getProjectDetail(projectId);

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-emerald-600">Projekt</p>
          <h2 className="text-2xl font-bold text-slate-950">{project.title}</h2>
          {project.description ? <p className="mt-1 text-sm text-slate-600">{project.description}</p> : null}
        </div>
        <Button asChild className="shrink-0">
          <Link href={`/app/projects/${project.id}/expenses/new`}>Ausgabe</Link>
        </Button>
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
                    <p className="font-bold text-slate-950">{formatCents(expense.amountCents)}</p>
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
