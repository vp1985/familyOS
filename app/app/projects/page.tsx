import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { formatCents } from "@/lib/money";
import { calculateProjectBalance, getProjectList } from "@/lib/projects";

function statusLabel(status: string) {
  if (status === "done") return "Abgeschlossen";
  if (status === "archived") return "Archiviert";
  return "Aktiv";
}

export default async function ProjectsPage() {
  const { projects } = await getProjectList();

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-emerald-600">Gemeinsame Ausgaben</p>
          <h2 className="text-2xl font-bold text-slate-950">Projekte</h2>
          <p className="mt-1 text-sm text-slate-600">Sammelt Einkäufe, Ausflüge oder Geburtstage und teilt Kosten fair auf.</p>
        </div>
        <Button asChild className="shrink-0">
          <Link href="/app/projects/new">Neu</Link>
        </Button>
      </div>

      {projects.length === 0 ? (
        <EmptyState
          title="Noch keine Projekte"
          description="Lege ein Projekt an, wenn ihr gemeinsame Ausgaben sammeln wollt."
          action={<Link href="/app/projects/new" className="font-semibold text-emerald-700">Projekt anlegen</Link>}
        />
      ) : (
        <section className="grid gap-3">
          {projects.map((project) => {
            const members = project.participants.map((participant) => ({
              id: participant.member.id,
              name: participant.member.name,
            }));
            const balance = calculateProjectBalance({
              members,
              expenses: project.expenses.map((expense) => ({
                id: expense.id,
                status: expense.status,
                amountCents: expense.amountCents,
                paidByMemberId: expense.paidByMemberId,
                shares: expense.shares.map((share) => ({
                  familyMemberId: share.familyMemberId,
                  shareCents: share.shareCents,
                })),
              })),
            });

            return (
              <Link key={project.id} href={`/app/projects/${project.id}`} className="block">
                <Card>
                  <CardHeader>
                    <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">{statusLabel(project.status)}</p>
                    <CardTitle>{project.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm text-slate-600">
                    {project.description ? <p>{project.description}</p> : null}
                    <div className="flex items-center justify-between gap-3">
                      <span>{project.expenses.length} Ausgaben · {project.participants.length} Beteiligte</span>
                      <span className="font-bold text-slate-950">{formatCents(balance.totalCents)}</span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </section>
      )}
    </div>
  );
}
