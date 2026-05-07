import Link from "next/link";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/ui/stat-card";
import { requireFamilyContext } from "@/lib/family-context";

export default async function AppDashboardPage() {
  const context = await requireFamilyContext();

  return (
    <div className="space-y-5">
      <section className="rounded-3xl bg-slate-950 p-5 text-white shadow-sm">
        <p className="text-sm text-slate-300">{context.family.name}</p>
        <h2 className="mt-2 text-2xl font-bold">Hallo {context.user.name}.</h2>
        <p className="mt-3 text-sm leading-6 text-slate-300">
          Sprint 1 ist vorbereitet: Login, Familienkonto und sicherer Familienkontext sind aktiv. Kinderprofile folgen in Sprint 2.
        </p>
      </section>

      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Rolle" value={context.role} helper="in dieser Familie" />
        <StatCard label="Status" value="S1" helper="Auth aktiv" />
      </div>

      <EmptyState
        title="Noch keine Kinder angelegt"
        description="Kinderprofile werden in Sprint 2 umgesetzt. Danach kommen Finanzen und gemeinsame Ausgaben."
        action={
          <Button asChild>
            <Link href="/app/family">Kind anlegen vorbereiten</Link>
          </Button>
        }
      />
    </div>
  );
}
