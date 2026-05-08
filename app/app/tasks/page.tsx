import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { getTasksPageData, taskStatusLabels, type TaskStatus } from "@/lib/tasks";
import { confirmTaskOccurrenceAction, doneTaskOccurrenceAction, skipTaskOccurrenceAction, startTaskOccurrenceAction } from "./actions";

function formatDate(date: Date | null) {
  if (!date) return "ohne Datum";
  return new Intl.DateTimeFormat("de-DE", { weekday: "short", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit", timeZone: "UTC" }).format(date);
}

function rewardLine(task: { drachmenReward: number | null; xpReward: number | null; moneyRewardCents: number | null; badgeRewardTitle: string | null }) {
  const parts = [];
  if (task.drachmenReward) parts.push(`${task.drachmenReward} Drachmen`);
  if (task.xpReward) parts.push(`${task.xpReward} XP`);
  if (task.moneyRewardCents) parts.push(`${(task.moneyRewardCents / 100).toLocaleString("de-DE", { style: "currency", currency: "EUR" })}`);
  if (task.badgeRewardTitle) parts.push(`Badge: ${task.badgeRewardTitle}`);
  return parts.join(" · ");
}

function TaskCard({ task }: { task: Awaited<ReturnType<typeof getTasksPageData>>["groups"][number]["items"][number] }) {
  const startAction = startTaskOccurrenceAction.bind(null, task.id);
  const doneAction = doneTaskOccurrenceAction.bind(null, task.id);
  const confirmAction = confirmTaskOccurrenceAction.bind(null, task.id);
  const skipAction = skipTaskOccurrenceAction.bind(null, task.id);
  const rewards = rewardLine(task);

  return (
    <article className="rounded-3xl border border-slate-200 bg-white p-4 text-sm shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h4 className="font-semibold text-slate-950">{task.titleSnapshot}</h4>
          <p className="mt-1 text-xs text-slate-500">{task.member.icon ?? "👤"} {task.member.name} · {formatDate(task.dueAt)}</p>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">{taskStatusLabels[task.status as TaskStatus]}</span>
      </div>
      {task.subtasks.length > 0 ? (
        <ul className="mt-3 grid gap-1 text-xs text-slate-600">
          {task.subtasks.map((subtask) => <li key={subtask.id}>• {subtask.titleSnapshot}</li>)}
        </ul>
      ) : null}
      {rewards ? <p className="mt-3 rounded-2xl bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800">{rewards}</p> : null}
      <div className="mt-3 flex flex-wrap gap-2">
        {task.status === "open" ? <form action={startAction}><Button type="submit" className="min-h-9 bg-slate-100 px-3 text-xs text-slate-950 hover:bg-slate-200">Starten</Button></form> : null}
        {task.status === "open" || task.status === "in_progress" ? <form action={doneAction}><Button type="submit" className="min-h-9 px-3 text-xs">Erledigt</Button></form> : null}
        {task.status === "done" ? <form action={confirmAction}><Button type="submit" className="min-h-9 px-3 text-xs">Bestätigen</Button></form> : null}
        {task.status !== "confirmed" ? <form action={skipAction}><Button type="submit" className="min-h-9 bg-transparent px-3 text-xs text-slate-600 shadow-none hover:bg-slate-100">Überspringen</Button></form> : null}
      </div>
    </article>
  );
}

const kanbanColumnLabels = "Offen · In Arbeit · Erledigt · Bestätigt";

export default async function TasksPage() {
  const { todayOpen, groups } = await getTasksPageData();

  return (
    <div className="space-y-5">
      <section className="rounded-[2rem] bg-gradient-to-br from-emerald-950 via-slate-900 to-indigo-950 p-5 text-white shadow-sm">
        <p className="text-sm text-emerald-200">Aufgaben</p>
        <h2 className="mt-2 text-2xl font-bold">Heute offen</h2>
        <p className="mt-3 text-sm leading-6 text-slate-300">Wiederkehrende Aufgaben, Unteraufgaben und Belohnungen ruhig an einem Ort.</p>
        <Button asChild className="mt-4 bg-white text-slate-950 hover:bg-slate-100">
          <Link href="/app/tasks/new">Aufgabe anlegen</Link>
        </Button>
      </section>

      {todayOpen.length > 0 ? (
        <section className="space-y-3">
          <h3 className="text-lg font-semibold text-slate-950">Heute offene Aufgaben</h3>
          <div className="grid gap-3">{todayOpen.map((task) => <TaskCard key={task.id} task={task} />)}</div>
        </section>
      ) : <EmptyState title="Heute nichts offen" description="Neue Aufgaben kannst du mit Wiederholung und Belohnungen anlegen." />}

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-lg font-semibold text-slate-950">Kanban</h3>
          <span className="sr-only">{kanbanColumnLabels}</span>
          <Link href="/app/tasks/new" className="text-sm font-semibold text-emerald-700">Neu</Link>
        </div>
        <div className="grid gap-3">
          {groups.map((group) => (
            <Card key={group.status}>
              <CardHeader>
                <div className="flex items-center justify-between gap-3">
                  <CardTitle>{group.label}</CardTitle>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">{group.items.length}</span>
                </div>
              </CardHeader>
              <CardContent className="grid gap-3">
                {group.items.length === 0 ? <p className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-500">Keine Aufgaben.</p> : null}
                {group.items.map((task) => <TaskCard key={task.id} task={task} />)}
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
