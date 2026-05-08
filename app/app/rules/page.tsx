import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { getRulesPageData } from "@/lib/rules";
import { toggleRuleAction } from "./actions";

function categoryLabel(category: string) {
  const labels: Record<string, string> = {
    medien: "Medien",
    ordnung: "Ordnung",
    schule: "Schule",
    umgang: "Umgang",
    gesundheit: "Gesundheit",
  };
  return labels[category] ?? category;
}

export default async function RulesPage() {
  const { rules } = await getRulesPageData();

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-emerald-600">Regeln & Ereignisse</p>
          <h2 className="text-2xl font-bold text-slate-950">Regeln</h2>
          <p className="mt-1 text-sm text-slate-600">Macht sichtbar, was gilt, und dokumentiert Verstöße ohne Diskussion.</p>
        </div>
        <Button asChild className="shrink-0">
          <Link href="/app/rules/new">Neu</Link>
        </Button>
      </div>

      {rules.length === 0 ? (
        <EmptyState
          title="Noch keine Regeln"
          description="Lege die erste Familienregel an, damit Ereignisse dokumentiert werden können."
          action={<Link href="/app/rules/new" className="font-semibold text-emerald-700">Regel anlegen</Link>}
        />
      ) : (
        <section className="grid gap-3">
          {rules.map((rule) => {
            const toggleAction = toggleRuleAction.bind(null, rule.id, !rule.isActive);
            return (
              <Card key={rule.id} className={rule.isActive ? undefined : "bg-slate-50 opacity-80"}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <CardTitle>{rule.title}</CardTitle>
                      <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-emerald-700">{categoryLabel(rule.category)}</p>
                    </div>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                      {rule.isActive ? "aktiv" : "inaktiv"}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 text-sm text-slate-600">
                  {rule.description ? <p>{rule.description}</p> : null}
                  <div className="flex flex-wrap gap-2">
                    <Button asChild className="min-h-10 bg-emerald-700 px-3 py-1 text-xs hover:bg-emerald-800">
                      <Link href={`/app/rules/${rule.id}/events/new`}>Verstoß</Link>
                    </Button>
                    <form action={toggleAction}>
                      <Button type="submit" className="min-h-10 bg-white px-3 py-1 text-xs text-slate-800 ring-1 ring-slate-200 hover:bg-slate-50">
                        {rule.isActive ? "Deaktivieren" : "Aktivieren"}
                      </Button>
                    </form>
                  </div>
                  <div className="rounded-2xl bg-slate-50 px-4 py-3">
                    <p className="font-semibold text-slate-800">Historie</p>
                    {rule.events.length === 0 ? (
                      <p className="mt-1 text-slate-500">Noch keine Ereignisse.</p>
                    ) : (
                      <ul className="mt-2 space-y-2">
                        {rule.events.map((event) => (
                          <li key={event.id}>
                            <span className="font-medium text-slate-800">{event.member.name}</span>: {event.note}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </section>
      )}
    </div>
  );
}
