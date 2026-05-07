import Link from "next/link";
import { registerAction } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormField } from "@/components/ui/form-field";

function errorText(error?: string) {
  if (error === "email-exists") return "Diese E-Mail ist bereits registriert.";
  if (error === "invalid") return "Bitte fülle alle Felder korrekt aus. Das Passwort braucht mindestens 8 Zeichen.";
  return null;
}

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const error = errorText((await searchParams).error);

  return (
    <main className="min-h-screen bg-slate-100 px-5 py-8">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-md flex-col justify-center">
        <Card>
          <CardHeader>
            <p className="text-sm font-medium text-emerald-600">FamilyOS</p>
            <CardTitle>Familie erstellen</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={registerAction} className="space-y-4">
              {error ? <p className="rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-800">{error}</p> : null}
              <FormField label="Dein Name" name="name" autoComplete="name" required />
              <FormField label="E-Mail" name="email" type="email" autoComplete="email" required />
              <FormField label="Passwort" name="password" type="password" autoComplete="new-password" minLength={8} required />
              <FormField label="Familienname" name="familyName" placeholder="Familie Mustermann" required />
              <Button className="w-full" type="submit">Familie starten</Button>
            </form>
            <p className="mt-5 text-center text-sm text-slate-600">
              Schon registriert? <Link className="font-semibold text-slate-950" href="/login">Einloggen</Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
