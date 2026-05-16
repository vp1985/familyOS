import Link from "next/link";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/ui/stat-card";
import { formatActivityLine, getDashboardData } from "@/lib/dashboard";
import { confirmDashboardTaskAction, markDashboardTaskDoneAction } from "./actions";

function formatShortDateTime(date: Date) {
  return new Intl.DateTimeFormat("de-DE", { weekday: "short", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Berlin" }).format(date);
}

export default async function AppDashboardPage() {
  const { context, members, activeConsequences, badges, pointLeaders, summary, agenda } = await getDashboardData();
  const todayImportantCount = summary.todayImportantCount + agenda.pendingConfirmations.length;

  return (
    <div className="space-y-5">
      <section className="rounded-[2rem] bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 p-5 text-white shadow-sm">
        <p className="text-sm text-slate-300">{context.family.name}</p>
        <h2 className="mt-2 text-2xl font-bold">Guten Überblick, {context.user.name}.</h2>
        <p className="mt-3 text-sm leading-6 text-slate-300">
          Heute wichtig: {todayImportantCount} offene Punkte. {agenda.nextEvent ? `Nächster Termin: ${agenda.nextEvent.title}.` : "Kein Termin mehr heute."}
        </p>
        <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs sm:grid-cols-6">
          <Link href="/app/finance" className="rounded-2xl bg-white/10 px-2 py-3 font-semibold backdrop-blur hover:bg-white/15">
            💶<span className="mt-1 block">Geld</span>
          </Link>
          <Link href="/app/budget" className="rounded-2xl bg-white/10 px-2 py-3 font-semibold backdrop-blur hover:bg-white/15">
            📊<span className="mt-1 block">Budget</span>
          </Link>
          <Link href="/app/calendar" className="rounded-2xl bg-white/10 px-2 py-3 font-semibold backdrop-blur hover:bg-white/15">
            🗓️<span className="mt-1 block">Plan</span>
          </Link>
          <Link href="/app/meals" className="rounded-2xl bg-white/10 px-2 py-3 font-semibold backdrop-blur hover:bg-white/15">
            🍽️<span className="mt-1 block">Essen</span>
          </Link>
          <Link href="/app/kids" className="rounded-2xl bg-white/10 px-2 py-3 font-semibold backdrop-blur hover:bg-white/15">
            🧒<span className="mt-1 block">Kids</span>
          </Link>
          <Link href="/app/tasks" className="rounded-2xl bg-white/10 px-2 py-3 font-semibold backdrop-blur hover:bg-white/15">
            ✅<span className="mt-1 block">Aufgaben</span>
          </Link>
          <Link href="/app/tools" className="rounded-2xl bg-white/10 px-2 py-3 font-semibold backdrop-blur hover:bg-white/15">
            🧰<span className="mt-1 block">Tools</span>
          </Link>
          <Link href="/app/consequences" className="rounded-2xl bg-white/10 px-2 py-3 font-semibold backdrop-blur hover:bg-white/15">
            ⏳<span className="mt-1 block">Folgen</span>
          </Link>
          <Link href="/app/rewards" className="rounded-2xl bg-white/10 px-2 py-3 font-semibold backdrop-blur hover:bg-white/15">
            ⭐<span className="mt-1 block">Punkte</span>
          </Link>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3">
        <StatCard label="Heute wichtig" value={todayImportantCount.toString()} helper="offene Themen" />
        <StatCard label="Bestätigung" value={agenda.pendingConfirmations.length.toString()} helper="wartet auf Eltern" />
        <StatCard label="Heute Aufgaben" value={agenda.todayTasks.length.toString()} helper="fällig" />
        <StatCard label="Punkte" value={summary.stats.totalPoints.toString()} helper="gesamt" />
      </section>

      <section className="space-y-3 rounded-3xl bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Tagesmodus</p>
            <h3 className="text-lg font-semibold text-slate-950">Heute zuerst</h3>
          </div>
          <Button asChild className="min-h-10 px-3 text-xs">
            <Link href="/app/tasks">Aufgaben</Link>
          </Button>
        </div>

        {agenda.nextEvent ? (
          <div className="rounded-2xl bg-indigo-50 px-4 py-3 text-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-indigo-700">Nächster Termin</p>
            <p className="mt-1 font-semibold text-slate-950">{agenda.nextEvent.title}</p>
            <p className="text-slate-600">{agenda.nextEvent.memberName} · {formatShortDateTime(agenda.nextEvent.startsAt)}</p>
          </div>
        ) : null}

        {agenda.pendingConfirmations.length > 0 ? (
          <div className="grid gap-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">Zu bestätigen</p>
            {agenda.pendingConfirmations.map((item) => (
              <div key={item.id} className="flex items-center justify-between gap-3 rounded-2xl bg-amber-50 px-4 py-3 text-sm">
                <div className="min-w-0">
                  <p className="truncate font-semibold text-slate-950">{item.title}</p>
                  <p className="text-xs text-slate-600">{item.memberName}</p>
                </div>
                <form action={confirmDashboardTaskAction}>
                  <input type="hidden" name="occurrenceId" value={item.id} />
                  <Button type="submit" className="min-h-9 px-3 text-xs">Bestätigen</Button>
                </form>
              </div>
            ))}
          </div>
        ) : null}

        {agenda.todayTasks.length > 0 ? (
          <div className="grid gap-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Fällige Aufgaben</p>
            {agenda.todayTasks.map((item) => (
              <div key={item.id} className="flex items-center justify-between gap-3 rounded-2xl bg-slate-50 px-4 py-3 text-sm">
                <div className="min-w-0">
                  <p className="truncate font-semibold text-slate-950">{item.title}</p>
                  <p className="text-xs text-slate-600">{item.memberName}</p>
                </div>
                <form action={markDashboardTaskDoneAction}>
                  <input type="hidden" name="occurrenceId" value={item.id} />
                  <Button type="submit" className="min-h-9 px-3 text-xs">Erledigt</Button>
                </form>
              </div>
            ))}
          </div>
        ) : null}

        {agenda.totalActionCount === 0 && !agenda.nextEvent ? (
          <p className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-500">Heute ist nichts Dringendes offen.</p>
        ) : null}
      </section>

      <section className="space-y-3 rounded-3xl bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Heute</p>
            <h3 className="text-lg font-semibold text-slate-950">Wichtig auf einen Blick</h3>
          </div>
          <Button asChild className="min-h-10 px-3 text-xs">
            <Link href="/app/rules">Regeln</Link>
          </Button>
        </div>
        <div className="grid gap-2 text-sm">
          <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
            <span className="text-slate-600">Heute offene Aufgaben</span>
            <strong className="text-slate-950">{summary.stats.todayOpenTasks}</strong>
          </div>
          <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
            <span className="text-slate-600">Aktive Regeln</span>
            <strong className="text-slate-950">{summary.stats.activeRules}</strong>
          </div>
          <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
            <span className="text-slate-600">Aktive Folgen</span>
            <strong className="text-slate-950">{summary.stats.activeConsequences}</strong>
          </div>
          <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
            <span className="text-slate-600">Aktive Projekte</span>
            <strong className="text-slate-950">{summary.stats.activeProjects}</strong>
          </div>
        </div>
      </section>

      {activeConsequences.length > 0 ? (
        <section className="space-y-3 rounded-3xl bg-amber-50 p-4">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-lg font-semibold text-amber-950">Aktive Folgen</h3>
            <Link href="/app/consequences" className="text-sm font-semibold text-amber-800">Alle</Link>
          </div>
          <div className="grid gap-2">
            {activeConsequences.map((consequence) => (
              <div key={consequence.id} className="rounded-2xl bg-white px-4 py-3 text-sm shadow-sm">
                <p className="font-semibold text-slate-950">{consequence.title}</p>
                <p className="text-slate-600">für {consequence.member.name}</p>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {summary.recentActivity.length > 0 ? (
        <section className="space-y-3 rounded-3xl bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-lg font-semibold text-slate-950">Letzte Bewegungen</h3>
            <Link href="/app/finance" className="text-sm font-semibold text-emerald-700">Geld</Link>
          </div>
          <div className="grid gap-2">
            {summary.recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3 text-sm">
                <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-white text-lg" aria-hidden="true">
                  {activity.type === "money" ? "💶" : "⭐"}
                </span>
                <p className="min-w-0 truncate text-slate-700">{formatActivityLine(activity)}</p>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {pointLeaders.length > 0 ? (
        <section className="space-y-3 rounded-3xl bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-lg font-semibold text-slate-950">Punkte-Spitze</h3>
            <Link href="/app/rewards" className="text-sm font-semibold text-emerald-700">Belohnen</Link>
          </div>
          <div className="grid gap-2">
            {pointLeaders.map((leader) => (
              <div key={leader.member.id} className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className="text-xl" aria-hidden="true">{leader.member.icon ?? "👤"}</span>
                  <span className="font-semibold text-slate-950">{leader.member.name}</span>
                </div>
                <strong className="text-emerald-700">{leader.points} Pkt</strong>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {badges.length > 0 ? (
        <section className="space-y-3 rounded-3xl bg-white p-4 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-950">Neue Badges</h3>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {badges.map((badge) => (
              <div key={badge.id} className="min-w-32 rounded-2xl bg-emerald-50 px-4 py-3 text-center">
                <p className="text-2xl" aria-hidden="true">{badge.icon}</p>
                <p className="mt-1 truncate text-sm font-semibold text-slate-950">{badge.title}</p>
                <p className="truncate text-xs text-slate-500">{badge.member.name}</p>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-lg font-semibold text-slate-950">Familienprofile</h3>
          <Button asChild className="min-h-10 px-3 text-xs">
            <Link href="/app/family">Bearbeiten</Link>
          </Button>
        </div>
        <div className="grid gap-3">
          {members.slice(0, 4).map((member) => (
            <div key={member.id} className="flex items-center gap-3 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-xl" aria-hidden="true">
                {member.icon ?? "👤"}
              </span>
              <div className="min-w-0">
                <p className="truncate font-semibold text-slate-950">{member.name}</p>
                <p className="text-xs text-slate-500">{member.role === "child" ? "Kind" : member.role === "parent" ? "Elternteil" : "Weitere Person"}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
