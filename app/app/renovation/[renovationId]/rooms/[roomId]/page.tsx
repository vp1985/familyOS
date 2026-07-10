import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FloorPlanSvg } from "@/components/renovation/floorplan-svg";
import { getRenovationRoomDetail, roomMetricsFromMillimeters } from "@/lib/renovation";

export default async function RenovationRoomPage({ params }: { params: Promise<{ renovationId: string; roomId: string }> }) {
  const { renovationId, roomId } = await params;
  const { project, room } = await getRenovationRoomDetail(renovationId, roomId);
  const metrics = roomMetricsFromMillimeters(room);

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm font-medium text-emerald-600">{project.title}</p>
        <h2 className="text-2xl font-bold text-slate-950">{room.name}</h2>
        <p className="mt-1 text-sm text-slate-600">Raummaße und erster SVG-Grundriss. L-Form, Dachschrägen und Hintergrundbild folgen in den nächsten Ausbaustufen.</p>
      </div>

      <FloorPlanSvg room={room} />

      <section className="grid grid-cols-2 gap-3">
        <div className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Bodenfläche</p>
          <p className="mt-1 text-2xl font-bold text-slate-950">{metrics ? `${metrics.floorAreaM2.toLocaleString("de-DE")} m²` : "—"}</p>
        </div>
        <div className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Umfang</p>
          <p className="mt-1 text-2xl font-bold text-slate-950">{metrics ? `${metrics.perimeterM.toLocaleString("de-DE")} m` : "—"}</p>
        </div>
        <div className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Wand grob</p>
          <p className="mt-1 text-2xl font-bold text-slate-950">{metrics ? `${metrics.wallAreaM2.toLocaleString("de-DE")} m²` : "—"}</p>
        </div>
        <div className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Farbe grob</p>
          <p className="mt-1 text-2xl font-bold text-slate-950">{metrics ? `${metrics.paintLiters.toLocaleString("de-DE")} l` : "—"}</p>
        </div>
      </section>

      <Card>
        <CardHeader><CardTitle>Nächste Grundriss-Phasen</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm text-slate-600">
          <p><strong>Jetzt:</strong> Rechteckiger Raum mit automatischer Berechnung.</p>
          <p><strong>Nächste Stufe:</strong> Marker für Tür, Fenster, Steckdose und Heizkörper.</p>
          <p><strong>Danach:</strong> L-Form, Dachschrägen als gestrichelte Höhenlinien und Hintergrundbild zum Überzeichnen.</p>
        </CardContent>
      </Card>

      <Button asChild className="w-full bg-white text-slate-800 ring-1 ring-slate-200 hover:bg-slate-50">
        <Link href={`/app/renovation/${project.id}`}>Zurück zur Renovierung</Link>
      </Button>
    </div>
  );
}
