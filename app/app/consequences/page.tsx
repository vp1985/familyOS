import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { getConsequencesPageData } from "@/lib/consequences";
import { updateConsequenceStatusAction } from "./actions";

function statusText(status: string) {
  if (status === "done") return "erledigt";
  if (status === "cancelled") return "aufgehoben";
  return "aktiv";
}

function formatDate(date: Date | null) {
  if (!date) return "offen";
  return new Intl.DateTimeFormat("de-DE", { dateStyle: "medium" }).format(date);
}

export default async function ConsequencesPage() {
  const { consequences } = await getConsequencesPageData();
  const activeConsequences = consequences.filter((consequence) => consequence.status === "active");

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-emerald-600">Konsequenzen</p>
          <h2 className="text-2xl font-bold text-slate-950">Aktive Folgen</h2>
          <p className="mt-1 text-sm text-slate-600">Haltet fest, was gerade gilt und wann es erledigt oder aufgehoben ist.</p>
        </div>
        <Button asChild className="shrink-0">
          <Link href="/app/consequences/new">Neu</Link>
        </Button>
      </div>

      {consequences.length === 0 ? (
        <EmptyState
          title="Noch keine Konsequenzen"
          description="Lege eine Konsequenz an, wenn eine Regel sichtbar nachverfolgt werden soll."
          action={<Link href="/app/consequences/new" className="font-semibold text-emerald-700">Konsequenz anlegen</Link>}
        />
      ) : (
        <section className="grid gap-3">
          {activeConsequences.length === 0 ? (
            <p className="rounded-3xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">Keine aktive Konsequenz.</p>
          ) : null}
          {consequences.map((consequence) => {
            const doneAction = updateConsequenceStatusAction.bind(null, consequence.id, "done");
            const cancelledAction = updateConsequenceStatusAction.bind(null, consequence.id, "cancelled");
            return (
              <Card key={consequence.id} className={consequence.status === "active" ? undefined : "bg-slate-50 opacity-80"}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <CardTitle>{consequence.title}</CardTitle>
                      <p className="mt-1 text-sm text-slate-600">für {consequence.member.name}</p>
                    </div>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                      {statusText(consequence.status)}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-slate-600">
                  {consequence.description ? <p>{consequence.description}</p> : null}
                  <p>Von {formatDate(consequence.startDate)} bis {formatDate(consequence.endDate)}</p>
                  {consequence.ruleEvent ? (
                    <p className="rounded-2xl bg-amber-50 px-4 py-3 text-amber-900">
                      Bezug: {consequence.ruleEvent.rule.title} · {consequence.ruleEvent.note}
                    </p>
                  ) : null}
                  {consequence.status === "active" ? (
                    <div className="grid grid-cols-2 gap-2">
                      <form action={doneAction}>
                        <Button type="submit" className="w-full min-h-10 bg-emerald-700 px-3 py-1 text-xs hover:bg-emerald-800">Erledigt</Button>
                      </form>
                      <form action={cancelledAction}>
                        <Button type="submit" className="w-full min-h-10 bg-white px-3 py-1 text-xs text-slate-800 ring-1 ring-slate-200 hover:bg-slate-50">Aufheben</Button>
                      </form>
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            );
          })}
        </section>
      )}
    </div>
  );
}
