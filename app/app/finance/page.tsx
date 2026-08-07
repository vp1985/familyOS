import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormField } from "@/components/ui/form-field";
import { Button } from "@/components/ui/button";
import {
  createFinanceAccountAction,
  createMoneyRuleAction,
  createMoneyTransactionAction,
  deactivateMoneyRuleAction,
  markMoneyOccurrenceStatusAction,
  reverseMoneyTransactionAction,
  updateChildCashAccountSettingsAction,
} from "@/app/app/finance/actions";
import {
  childCashAccountNameSuggestions,
  financeAccountKindLabel,
  formatCents,
  getChildFinanceOverview,
  moneyTransactionLabel,
} from "@/lib/finances";
import { getChildMoneyOverview, moneyOccurrenceStatusLabel, sumChildMoneyRules } from "@/lib/child-money";
import { sumChildLedger } from "@/lib/child-ledger";

function errorText(error?: string) {
  if (error === "invalid-amount") return "Bitte gib einen gültigen Betrag ein, z. B. 5 oder 5,50.";
  if (error === "invalid-member") return "Bitte wähle ein gültiges Kind aus.";
  if (error === "invalid-transaction") return "Bitte fülle alle Pflichtfelder aus.";
  if (error === "invalid-money-rule") return "Bitte fülle Kind, Titel und Betrag aus.";
  if (error === "invalid-money-status") return "Der Status konnte nicht gespeichert werden.";
  if (error === "invalid-account") return "Bitte wähle ein gültiges Konto aus.";
  if (error === "invalid-reversal") return "Diese Geldbewegung kann nicht storniert werden.";
  return null;
}

const statusOptions = [
  ["OPEN", "Offen"],
  ["PAID_CASH", "Bar"],
  ["TRANSFERRED", "Überwiesen"],
  ["SAVED", "Gespart"],
  ["SKIPPED", "Ausgelassen"],
] as const;

