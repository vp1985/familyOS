import Link from "next/link";
import { createCalendarEventAction, createCalendarSourceAction, syncCalendarSourceAction } from "@/app/app/calendar/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormField } from "@/components/ui/form-field";
import { formatTime, getCalendarPageData } from "@/lib/calendar";

function errorText(error?: string) {
  if (error === "invalid-event") return "Bitte gib Titel und Datum korrekt an.";
  if (error === "invalid-member") return "Bitte wähle nur Personen aus deiner Familie.";
  if (error === "invalid-source") return "Bitte gib Name und Kalender-Link korrekt an.";
  if (error === "sync-failed") return "Kalender konnte nicht synchronisiert werden. Prüfe den privaten iCal-Link.";
  return null;
}

function isoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function weekReference(value?: string) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return new Date();
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) || isoDate(date) !== value ? new Date() : date;
}

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; week?: string; event?: string }>;
}) {
  const params = await searchParams;
  const { members, sources, week, days } = await getCalendarPageData(weekReference(params.week));
  const error = errorText(params.error);

  return (
    <div className="space-y-5">
      <section className="rounded-[2rem] bg-gradient-to-br from-indigo-950 via-slate-900 to-emerald-950 p-5 text-white shadow-sm">
        <p className="text-sm text-indigo-200">Wochenplan</p>
        <h2 className="mt-2 text-2xl font-bold">{params.week ? "Ausgewählte Woche" : "Diese Woche"}</h2>
        <p className="mt-3 text-sm leading-6 text-slate-300">
          {isoDate(week.start)} bis {isoDate(new Date(week.end.getTime() - 1))}: Termine, Aufgaben und Familienpunkte an einem Ort.
        </p>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Google Kalender importieren</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form action={createCalendarSourceAction} className="space-y-4">
            {error ? <p className="rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-800">{error}</p> : null}
            <FormField label="Name" name="name" placeholder="z. B. Schulkalender" required />
            <FormField label="Privater iCal-Link aus Google Kalender" name="url" type="url" placeholder="https://calendar.google.com/calendar/ical/.../basic.ics" required />
            <label className="grid gap-2 text-sm font-medium text-slate-800" htmlFor="sourceFamilyMemberId">
              Person optional
              <select
                id="sourceFamilyMemberId"
                name="familyMemberId"
                defaultValue=""
                className="min-h-11 rounded-2xl border border-slate-200 bg-white px-4 text-base text-slate-950 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              >
                <option value="">Alle / Familie</option>
                {members.map((member) => (
                  <option key={member.id} value={member.id}>{member.name}</option>
                ))}
              </select>
            </label>
            <Button type="submit" className="w-full">Kalender verbinden & importieren</Button>
          </form>

          {sources.length > 0 ? (
            <div className="grid gap-2">
              {sources.map((source) => (
                <div key={source.id} className="rounded-2xl bg-slate-50 px-4 py-3 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-950">{source.name}</p>
                      <p className="mt-1 text-xs text-slate-500">{source.member?.name ?? "Familie"} · {source.lastSyncedAt ? `Sync: ${formatTime(source.lastSyncedAt)}` : "Noch nicht synchronisiert"}</p>
                    </div>
                    <form action={syncCalendarSourceAction.bind(null, source.id)}>
                      <Button type="submit" className="min-h-9 bg-slate-200 px-3 py-1 text-slate-950 hover:bg-slate-300">Sync</Button>
                    </form>
                  </div>
                  {source.lastSyncError ? <p className="mt-2 text-xs text-amber-700">{source.lastSyncError}</p> : null}
                </div>
              ))}
            </div>
          ) : (
            <p className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-500">Noch kein externer Kalender verbunden.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Termin eintragen</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createCalendarEventAction} className="space-y-4">
            {error ? <p className="rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-800">{error}</p> : null}
            <FormField label="Titel" name="title" placeholder="z. B. Fußballtraining" required />
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Datum" name="date" type="date" defaultValue={isoDate(new Date())} required />
              <FormField label="Uhrzeit" name="time" type="time" />
            </div>
            <label className="grid gap-2 text-sm font-medium text-slate-800" htmlFor="familyMemberId">
              Person optional
              <select
                id="familyMemberId"
                name="familyMemberId"
                defaultValue=""
                className="min-h-11 rounded-2xl border border-slate-200 bg-white px-4 text-base text-slate-950 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              >
                <option value="">Alle / Familie</option>
                {members.map((member) => (
                  <option key={member.id} value={member.id}>{member.name}</option>
                ))}
              </select>
            </label>
            <label className="grid gap-2 text-sm font-medium text-slate-800" htmlFor="description">
              Notiz optional
              <textarea
                id="description"
                name="description"
                rows={3}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-950 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                placeholder="Ort, Material, Erinnerung ..."
              />
            </label>
            <Button type="submit" className="w-full">Termin speichern</Button>
          </form>
        </CardContent>
      </Card>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-lg font-semibold text-slate-950">Wochenübersicht</h3>
          <Link href="/app" className="text-sm font-semibold text-emerald-700">Start</Link>
        </div>
        <div className="grid gap-3">
          {days.map((day) => (
            <article key={day.key} className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <h4 className="font-semibold text-slate-950">{day.label}</h4>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">{day.events.length}</span>
              </div>
              {day.events.length > 0 ? (
                <div className="mt-3 grid gap-2">
                  {day.events.map((event) => (
                    <div
                      id={`event-${event.id}`}
                      key={event.id}
                      className={`scroll-mt-4 rounded-2xl bg-slate-50 px-4 py-3 text-sm ${params.event === event.id ? "ring-2 ring-emerald-400" : ""}`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-semibold text-slate-950">{event.title}</p>
                        <span className="text-xs font-semibold text-emerald-700">{formatTime(event.startsAt)}</span>
                      </div>
                      <p className="mt-1 text-xs text-slate-500">{event.member?.name ?? "Familie"}</p>
                      {event.description ? <p className="mt-2 text-sm text-slate-600">{event.description}</p> : null}
                      {event.planningEvent ? <Link href={`/app/planning/${event.planningEvent.id}`} className="mt-2 block text-xs font-semibold text-emerald-700">Zugehörige Planung öffnen →</Link> : null}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-3 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-500">Noch nichts geplant.</p>
              )}
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
