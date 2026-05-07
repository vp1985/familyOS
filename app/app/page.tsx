import Link from "next/link";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/ui/stat-card";
import { getFamilyMembers } from "@/lib/family-members";

export default async function AppDashboardPage() {
  const { context, members } = await getFamilyMembers();
  const childCount = members.filter((member) => member.role === "child").length;

  return (
    <div className="space-y-5">
      <section className="rounded-3xl bg-slate-950 p-5 text-white shadow-sm">
        <p className="text-sm text-slate-300">{context.family.name}</p>
        <h2 className="mt-2 text-2xl font-bold">Hallo {context.user.name}.</h2>
        <p className="mt-3 text-sm leading-6 text-slate-300">
          Sprint 2 ist aktiv: Du kannst jetzt Kinder und andere Familienprofile anlegen. Darauf bauen Finanzen und Splits auf.
        </p>
      </section>

      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Kinder" value={childCount.toString()} helper="Profile angelegt" />
        <StatCard label="Familie" value={members.length.toString()} helper="Personen gesamt" />
      </div>

      {members.length > 0 ? (
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
      ) : (
        <EmptyState
          title="Noch keine Kinder angelegt"
          description="Lege jetzt das erste Kinderprofil an. Danach können wir Konten, Ausgaben und Projekte daran hängen."
          action={
            <Button asChild>
              <Link href="/app/family">Kind anlegen</Link>
            </Button>
          }
        />
      )}
    </div>
  );
}
