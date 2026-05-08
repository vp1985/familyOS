import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormField } from "@/components/ui/form-field";
import { createProjectAction } from "@/app/app/projects/actions";
import { getProjectFormData } from "@/lib/projects";

function errorText(error?: string) {
  if (error === "invalid-participants") return "Bitte wähle nur Mitglieder aus deiner Familie.";
  if (error === "invalid-project") return "Bitte gib einen Titel ein und wähle mindestens eine Person.";
  return null;
}

export default async function NewProjectPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const [{ members }, params] = await Promise.all([getProjectFormData(), searchParams]);
  const error = errorText(params.error);

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm font-medium text-emerald-600">Neues Projekt</p>
        <h2 className="text-2xl font-bold text-slate-950">Projekt anlegen</h2>
        <p className="mt-1 text-sm text-slate-600">Wähle direkt aus, wer an den Ausgaben beteiligt sein kann.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Projekt</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createProjectAction} className="space-y-4">
            {error ? <p className="rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-800">{error}</p> : null}
            <FormField label="Titel" name="title" placeholder="z. B. Freizeitpark" required />
            <label className="grid gap-2 text-sm font-medium text-slate-800" htmlFor="description">
              Beschreibung optional
              <textarea
                id="description"
                name="description"
                rows={3}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-950 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                placeholder="Worum geht es?"
              />
            </label>

            <fieldset className="space-y-2">
              <legend className="text-sm font-semibold text-slate-800">Beteiligte</legend>
              {members.length === 0 ? (
                <p className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">Lege zuerst unter Familie Profile an.</p>
              ) : (
                <div className="grid gap-2">
                  {members.map((member) => (
                    <label key={member.id} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-800">
                      <input name="participantIds" value={member.id} type="checkbox" className="h-5 w-5 rounded border-slate-300 text-emerald-600" />
                      <span className="text-xl" aria-hidden="true">{member.icon ?? "👤"}</span>
                      <span>{member.name}</span>
                    </label>
                  ))}
                </div>
              )}
            </fieldset>

            <div className="grid grid-cols-2 gap-3">
              <Button asChild className="bg-white text-slate-800 ring-1 ring-slate-200 hover:bg-slate-50">
                <Link href="/app/projects">Abbrechen</Link>
              </Button>
              <Button type="submit" disabled={members.length === 0}>Speichern</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
