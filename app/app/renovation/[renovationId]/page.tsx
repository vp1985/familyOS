import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormField } from "@/components/ui/form-field";
import { FloorPlanSvg } from "@/components/renovation/floorplan-svg";
import { getRenovationProjectDetail, roomMetricsFromMillimeters } from "@/lib/renovation";
import { createRenovationRoomAction } from "../actions";

function statusLabel(status: string) {
  if (status === "DONE") return "Fertig";
  if (status === "BLOCKED") return "Blockiert";
  if (status === "IN_PROGRESS") return "In Arbeit";
  if (status === "PLANNED") return "Geplant";
  return "Offen";
}

export default async function RenovationDetailPage({ params }: { params: Promise<{ renovationId: string }> }) {
  const { renovationId } = await params;
  const { project } = await getRenovationProjectDetail(renovationId);
  const totalFloorArea = project.rooms.reduce((sum, room) => sum + (roomMetricsFromMillimeters(room)?.floorAreaM2 ?? 0), 0);
  const totalWallArea = project.rooms.reduce((sum, room) => sum + (roomMetricsFromMillimeters(room)?.wallAreaM2 ?? 0), 0);

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm font-medium text-emerald-600">Renovierung</p>
        <h2 className="text-2xl font-bold text-slate-950">{project.title}</h2>
        {project.description ? <p className="mt-1 text-sm text-slate-600">{project.description}</p> : null}
      </div>

      <section className="grid grid-cols-2 gap-3">
        <div className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Räume</p>
          <p className="mt-1 text-2xl font-bold text-slate-950">{project.rooms.length}</p>
        </div>
        <div className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Bodenfläche</p>
          <p className="mt-1 text-2xl font-bold text-slate-950">{totalFloorArea.toLocaleString("de-DE", { maximumFractionDigits: 1 })} m²</p>
        </div>
        <div className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Wand grob</p>
          <p className="mt-1 text-2xl font-bold text-slate-950">{totalWallArea.toLocaleString("de-DE", { maximumFractionDigits: 1 })} m²</p>
        </div>
        <div className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Status</p>
          <p className="mt-1 text-2xl font-bold text-slate-950">Start</p>
        </div>
      </section>

      <Card>
        <CardHeader><CardTitle>Raum anlegen</CardTitle></CardHeader>
        <CardContent>
          <form action={createRenovationRoomAction.bind(null, project.id)} className="space-y-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <FormField label="Raumname" name="name" placeholder="Kinderzimmer" required />
              <FormField label="Kategorie" name="category" defaultValue="Raum" />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <FormField label="Länge m" name="lengthM" inputMode="decimal" placeholder="5,20" />
              <FormField label="Breite m" name="widthM" inputMode="decimal" placeholder="3,50" />
              <FormField label="Höhe m" name="heightM" inputMode="decimal" placeholder="2,50" />
            </div>
            <Button type="submit" className="w-full">Raum speichern</Button>
          </form>
        </CardContent>
      </Card>

      <section className="space-y-3">
        <h3 className="text-lg font-semibold text-slate-950">Räume & Grundrisse</h3>
        {project.rooms.length === 0 ? <p className="rounded-3xl bg-white p-4 text-sm text-slate-600 shadow-sm ring-1 ring-slate-200">Noch keine Räume. Lege zuerst einen Raum mit Länge, Breite und Höhe an.</p> : null}
        {project.rooms.map((room) => {
          const metrics = roomMetricsFromMillimeters(room);
          return (
            <Card key={room.id}>
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">{statusLabel(room.status)}</p>
                    <CardTitle>{room.name}</CardTitle>
                  </div>
                  <Button asChild className="shrink-0"><Link href={`/app/renovation/${project.id}/rooms/${room.id}`}>Öffnen</Link></Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <FloorPlanSvg room={room} />
                {metrics ? <p className="text-sm text-slate-600">{metrics.floorAreaM2.toLocaleString("de-DE")} m² Boden · {metrics.wallAreaM2.toLocaleString("de-DE")} m² Wand grob · {metrics.paintLiters.toLocaleString("de-DE")} l Farbe</p> : <p className="text-sm text-slate-600">Maße fehlen noch.</p>}
              </CardContent>
            </Card>
          );
        })}
      </section>
    </div>
  );
}
