import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import {
  getRuleTemplateAgeGroups,
  getRuleTemplateCategories,
  getRuleTemplatesForSelection,
  groupRuleTemplatesByCategory,
  isRuleTemplateAgeGroup,
  type RuleTemplateAgeGroupId,
} from "@/lib/rule-templates";
import { getRulesPageData } from "@/lib/rules";
import { importRuleTemplatesAction, toggleRuleAction } from "./actions";

function categoryLabel(category: string) {
  const labels: Record<string, string> = Object.fromEntries(getRuleTemplateCategories().map((item) => [item.id, item.label]));
  return labels[category] ?? category;
}

type RulesPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function firstSearchParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function RulesPage({ searchParams }: RulesPageProps) {
  const [{ rules }, params] = await Promise.all([
    getRulesPageData(),
    searchParams ?? Promise.resolve({} as Record<string, string | string[] | undefined>),
  ]);
  const requestedAgeGroup = firstSearchParam(params.ageGroup);
  const selectedAgeGroup: RuleTemplateAgeGroupId = requestedAgeGroup && isRuleTemplateAgeGroup(requestedAgeGroup) ? requestedAgeGroup : "6-8";
  const ageGroups = getRuleTemplateAgeGroups();
  const templateGroups = groupRuleTemplatesByCategory(getRuleTemplatesForSelection({ ageGroup: selectedAgeGroup }));

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

      <Card className="border-emerald-100 bg-emerald-50/60">
        <CardHeader>
          <p className="text-sm font-semibold text-emerald-700">Low-Attention Start</p>
          <CardTitle>Regel-Set übernehmen</CardTitle>
          <p className="text-sm text-slate-600">Wähle eine Altersgruppe und übernimm passende Vorschläge einzeln oder gruppenweise.</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <form action="/app/rules" className="grid gap-2 sm:grid-cols-[1fr_auto]">
            <label className="grid gap-2 text-sm font-semibold text-slate-800" htmlFor="ageGroup">
              Altersgruppe
              <select
                id="ageGroup"
                name="ageGroup"
                defaultValue={selectedAgeGroup}
                className="min-h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm shadow-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              >
                {ageGroups.map((ageGroup) => (
                  <option key={ageGroup.id} value={ageGroup.id}>{ageGroup.label}</option>
                ))}
              </select>
            </label>
            <Button type="submit" className="self-end bg-white text-slate-900 ring-1 ring-slate-200 hover:bg-slate-50">
              Vorschläge ansehen
            </Button>
          </form>

          <form action={importRuleTemplatesAction} className="space-y-4">
            <input type="hidden" name="ageGroup" value={selectedAgeGroup} />
            {templateGroups.map((group) => (
              <div key={group.category.id} className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-emerald-100">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-950">{group.category.label}</p>
                    <p className="text-xs text-slate-500">{group.templates.length} Vorschläge für diese Altersgruppe</p>
                  </div>
                  <label className="flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800">
                    <input type="checkbox" name="category" value={group.category.id} className="size-4 accent-emerald-700" />
                    Ganze Kategorie übernehmen
                  </label>
                </div>
                <div className="mt-3 grid gap-2">
                  {group.templates.map((template) => (
                    <label key={template.id} className="flex gap-3 rounded-2xl border border-slate-100 bg-slate-50 px-3 py-3 text-sm text-slate-700">
                      <input type="checkbox" name="templateId" value={template.id} className="mt-1 size-4 shrink-0 accent-emerald-700" />
                      <span>
                        <span className="block font-semibold text-slate-900">{template.title}</span>
                        <span className="block text-xs leading-5 text-slate-500">{template.description}</span>
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
            <Button type="submit" className="w-full bg-emerald-700 hover:bg-emerald-800">
              Ausgewählte Regeln übernehmen
            </Button>
          </form>
        </CardContent>
      </Card>

      {rules.length === 0 ? (
        <EmptyState
          title="Noch keine Regeln"
          description="Lege die erste Familienregel an oder übernimm oben ein passendes Regel-Set."
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
