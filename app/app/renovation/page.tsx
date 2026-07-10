import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { formatCents } from "@/lib/money";
import { getRenovationProjects, roomMetricsFromMillimeters } from "@/lib/renovation";

function statusLabel(status: string) {
  if (status === "DONE") return "Abgeschlossen";
  if (status === "PAUSED") return "Pausiert";
  if (status === "PLANNED") return "Geplant";
  if (status === "ARCHIVED") return "Archiviert";
  return "Aktiv";
}

export default async function RenovationPage() {
  const { projects } = await getRenovationProjects();

  return (
    <div className="space-y-5">
      <section className="rounded-[2rem] bg-gradient-to-br from-slate-950 via-emerald-950 to-teal-900 p-5 text-white shadow-sm">
        <p className="text-sm text-emerald-200">Renovierung</p>
        <h2 className="mt-2 text-2xl font-bold">Räume, Material & Kosten</h2>
        <p className="mt-3 text-sm leading-6 text-slate-300">Plane Renovierungen mit Räumen, Grundmaßen, Aufgaben, Materialbedarf und Budget.</p>
      </section>

      <div className="flex items-center justify-between gap-3">
        <h3 className="text-lg font-semibold text-slate-950">Aktive Vorhaben</h3>
        <Button asChild className="shrink-0"><Link href="/app/renovation/new">Neu</Link></Button>
      </div>

      {projects.length === 0 ? (
        <EmptyState title="Noch keine Renovierung" description="Lege ein Renovierungsprojekt an, z. B. Kinderzimmer, Bad oder Haus 2027." action={<Link href="/app/renovation/new" className="font-semibold text-emerald-700">Renovierung anlegen</Link>} />
      ) : (
        <section className="grid gap-3">
          {projects.map((project) => {
            const totalFloorArea = project.rooms.reduce((sum, room) => sum + (roomMetricsFromMillimeters(room)?.floorAreaM2 ?? 0), 0);
            return (
              <Link key={project.id} href={`/app/renovation/${project.id}`} className="block">
                <Card>
                  <CardHeader>
                    <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">{statusLabel(project.status)}</p>
                    <CardTitle>{project.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm text-slate-600">
                    {project.description ? <p>{project.description}</p> : null}
                    <div className="flex items-center justify-between gap-3">
                      <span>{project.rooms.length} Räume · {totalFloorArea.toLocaleString("de-DE", { maximumFractionDigits: 1 })} m²</span>
                      <span className="font-bold text-slate-950">{project.budgetCents ? formatCents(project.budgetCents) : "kein Budget"}</span>
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
