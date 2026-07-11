import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormField } from "@/components/ui/form-field";
import { FloorPlanSvg } from "@/components/renovation/floorplan-svg";
import {
  buildRenovationProgress,
  getRenovationProjectDetail,
  groupRenovationTasksByStatus,
  renovationTaskStatusLabel,
  roomMetricsFromMillimeters,
} from "@/lib/renovation";
import {
  createRenovationRoomAction,
  createRenovationTaskAction,
  createRenovationWorkPackageAction,
  updateRenovationTaskStatusAction,
} from "../actions";

function roomStatusLabel(status: string) {
  if (status === "DONE") return "Fertig";
  if (status === "BLOCKED") return "Blockiert";
  if (status === "IN_PROGRESS") return "In Arbeit";
  if (status === "PLANNED") return "Geplant";
  return "Offen";
}

function statusTone(status: string) {
  if (status === "DONE") return "bg-emerald-50 text-emerald-700 ring-emerald-200";
  if (status === "BLOCKED") return "bg-rose-50 text-rose-700 ring-rose-200";
  if (status === "IN_PROGRESS") return "bg-blue-50 text-blue-700 ring-blue-200";
  if (status === "PLANNED") return "bg-amber-50 text-amber-700 ring-amber-200";
  return "bg-slate-50 text-slate-700 ring-slate-200";
}

