import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireFamilyAdmin } from "@/lib/family-context";

export const dynamic = "force-dynamic";

async function getDatabaseStatus() {
  try {
    await db.$queryRaw`SELECT 1`;
    return { label: "erreichbar", ok: true };
  } catch (error) {
    console.error("Healthcheck database error", error);
    return { label: "nicht erreichbar", ok: false };
  }
}

export default async function HealthPage() {
  await requireFamilyAdmin();
  const database = await getDatabaseStatus();

  const checks = [
    { label: "App", value: "läuft", ok: true },
    { label: "Datenbank", value: database.label, ok: database.ok },
    { label: "Umgebung", value: process.env.NODE_ENV ?? "unbekannt", ok: true },
  ];

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm font-medium text-emerald-600">Technischer Status</p>
        <h2 className="text-2xl font-bold text-slate-950">Healthcheck</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Sprint-0 Checks</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {checks.map((check) => (
            <div key={check.label} className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
              <span className="font-medium text-slate-700">{check.label}</span>
              <span className={check.ok ? "text-sm font-semibold text-emerald-700" : "text-sm font-semibold text-amber-700"}>
                {check.value}
              </span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
