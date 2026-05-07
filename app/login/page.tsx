import Link from "next/link";
import { loginAction } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormField } from "@/components/ui/form-field";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const hasError = (await searchParams).error === "invalid";

  return (
    <main className="min-h-screen bg-slate-100 px-5 py-8">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-md flex-col justify-center">
        <Card>
          <CardHeader>
            <p className="text-sm font-medium text-emerald-600">FamilyOS</p>
            <CardTitle>Einloggen</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={loginAction} className="space-y-4">
              {hasError ? <p className="rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-800">E-Mail oder Passwort stimmt nicht.</p> : null}
              <FormField label="E-Mail" name="email" type="email" autoComplete="email" required />
              <FormField label="Passwort" name="password" type="password" autoComplete="current-password" required />
              <Button className="w-full" type="submit">Einloggen</Button>
            </form>
            <p className="mt-5 text-center text-sm text-slate-600">
              Noch kein Konto? <Link className="font-semibold text-slate-950" href="/register">Familie erstellen</Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
