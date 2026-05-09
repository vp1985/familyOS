import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { FormField } from "@/components/ui/form-field";
import {
  MEDIA_RESTRICTION_TYPE_OPTIONS,
  MEDIA_TYPE_OPTIONS,
  isMediaRestrictionExpired,
  mediaRestrictionStatusLabel,
  mediaRestrictionTypeLabel,
  mediaTypeLabel,
  getMediaPageData,
} from "@/lib/media-time";
import {
  cancelMediaRestrictionAction,
  createMediaAllowanceRuleAction,
  createMediaRestrictionAction,
  deactivateMediaAllowanceRuleAction,
  releaseMediaRestrictionAction,
} from "./actions";

function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat("de-DE", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

function ruleLabel(rule: { minutesPerDay: number | null; minutesPerWeek: number | null }) {
  const parts = [];
  if (rule.minutesPerDay !== null) parts.push(`${rule.minutesPerDay} Min./Tag`);
  if (rule.minutesPerWeek !== null) parts.push(`${rule.minutesPerWeek} Min./Woche`);
  return parts.length > 0 ? parts.join(" · ") : "ohne Minutenlimit";
}

export default async function MediaPage() {
  const { children, rules, restrictions, ruleEvents } = await getMediaPageData();
  const now = new Date();
  const openRestrictions = restrictions.filter((restriction) => restriction.status === "ACTIVE");
  const expiredRestrictions = openRestrictions.filter((restriction) => isMediaRestrictionExpired(restriction, now));

  return (
    <div className="space-y-5">
      <section className="rounded-[2rem] bg-gradient-to-br from-indigo-500 via-sky-500 to-emerald-400 p-5 text-white shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wide text-white/80">Medienzeiten</p>
        <h2 className="mt-2 text-3xl font-black">Handy, Zocken, Gucken</h2>
        <p className="mt-3 text-sm leading-6 text-white/90">
          Verwaltet Grundzeiten, App-Pausen und erinnert euch daran, wenn wieder freigeschaltet werden muss.
        </p>
      </section>

      {expiredRestrictions.length > 0 ? (
        <section className="rounded-3xl bg-amber-50 p-4 text-amber-950">
          <p className="text-sm font-black">Freischaltung prüfen</p>
          <div className="mt-2 grid gap-2">
            {expiredRestrictions.map((restriction) => (
              <div key={restriction.id} className="rounded-2xl bg-white px-3 py-2 text-sm">
                {restriction.child.name}: {restriction.appOrDeviceLabel || mediaTypeLabel(restriction.mediaType)} war bis {formatDateTime(restriction.endsAt)} pausiert.
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section className="grid gap-3 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Grundzeit anlegen</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={createMediaAllowanceRuleAction} className="space-y-3">
              <label className="grid gap-2 text-sm font-medium text-slate-800" htmlFor="rule-child">
                Kind optional
                <select id="rule-child" name="childId" className="min-h-11 rounded-2xl border border-slate-200 bg-white px-3 text-base text-slate-950" defaultValue="">
                  <option value="">Altersregel für alle Kinder</option>
                  {children.map((child) => <option key={child.id} value={child.id}>{child.name}</option>)}
                </select>
              </label>
              <label className="grid gap-2 text-sm font-medium text-slate-800" htmlFor="rule-media-type">
                Medienart
                <select id="rule-media-type" name="mediaType" className="min-h-11 rounded-2xl border border-slate-200 bg-white px-3 text-base text-slate-950" defaultValue="PHONE">
                  {MEDIA_TYPE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              </label>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                <FormField label="ab Alter" name="minAgeYears" inputMode="numeric" placeholder="8" />
                <FormField label="Min./Tag" name="minutesPerDay" inputMode="numeric" placeholder="30" />
                <FormField label="Min./Woche" name="minutesPerWeek" inputMode="numeric" placeholder="180" />
              </div>
              <FormField label="Notiz" name="note" placeholder="z. B. nur nach Hausaufgaben" />
              <Button type="submit" className="min-h-11 w-full rounded-2xl font-black">Regel speichern</Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>App-Pause / Einschränkung</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={createMediaRestrictionAction} className="space-y-3">
              <label className="grid gap-2 text-sm font-medium text-slate-800" htmlFor="restriction-child">
                Kind
                <select id="restriction-child" name="childId" required className="min-h-11 rounded-2xl border border-slate-200 bg-white px-3 text-base text-slate-950" defaultValue="">
                  <option value="" disabled>Kind wählen</option>
                  {children.map((child) => <option key={child.id} value={child.id}>{child.name}</option>)}
                </select>
              </label>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <label className="grid gap-2 text-sm font-medium text-slate-800" htmlFor="restriction-media-type">
                  Medienart
                  <select id="restriction-media-type" name="mediaType" className="min-h-11 rounded-2xl border border-slate-200 bg-white px-3 text-base text-slate-950" defaultValue="APP">
                    {MEDIA_TYPE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                  </select>
                </label>
                <label className="grid gap-2 text-sm font-medium text-slate-800" htmlFor="restriction-type">
                  Art
                  <select id="restriction-type" name="restrictionType" className="min-h-11 rounded-2xl border border-slate-200 bg-white px-3 text-base text-slate-950" defaultValue="BLOCKED">
                    {MEDIA_RESTRICTION_TYPE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                  </select>
                </label>
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <FormField label="App/Gerät" name="appOrDeviceLabel" placeholder="YouTube, Roblox, Switch" />
                <FormField label="reduziert auf Min." name="reducedMinutes" inputMode="numeric" placeholder="15" />
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <FormField label="Start" name="startsAt" type="datetime-local" required />
                <FormField label="Ende" name="endsAt" type="datetime-local" required />
              </div>
              <FormField label="Erinnern ab" name="remindAt" type="datetime-local" />
              <label className="grid gap-2 text-sm font-medium text-slate-800" htmlFor="rule-event">
                Regelverstoß optional
                <select id="rule-event" name="ruleEventId" className="min-h-11 rounded-2xl border border-slate-200 bg-white px-3 text-base text-slate-950" defaultValue="">
                  <option value="">kein Bezug</option>
                  {ruleEvents.map((event) => <option key={event.id} value={event.id}>{event.member.name}: {event.rule.title}</option>)}
                </select>
              </label>
              <FormField label="Grund/Notiz" name="reasonNote" placeholder="freundlich und kurz" />
              <Button type="submit" className="min-h-11 w-full rounded-2xl font-black">Einschränkung speichern</Button>
            </form>
          </CardContent>
        </Card>
      </section>

      <section className="space-y-3">
        <h3 className="text-xl font-black text-slate-950">Aktive und geplante Einschränkungen</h3>
        {restrictions.length === 0 ? (
          <EmptyState title="Keine Medienpausen" description="Wenn etwas pausiert oder reduziert wird, erscheint es hier." />
        ) : (
          <div className="grid gap-3">
            {restrictions.map((restriction) => {
              const releaseAction = releaseMediaRestrictionAction.bind(null, restriction.id);
              const cancelAction = cancelMediaRestrictionAction.bind(null, restriction.id);
              const effectiveStatus = isMediaRestrictionExpired(restriction, now) ? "ENDED" : restriction.status;
              return (
                <Card key={restriction.id} className={restriction.status === "ACTIVE" ? undefined : "bg-slate-50 opacity-80"}>
                  <CardHeader>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <CardTitle>{restriction.child.name}: {restriction.appOrDeviceLabel || mediaTypeLabel(restriction.mediaType)}</CardTitle>
                        <p className="mt-1 text-sm text-slate-600">{mediaTypeLabel(restriction.mediaType)} · {mediaRestrictionTypeLabel(restriction.restrictionType)}</p>
                      </div>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">{mediaRestrictionStatusLabel(effectiveStatus)}</span>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm text-slate-600">
                    <p>Von {formatDateTime(restriction.startsAt)} bis {formatDateTime(restriction.endsAt)}</p>
                    {restriction.reducedMinutes !== null ? <p>Reduziert auf {restriction.reducedMinutes} Minuten.</p> : null}
                    {restriction.reasonNote ? <p className="rounded-2xl bg-slate-50 px-3 py-2">{restriction.reasonNote}</p> : null}
                    {restriction.ruleEvent ? <p className="rounded-2xl bg-amber-50 px-3 py-2 text-amber-900">Bezug: {restriction.ruleEvent.rule.title} · {restriction.ruleEvent.note}</p> : null}
                    {restriction.status === "ACTIVE" ? (
                      <div className="grid grid-cols-2 gap-2">
                        <form action={releaseAction}><Button type="submit" className="min-h-10 w-full px-3 text-xs">Freischalten</Button></form>
                        <form action={cancelAction}><Button type="submit" className="min-h-10 w-full bg-white px-3 text-xs text-slate-800 ring-1 ring-slate-200 hover:bg-slate-50">Aufheben</Button></form>
                      </div>
                    ) : null}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h3 className="text-xl font-black text-slate-950">Grundregeln</h3>
        {rules.length === 0 ? (
          <p className="rounded-3xl bg-white p-4 text-sm text-slate-600 shadow-sm">Noch keine Medienzeit-Regeln.</p>
        ) : (
          <div className="grid gap-2">
            {rules.map((rule) => {
              const deactivateAction = deactivateMediaAllowanceRuleAction.bind(null, rule.id);
              return (
                <div key={rule.id} className="flex items-center justify-between gap-3 rounded-3xl bg-white p-4 shadow-sm">
                  <div>
                    <p className="font-black text-slate-950">{mediaTypeLabel(rule.mediaType)} · {ruleLabel(rule)}</p>
                    <p className="text-sm text-slate-600">{rule.child ? `nur ${rule.child.name}` : rule.minAgeYears !== null ? `ab ${rule.minAgeYears} Jahren` : "für alle Kinder"}{rule.note ? ` · ${rule.note}` : ""}</p>
                  </div>
                  {rule.active ? <form action={deactivateAction}><Button type="submit" className="min-h-10 px-3 text-xs">Aus</Button></form> : <span className="text-xs font-semibold text-slate-400">inaktiv</span>}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