export default async function RenovationDetailPage({ params }: { params: Promise<{ renovationId: string }> }) {
  const { renovationId } = await params;
  const { project } = await getRenovationProjectDetail(renovationId);
  const totalFloorArea = project.rooms.reduce((sum, room) => sum + (roomMetricsFromMillimeters(room)?.floorAreaM2 ?? 0), 0);
  const totalWallArea = project.rooms.reduce((sum, room) => sum + (roomMetricsFromMillimeters(room)?.wallAreaM2 ?? 0), 0);
  const progress = buildRenovationProgress(project.tasks);
  const groupedTasks = groupRenovationTasksByStatus(project.tasks);

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
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Fortschritt</p>
          <p className="mt-1 text-2xl font-bold text-slate-950">{progress.percent} %</p>
          <p className="mt-1 text-xs text-slate-500">{progress.done}/{progress.total} erledigt · {progress.blocked} Blocker</p>
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
                    <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">{roomStatusLabel(room.status)}</p>
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

      <Card>
        <CardHeader><CardTitle>Arbeitspaket anlegen</CardTitle></CardHeader>
        <CardContent>
          <form action={createRenovationWorkPackageAction.bind(null, project.id)} className="space-y-4">
            <FormField label="Titel" name="title" placeholder="Wände vorbereiten" required />
            <FormField label="Beschreibung" name="description" placeholder="Tapete entfernen, spachteln, schleifen" />
            <label className="block text-sm font-medium text-slate-700">
              Raum optional
              <select name="roomId" className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm">
                <option value="">Gesamtes Projekt</option>
                {project.rooms.map((room) => <option key={room.id} value={room.id}>{room.name}</option>)}
              </select>
            </label>
            <Button type="submit" className="w-full">Arbeitspaket speichern</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Aufgabe anlegen</CardTitle></CardHeader>
        <CardContent>
          <form action={createRenovationTaskAction.bind(null, project.id)} className="space-y-4">
            <FormField label="Aufgabe" name="title" placeholder="Farbe kaufen" required />
            <FormField label="Beschreibung" name="description" placeholder="2 Eimer Wandfarbe, Malerkrepp, Rollen" />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <label className="block text-sm font-medium text-slate-700">
                Status
                <select name="status" className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm">
                  <option value="OPEN">Offen</option>
                  <option value="PLANNED">Geplant</option>
                  <option value="IN_PROGRESS">Läuft</option>
                  <option value="BLOCKED">Blockiert</option>
                  <option value="DONE">Erledigt</option>
                </select>
              </label>
              <label className="block text-sm font-medium text-slate-700">
                Raum
                <select name="roomId" className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm">
                  <option value="">Ohne Raum</option>
                  {project.rooms.map((room) => <option key={room.id} value={room.id}>{room.name}</option>)}
                </select>
              </label>
              <label className="block text-sm font-medium text-slate-700">
                Paket
                <select name="workPackageId" className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm">
                  <option value="">Ohne Paket</option>
                  {project.workPackages.map((workPackage) => <option key={workPackage.id} value={workPackage.id}>{workPackage.title}</option>)}
                </select>
              </label>
            </div>
            <FormField label="Blocker-Hinweis" name="blockerNote" placeholder="z. B. Material fehlt" />
            <Button type="submit" className="w-full">Aufgabe speichern</Button>
          </form>
        </CardContent>
      </Card>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-lg font-semibold text-slate-950">Arbeitspakete & Aufgaben</h3>
          <span className="rounded-full bg-white px-3 py-1 text-sm font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200">{progress.total} Aufgaben</span>
        </div>

        {project.workPackages.length > 0 ? (
          <div className="space-y-3">
            {project.workPackages.map((workPackage) => {
              const packageProgress = buildRenovationProgress(workPackage.tasks);
              return (
                <Card key={workPackage.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">{workPackage.room?.name ?? "Gesamtes Projekt"}</p>
                        <CardTitle>{workPackage.title}</CardTitle>
                        {workPackage.description ? <p className="mt-1 text-sm text-slate-600">{workPackage.description}</p> : null}
                      </div>
                      <span className="rounded-full bg-slate-50 px-3 py-1 text-sm font-semibold text-slate-700 ring-1 ring-slate-200">{packageProgress.percent}%</span>
                    </div>
                  </CardHeader>
                </Card>
              );
            })}
          </div>
        ) : <p className="rounded-3xl bg-white p-4 text-sm text-slate-600 shadow-sm ring-1 ring-slate-200">Noch keine Arbeitspakete.</p>}

        <div className="grid grid-cols-1 gap-3 lg:grid-cols-5">
          {groupedTasks.map((group) => (
            <div key={group.status} className="rounded-3xl bg-white p-3 shadow-sm ring-1 ring-slate-200">
              <div className="mb-3 flex items-center justify-between gap-2">
                <h4 className="text-sm font-bold text-slate-900">{group.label}</h4>
                <span className="text-xs font-semibold text-slate-500">{group.tasks.length}</span>
              </div>
              <div className="space-y-2">
                {group.tasks.map((task) => (
                  <div key={task.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold text-slate-950">{task.title}</p>
                        <p className="text-xs text-slate-500">{task.room?.name ?? "Ohne Raum"}{task.workPackage ? ` · ${task.workPackage.title}` : ""}</p>
                      </div>
                      <span className={`rounded-full px-2 py-1 text-xs font-semibold ring-1 ${statusTone(task.status)}`}>{renovationTaskStatusLabel(task.status)}</span>
                    </div>
                    {task.description ? <p className="mt-2 text-sm text-slate-600">{task.description}</p> : null}
                    {task.blockerNote ? <p className="mt-2 rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">Blocker: {task.blockerNote}</p> : null}
                    <form action={updateRenovationTaskStatusAction.bind(null, project.id)} className="mt-3 flex gap-2">
                      <input type="hidden" name="taskId" value={task.id} />
                      <select name="status" defaultValue={task.status} className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-2 py-2 text-xs">
                        <option value="OPEN">Offen</option>
                        <option value="PLANNED">Geplant</option>
                        <option value="IN_PROGRESS">Läuft</option>
                        <option value="BLOCKED">Blockiert</option>
                        <option value="DONE">Erledigt</option>
                      </select>
                      <Button type="submit" className="px-3 py-2 text-xs">OK</Button>
                    </form>
                  </div>
                ))}
                {group.tasks.length === 0 ? <p className="text-xs text-slate-400">Leer</p> : null}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
