import Link from "next/link";
import { createCalendarEventAction } from "@/app/app/calendar/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormField } from "@/components/ui/form-field";
import { formatTime, getCalendarPageData } from "@/lib/calendar";

function errorText(error?: string) {
  if (error === "invalid-event") return "Bitte gib Titel und Datum korrekt an.";
  if (error === "invalid-member") return "Bitte wähle nur Personen aus deiner Familie.";
  return null;
}

function isoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const [{ members, week, days }, params] = await Promise.all([getCalendarPageData(), searchParams]);
  const error = errorText(params.error);

  return (
    <div className="space-y-5">
      <section className="rounded-[2rem] bg-gradient-to-br from-indigo-950 via-slate-900 to-emerald-950 p-5 text-white shadow-sm">
        <p className="text-sm text-indigo-200">Wochenplan</p>
        <h2 className="mt-2 text-2xl font-bold">Diese Woche</h2>
        <p className="mt-3 text-sm leading-6 text-slate-300">
          {isoDate(week.start)} bis {isoDate(new Date(week.end.getTime() - 1))}: Termine, Aufgaben und Familienpunkte an einem Ort.
        </p>
      </section>

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
                    <div key={event.id} className="rounded-2xl bg-slate-50 px-4 py-3 text-sm">
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-semibold text-slate-950">{event.title}</p>
                        <span className="text-xs font-semibold text-emerald-700">{formatTime(event.startsAt)}</span>
                      </div>
                      <p className="mt-1 text-xs text-slate-500">{event.member?.name ?? "Familie"}</p>
                      {event.description ? <p className="mt-2 text-sm text-slate-600">{event.description}</p> : null}
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
