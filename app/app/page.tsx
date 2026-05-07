import Link from "next/link";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/ui/stat-card";

export default function AppDashboardPage() {
  return (
    <div className="space-y-5">
      <section className="rounded-3xl bg-slate-950 p-5 text-white shadow-sm">
        <p className="text-sm text-slate-300">Sprint 0</p>
        <h2 className="mt-2 text-2xl font-bold">App-Shell steht.</h2>
        <p className="mt-3 text-sm leading-6 text-slate-300">
          Auth und echte Familiendaten kommen in Sprint 1. Diese Ansicht zeigt die vorbereitete mobile Grundstruktur.
        </p>
      </section>

      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Module" value="4" helper="Basis vorbereitet" />
        <StatCard label="Status" value="S0" helper="Baustart" />
      </div>

      <EmptyState
        title="Noch keine Kinder angelegt"
        description="Kinderprofile werden in Sprint 2 umgesetzt. Sprint 0 liefert dafür Layout, UI und Datenbankbasis."
        action={
          <Button asChild>
            <Link href="/app/health">Healthcheck öffnen</Link>
          </Button>
        }
      />
    </div>
  );
}