export default async function FinancePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const [{ accounts, children, transactions, totalBalanceCents }, moneyOverview, params] = await Promise.all([
    getChildFinanceOverview(),
    getChildMoneyOverview(),
    searchParams,
  ]);
  const error = errorText(params.error);
  const activeRules = moneyOverview.rules.filter((rule) => rule.active);

  return (
    <div className="space-y-5">
      <section className="rounded-3xl bg-emerald-600 p-5 text-white shadow-sm">
        <p className="text-sm text-emerald-50">Kinder-Finanzen</p>
        <h2 className="mt-2 text-3xl font-bold">{formatCents(totalBalanceCents)}</h2>
        <p className="mt-2 text-sm text-emerald-50">Gesamtguthaben aller Kinderprofile</p>
      </section>

      {error ? <p className="rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-800">{error}</p> : null}

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
                    <p className="truncate font-semibold text-slate-950">{account.member.name}: {account.name}</p>
                    <p className="text-sm text-slate-500">{financeAccountKindLabel(account.kind)}{account.isDefault ? " · Standard" : ""}{account.childManaged ? " · Kind" : ""}{account.childCanBook ? " · Kind darf buchen" : ""}</p>
                  </div>
                </div>
                <p className="shrink-0 text-lg font-bold text-slate-950">{formatCents(account.balanceCents)}</p>
              </CardContent>
            </Card>
          ))
        )}
      </section>

      <Card>
        <CardHeader><CardTitle>Konto anlegen</CardTitle></CardHeader>
        <CardContent>
          <form action={createFinanceAccountAction} className="space-y-4">
            <label className="grid gap-2 text-sm font-medium text-slate-800" htmlFor="account-familyMemberId">
              Kind
              <select id="account-familyMemberId" name="familyMemberId" className="min-h-11 rounded-2xl border border-slate-200 bg-white px-4 text-base text-slate-950 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100" required>
                <option value="">Bitte wählen</option>
                {moneyOverview.children.map((child) => <option key={child.id} value={child.id}>{child.name}</option>)}
              </select>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Kontoname" name="name" placeholder="Führerschein, Girokonto" list="account-name-suggestions" required />
              <FormField label="Anfangsbestand" name="openingBalance" inputMode="decimal" placeholder="0,00" />
            </div>
            <datalist id="account-name-suggestions">
              {childCashAccountNameSuggestions.map((suggestion) => <option key={suggestion} value={suggestion} />)}
            </datalist>
            <label className="grid gap-2 text-sm font-medium text-slate-800" htmlFor="kind">
              Kontoart
              <select id="kind" name="kind" className="min-h-11 rounded-2xl border border-slate-200 bg-white px-4 text-base text-slate-950 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100" defaultValue="CASH">
                <option value="CASH">Bargeld</option>
                <option value="GIRO">Girokonto</option>
                <option value="SAVINGS">Sparkonto</option>
                <option value="DAY_MONEY">Tagesgeld</option>
                <option value="HOME_SAVINGS">Sparen zu Hause</option>
                <option value="OTHER">Sonstiges</option>
              </select>
            </label>
            <label className="flex items-start gap-2 text-sm font-medium text-slate-700">
              <input type="checkbox" name="childCanBook" defaultChecked className="mt-1 h-4 w-4" />
              Kind darf dieses Konto im Haushaltsbuch bebuchen (nur Bargeld/Sparen zu Hause). Bankkonten bleiben Elternkonten.
            </label>
            <Button className="w-full" type="submit" disabled={moneyOverview.children.length === 0}>Konto speichern</Button>
          </form>
        </CardContent>
      </Card>


      <Card>
        <CardHeader><CardTitle>Kinder-Freigaben für Bargeld-Spardosen</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-slate-600">Kinder dürfen nur eigene Bargeld-Spardosen anlegen, wenn es hier freigegeben ist. Standard: maximal 5.</p>
          {children.map((child) => {
            const childManagedCashCount = child.financeAccounts.filter((account) => account.kind === "CASH" && account.childManaged).length;
            return (
              <form key={child.id} action={updateChildCashAccountSettingsAction} className="grid gap-3 rounded-2xl bg-slate-50 p-3">
                <input type="hidden" name="childId" value={child.id} />
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-bold text-slate-950">{child.name}</p>
                    <p className="text-xs font-semibold text-slate-500">{childManagedCashCount} von {child.childCashAccountLimit} Kinder-Spardosen genutzt</p>
                  </div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                    <input type="checkbox" name="childCanCreateCashAccounts" defaultChecked={child.childCanCreateCashAccounts} className="h-4 w-4" />
                    freigeben
                  </label>
                </div>
                <label className="grid gap-2 text-sm font-medium text-slate-800" htmlFor={`cash-limit-${child.id}`}>
                  Limit
                  <input id={`cash-limit-${child.id}`} name="childCashAccountLimit" type="number" min="0" max="10" defaultValue={child.childCashAccountLimit} className="min-h-11 rounded-2xl border border-slate-200 bg-white px-4 text-base text-slate-950 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100" />
                </label>
                <Button type="submit" className="min-h-10 px-3 text-sm">Freigabe speichern</Button>
              </form>
            );
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Monatliches Geld zusammenstellen</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createMoneyRuleAction} className="space-y-4">
            <label className="grid gap-2 text-sm font-medium text-slate-800" htmlFor="childId">
              Kind
              <select id="childId" name="childId" className="min-h-11 rounded-2xl border border-slate-200 bg-white px-4 text-base text-slate-950 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100" required>
                <option value="">Bitte wählen</option>
                {moneyOverview.children.map((child) => <option key={child.id} value={child.id}>{child.name}</option>)}
              </select>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Baustein" name="title" placeholder="Essen gehen" required />
              <FormField label="Betrag" name="amount" inputMode="decimal" placeholder="10,00" required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <label className="grid gap-2 text-sm font-medium text-slate-800" htmlFor="direction">
                Art
                <select id="direction" name="direction" className="min-h-11 rounded-2xl border border-slate-200 bg-white px-4 text-base text-slate-950 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100" defaultValue="INCOME">
                  <option value="INCOME">Einnahme</option>
                  <option value="EXPENSE">Ausgabe/Abzug</option>
                </select>
              </label>
              <FormField label="Ziel-Text" name="destinationLabel" placeholder="bar, Bank, Sparkonto" />
            </div>
            <label className="grid gap-2 text-sm font-medium text-slate-800" htmlFor="rule-financeAccountId">
              Zielkonto
              <select id="rule-financeAccountId" name="financeAccountId" className="min-h-11 rounded-2xl border border-slate-200 bg-white px-4 text-base text-slate-950 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100">
                <option value="">Nur abhaken, nicht buchen</option>
                {accounts.map((account) => <option key={account.id} value={account.id}>{account.member.name}: {account.name}</option>)}
              </select>
            </label>
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
              <input type="checkbox" name="autoConfirm" className="h-4 w-4" />
              Automatisch verbuchen / Dauerauftrag
            </label>
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
              <input type="checkbox" name="visibleToChild" defaultChecked className="h-4 w-4" />
              Für Kind sichtbar
            </label>
            <Button className="w-full" type="submit" disabled={moneyOverview.children.length === 0}>Baustein speichern</Button>
          </form>
        </CardContent>
      </Card>

      <section className="space-y-3">
        <h3 className="text-lg font-semibold text-slate-950">Taschengeld-Bausteine</h3>
        {activeRules.length === 0 ? (
          <Card><CardContent className="text-sm text-slate-600">Noch keine monatlichen Bausteine angelegt.</CardContent></Card>
        ) : (
          <div className="grid gap-3">
            {moneyOverview.children.map((child) => {
              const childRules = activeRules.filter((rule) => rule.childId === child.id);
              if (childRules.length === 0) return null;
              return (
                <Card key={child.id}>
                  <CardHeader><CardTitle>{child.name}: {formatCents(sumChildMoneyRules(childRules))}</CardTitle></CardHeader>
                  <CardContent className="space-y-3">
                    {childRules.map((rule) => (
                      <div key={rule.id} className="flex items-center justify-between gap-3 rounded-2xl bg-slate-50 p-3">
                        <div>
                          <p className="font-semibold text-slate-950">{rule.title} · {formatCents(rule.direction === "EXPENSE" ? -rule.amountCents : rule.amountCents)}</p>
                          <p className="text-sm text-slate-500">{rule.account?.name || rule.destinationLabel || "kein Ziel"} · {rule.autoConfirm ? "automatisch" : "abhaken"} · {rule.visibleToChild ? "sichtbar" : "versteckt"}</p>
                        </div>
                        <form action={deactivateMoneyRuleAction}>
                          <input type="hidden" name="ruleId" value={rule.id} />
                          <Button type="submit" className="min-h-10 px-3 text-sm">Aus</Button>
                        </form>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h3 className="text-lg font-semibold text-slate-950">Aktueller Monat {moneyOverview.dueMonth}</h3>
        <div className="grid gap-3">
          {moneyOverview.occurrences.map((occurrence) => (
            <Card key={occurrence.id}>
              <CardContent className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-950">{occurrence.child.name}: {occurrence.titleSnapshot}</p>
                    <p className="text-sm text-slate-500">{formatCents(occurrence.rule.direction === "EXPENSE" ? -occurrence.amountCentsSnapshot : occurrence.amountCentsSnapshot)} · {occurrence.destinationSnapshot || "kein Ziel"} · {moneyOccurrenceStatusLabel(occurrence.status)}{occurrence.bookedTransaction ? " · gebucht" : ""}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {statusOptions.map(([status, label]) => (
                    <form action={markMoneyOccurrenceStatusAction} key={status}>
                      <input type="hidden" name="occurrenceId" value={occurrence.id} />
                      <input type="hidden" name="status" value={status} />
                      <Button type="submit" className="min-h-10 px-3 text-sm">{label}</Button>
                    </form>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <Card>
        <CardHeader><CardTitle>Geldbewegung eintragen</CardTitle></CardHeader>
        <CardContent>
          <form action={createMoneyTransactionAction} className="space-y-4">
            <label className="grid gap-2 text-sm font-medium text-slate-800" htmlFor="financeAccountId">
              Konto
              <select id="financeAccountId" name="financeAccountId" className="min-h-11 rounded-2xl border border-slate-200 bg-white px-4 text-base text-slate-950 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100" required>
                <option value="">Bitte wählen</option>
                {accounts.map((account) => <option key={account.id} value={account.id}>{account.member.name}: {account.name}</option>)}
              </select>
            </label>
            <label className="grid gap-2 text-sm font-medium text-slate-800" htmlFor="type">
              Art
              <select id="type" name="type" className="min-h-11 rounded-2xl border border-slate-200 bg-white px-4 text-base text-slate-950 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100" defaultValue="allowance">
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
        <h3 className="text-lg font-semibold text-slate-950">Sichtbares Haushaltsbuch der Kinder</h3>
        <div className="grid gap-3">
          {moneyOverview.children.map((child) => (
            <Card key={`ledger-${child.id}`}>
              <CardHeader><CardTitle>{child.name}: {formatCents(sumChildLedger(child.childLedgerEntries))}</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {child.childLedgerEntries.length === 0 ? (
                  <p className="text-sm text-slate-600">Keine für Eltern sichtbaren Einträge.</p>
                ) : child.childLedgerEntries.map((entry) => (
                  <div key={entry.id} className="rounded-2xl bg-slate-50 px-3 py-2">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-semibold text-slate-950">{entry.title}</p>
                      <p className="font-bold text-slate-950">{formatCents(entry.direction === "EXPENSE" ? -entry.amountCents : entry.amountCents)}</p>
                    </div>
                    <p className="text-sm text-slate-500">{entry.account?.name || entry.categoryLabel || "ohne Kategorie"}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="text-lg font-semibold text-slate-950">Verlauf</h3>
        {transactions.length === 0 ? (
          <Card><CardContent className="text-sm text-slate-600">Noch keine Geldbewegungen eingetragen.</CardContent></Card>
        ) : (
          <div className="grid gap-3">
            {transactions.map((transaction) => (
              <Card key={transaction.id}>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold text-slate-950">{transaction.title}</p>
                    <p className="font-bold text-slate-950">{formatCents(transaction.amountCents)}</p>
                  </div>
                  <p className="text-sm text-slate-500">
                    {transaction.member.name}{transaction.account ? ` · ${transaction.account.name}` : ""} · {moneyTransactionLabel(transaction.type)} · Saldo {formatCents(transaction.balanceAfterCents)}
                  </p>
                  {transaction.reversalTransaction ? (
                    <p className="rounded-xl bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-600">Storniert</p>
                  ) : transaction.type !== "reversal" && transaction.bookedOccurrences.length === 0 ? (
                    <form action={reverseMoneyTransactionAction}>
                      <input type="hidden" name="transactionId" value={transaction.id} />
                      <Button type="submit" className="min-h-10 bg-transparent px-3 text-sm text-slate-700 shadow-none ring-1 ring-slate-200 hover:bg-slate-100">Stornieren</Button>
                    </form>
                  ) : transaction.type !== "reversal" ? (
                    <p className="text-xs font-semibold text-slate-500">Automatisch gebuchte Monatspositionen sind von dieser Storno-Funktion ausgenommen.</p>
                  ) : null}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
