import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { updateFamilyBadgeVisibilityAction, updateRenovationModuleSettingAction } from "@/lib/family-access";
import { requireFamilyContext } from "@/lib/family-context";

export default async function SettingsPage() {
  const context = await requireFamilyContext();

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm font-medium text-emerald-600">Setup</p>
        <h2 className="text-2xl font-bold text-slate-950">Einstellungen</h2>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Familienkonto</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-slate-700">
          <p><strong>Familie:</strong> {context.family.name}</p>
          <p><strong>Familien-Login:</strong> {context.family.loginSlug ?? "wird beim ersten Kinderkonto automatisch gesetzt"}</p>
          <p><strong>Nutzer:</strong> {context.user.name}</p>
          <p><strong>Rolle:</strong> {context.role}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Module</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={updateRenovationModuleSettingAction} className="space-y-4 text-sm text-slate-700">
            <label className="flex items-start gap-3 rounded-3xl border border-slate-200 bg-white p-4">
              <input
                type="checkbox"
                name="renovationModuleEnabled"
                defaultChecked={context.family.renovationModuleEnabled}
                className="mt-1 h-5 w-5 rounded border-slate-300 text-emerald-600"
              />
              <span>
                <strong className="block text-slate-950">Renovierungsmodul aktivieren</strong>
                Räume, Grundrisse, Material, Kosten und Renovierungsaufgaben als eigenen FamilyOS-Bereich anzeigen.
              </span>
            </label>
            <Button type="submit">Module speichern</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Positive Badges</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={updateFamilyBadgeVisibilityAction} className="space-y-4 text-sm text-slate-700">
            <label className="flex items-start gap-3 rounded-3xl border border-slate-200 bg-white p-4">
              <input
                type="checkbox"
                name="showPositiveBadgesToFamily"
                defaultChecked={context.family.showPositiveBadgesToFamily}
                className="mt-1 h-5 w-5 rounded border-slate-300 text-emerald-600"
              />
              <span>
                <strong className="block text-slate-950">Positive Badges familienweit zeigen</strong>
                Negative Badges gibt es nicht. Wenn diese Einstellung aus ist, sehen nur Eltern und das betroffene Kind den Badge.
              </span>
            </label>
            <Button type="submit">Einstellung speichern</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
