import Link from "next/link";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/ui/stat-card";
import { formatActivityLine, getDashboardData } from "@/lib/dashboard";
import { formatCents } from "@/lib/finances";

export default async function AppDashboardPage() {
  const { context, members, activeConsequences, badges, pointLeaders, summary } = await getDashboardData();

  return (
    <div className="space-y-5">
      <section className="rounded-[2rem] bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 p-5 text-white shadow-sm">
        <p className="text-sm text-slate-300">{context.family.name}</p>
        <h2 className="mt-2 text-2xl font-bold">Guten Überblick, {context.user.name}.</h2>
        <p className="mt-3 text-sm leading-6 text-slate-300">
          Heute wichtig: {summary.todayImportantCount} offene Punkte aus Regeln, Folgen und Projekten.
        </p>
        <div className="mt-4 grid grid-cols-4 gap-2 text-center text-xs">
          <Link href="/app/finance" className="rounded-2xl bg-white/10 px-2 py-3 font-semibold backdrop-blur hover:bg-white/15">
            💶<span className="mt-1 block">Geld</span>
          </Link>
          <Link href="/app/calendar" className="rounded-2xl bg-white/10 px-2 py-3 font-semibold backdrop-blur hover:bg-white/15">
            🗓️<span className="mt-1 block">Plan</span>
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
        <StatCard label="Heute wichtig" value={summary.todayImportantCount.toString()} helper="offene Themen" />
        <StatCard label="Familiengeld" value={formatCents(summary.stats.totalFinanceCents)} helper="gesamt" />
        <StatCard label="Punkte" value={summary.stats.totalPoints.toString()} helper="gesamt" />
        <StatCard label="Kinder" value={summary.stats.children.toString()} helper={`${summary.stats.familyMembers} Personen`} />
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
