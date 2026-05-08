import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormField } from "@/components/ui/form-field";
import { Button } from "@/components/ui/button";
import { createFamilyMemberAction, getFamilyMembers } from "@/lib/family-members";

function roleLabel(role: string) {
  if (role === "child") return "Kind";
  if (role === "parent") return "Elternteil";
  return "Weitere Person";
}

export default async function FamilyPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const [{ context, members }, params] = await Promise.all([getFamilyMembers(), searchParams]);
  const hasError = params.error === "invalid-member";

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm font-medium text-emerald-600">{context.family.name}</p>
        <h2 className="text-2xl font-bold text-slate-950">Familie</h2>
        <p className="mt-1 text-sm text-slate-600">Kinder und Familienprofile für spätere Finanzen, Projekte und Regeln.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profil hinzufügen</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createFamilyMemberAction} className="space-y-4">
            {hasError ? <p className="rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-800">Bitte gib mindestens einen Namen mit 2 Zeichen an.</p> : null}
            <FormField label="Name" name="name" placeholder="z. B. Mika" required />
            <label className="grid gap-2 text-sm font-medium text-slate-800" htmlFor="role">
              Rolle
              <select
                id="role"
                name="role"
                className="min-h-11 rounded-2xl border border-slate-200 bg-white px-4 text-base text-slate-950 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                defaultValue="child"
              >
                <option value="child">Kind</option>
                <option value="parent">Elternteil</option>
                <option value="other">Weitere Person</option>
              </select>
            </label>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <FormField label="Icon" name="icon" placeholder="🧒" maxLength={4} />
              <FormField label="Farbe" name="color" placeholder="emerald" />
            </div>
            <Button className="w-full" type="submit">Profil speichern</Button>
          </form>
        </CardContent>
      </Card>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-lg font-semibold text-slate-950">Profile</h3>
          <span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold text-slate-700">{members.length}</span>
        </div>

        {members.length === 0 ? (
          <Card>
            <CardContent className="text-sm text-slate-600">
              Noch keine Familienprofile. Lege zuerst die Kinder an, die später Guthaben, Ausgaben und Aufgaben bekommen.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3">
            {members.map((member) => (
              <Card key={member.id}>
                <CardContent className="flex items-center gap-3">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-2xl" aria-hidden="true">
                    {member.icon ?? "👤"}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-slate-950">{member.name}</p>
                    <p className="text-sm text-slate-500">{roleLabel(member.role)}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
