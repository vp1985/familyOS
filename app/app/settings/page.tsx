import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
          <p><strong>Nutzer:</strong> {context.user.name}</p>
          <p><strong>Rolle:</strong> {context.role}</p>
        </CardContent>
      </Card>
    </div>
  );
}
