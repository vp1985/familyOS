import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import {
  buildPlanningProgress,
  formatPlanningDateRange,
  getPlanningListData,
  planningStatusLabel,
  planningTypeIcon,
  planningTypeLabel,
} from "@/lib/planning";

function PlanningCard({ plan }: { plan: Awaited<ReturnType<typeof getPlanningListData>>["plans"][number] }) {
  const appointment = plan.calendarEvent;
  const progress = buildPlanningProgress({ tasks: plan.taskOccurrences, checklists: plan.checklistInstances, documents: plan.documents });
  const percentage = progress.total > 0 ? Math.round((progress.done / progress.total) * 100) : 0;

  return (
    <Link href={`/app/planning/${plan.id}`} className="block">
      <Card className="transition hover:border-emerald-300 hover:shadow-md">
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">{planningTypeIcon(plan.type)} {planningTypeLabel(plan.type)} · {planningStatusLabel(plan.status)}</p>
              <CardTitle className="mt-1 truncate">{appointment.title}</CardTitle>
              <p className="mt-1 text-sm text-slate-500">{formatPlanningDateRange(appointment.startsAt, appointment.endsAt ?? appointment.startsAt)}{appointment.location ? ` · ${appointment.location}` : ""}</p>
            </div>
            <span className="shrink-0 rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">{progress.done}/{progress.total}</span>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="h-2 overflow-hidden rounded-full bg-slate-100" aria-label={`${percentage} Prozent vorbereitet`}>
            <div className="h-full rounded-full bg-emerald-500" style={{ width: `${percentage}%` }} />
          </div>
          <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs font-medium text-slate-600">
            <span>{plan.members.length} Zuständige</span>
            <span>{plan.guests.length} Gäste</span>
            <span>{plan.taskOccurrences.length} Aufgaben</span>
            <span>{plan.checklistInstances.length} Listen</span>
            {plan.costProject ? <span>💶 Kosten</span> : null}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export default async function PlanningPage() {
  const { plans } = await getPlanningListData();
  const activePlans = plans.filter((plan) => plan.status === "ACTIVE");
  const completedPlans = plans.filter((plan) => plan.status !== "ACTIVE");

  return (
    <div className="space-y-5">
      <section className="rounded-[2rem] bg-gradient-to-br from-slate-950 via-emerald-950 to-teal-900 p-5 text-white shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-emerald-200">Planung</p>
            <h2 className="mt-2 text-2xl font-bold">Alles für den Anlass</h2>
            <p className="mt-2 text-sm leading-6 text-slate-200">Geburtstage, Urlaube, Besuche & Ausflüge</p>
          </div>
          <Button asChild className="shrink-0 bg-white text-slate-950 hover:bg-emerald-50"><Link href="/app/planning/new">Neu</Link></Button>
        </div>
        <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold">
          <Link href="/app/calendar" className="rounded-full bg-white/10 px-3 py-2 hover:bg-white/20">🗓️ Kalender</Link>
          <Link href="/app/relationships" className="rounded-full bg-white/10 px-3 py-2 hover:bg-white/20">🤝 Beziehungen</Link>
          <Link href="/app/projects" className="rounded-full bg-white/10 px-3 py-2 hover:bg-white/20">💶 Kostenprojekte</Link>
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-lg font-semibold text-slate-950">Aktuelle Planungen</h3>
          <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-600">{activePlans.length}</span>
        </div>
        {activePlans.length === 0 ? (
          <EmptyState
            title="Noch nichts in Planung"
            description="Lege einen Geburtstag, Urlaub, Besuch oder Ausflug an und verbinde alle Vorbereitungen."
            action={<Link href="/app/planning/new" className="font-semibold text-emerald-700">Erste Planung anlegen</Link>}
          />
        ) : (
          <div className="grid gap-3">{activePlans.map((plan) => <PlanningCard key={plan.id} plan={plan} />)}</div>
        )}
      </section>

      {completedPlans.length > 0 ? (
        <details className="rounded-3xl border border-slate-200 bg-white p-4">
          <summary className="cursor-pointer text-sm font-semibold text-slate-800">Abgeschlossen & archiviert ({completedPlans.length})</summary>
          <div className="mt-4 grid gap-3">{completedPlans.map((plan) => <PlanningCard key={plan.id} plan={plan} />)}</div>
        </details>
      ) : null}
    </div>
  );
}
