import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormField } from "@/components/ui/form-field";
import { Button } from "@/components/ui/button";
import { createMoneyTransactionAction } from "@/app/app/finance/actions";
import {
  formatCents,
  getChildFinanceOverview,
  moneyTransactionLabel,
} from "@/lib/finances";

function errorText(error?: string) {
  if (error === "invalid-amount") return "Bitte gib einen gültigen Betrag ein, z. B. 5 oder 5,50.";
  if (error === "invalid-member") return "Bitte wähle ein gültiges Kind aus.";
  if (error === "invalid-transaction") return "Bitte fülle alle Pflichtfelder aus.";
  return null;
}

export default async function FinancePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const [{ accounts, transactions, totalBalanceCents }, params] = await Promise.all([
    getChildFinanceOverview(),
    searchParams,
  ]);
  const error = errorText(params.error);

  return (
    <div className="space-y-5">
      <section className="rounded-3xl bg-emerald-600 p-5 text-white shadow-sm">
        <p className="text-sm text-emerald-50">Kinder-Finanzen</p>
        <h2 className="mt-2 text-3xl font-bold">{formatCents(totalBalanceCents)}</h2>
        <p className="mt-2 text-sm text-emerald-50">Gesamtguthaben aller Kinderprofile</p>
      </section>

      <section className="grid gap-3">
        {accounts.length === 0 ? (
          <Card>
            <CardContent className="text-sm text-slate-600">
              Lege zuerst unter Familie ein Kinderprofil an. Danach erscheint hier das Kinderkonto.
            </CardContent>
          </Card>
        ) : (
          accounts.map((account) => (
            <Card key={account.id}>
              <CardContent className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-2xl" aria-hidden="true">
                    {account.member.icon ?? "🧒"}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-slate-950">{account.member.name}</p>
                    <p className="text-sm text-slate-500">Kinderkonto</p>
                  </div>
                </div>
                <p className="shrink-0 text-lg font-bold text-slate-950">{formatCents(account.balanceCents)}</p>
              </CardContent>
            </Card>
          ))
        )}
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Geldbewegung eintragen</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createMoneyTransactionAction} className="space-y-4">
            {error ? <p className="rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-800">{error}</p> : null}
            <label className="grid gap-2 text-sm font-medium text-slate-800" htmlFor="familyMemberId">
              Kind
              <select
                id="familyMemberId"
                name="familyMemberId"
                className="min-h-11 rounded-2xl border border-slate-200 bg-white px-4 text-base text-slate-950 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                required
              >
                <option value="">Bitte wählen</option>
                {accounts.map((account) => (
                  <option key={account.familyMemberId} value={account.familyMemberId}>{account.member.name}</option>
                ))}
              </select>
            </label>
            <label className="grid gap-2 text-sm font-medium text-slate-800" htmlFor="type">
              Art
              <select
                id="type"
                name="type"
                className="min-h-11 rounded-2xl border border-slate-200 bg-white px-4 text-base text-slate-950 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                defaultValue="allowance"
              >
                <option value="allowance">Taschengeld / Plus</option>
                <option value="loan">Leihe / Ausgabe</option>
                <option value="repayment">Rückzahlung</option>
                <option value="adjustment">Korrektur auf Betrag</option>
              </select>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Betrag" name="amount" inputMode="decimal" placeholder="5,00" required />
              <FormField label="Titel" name="title" placeholder="Taschengeld" />
            </div>
            <Button className="w-full" type="submit" disabled={accounts.length === 0}>Speichern</Button>
          </form>
        </CardContent>
      </Card>

      <section className="space-y-3">
        <h3 className="text-lg font-semibold text-slate-950">Verlauf</h3>
        {transactions.length === 0 ? (
          <Card>
            <CardContent className="text-sm text-slate-600">Noch keine Geldbewegungen eingetragen.</CardContent>
          </Card>
        ) : (
          <div className="grid gap-3">
            {transactions.map((transaction) => (
              <Card key={transaction.id}>
                <CardContent className="space-y-1">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold text-slate-950">{transaction.title}</p>
                    <p className="font-bold text-slate-950">{formatCents(transaction.amountCents)}</p>
                  </div>
                  <p className="text-sm text-slate-500">
                    {transaction.member.name} · {moneyTransactionLabel(transaction.type)} · Saldo {formatCents(transaction.balanceAfterCents)}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
