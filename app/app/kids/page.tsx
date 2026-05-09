import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { getKidsTaskData } from "@/lib/dashboard";
import { formatCents } from "@/lib/finances";
import { getKidsMoneyData, moneyOccurrenceStatusLabel, sumChildMoneyRules } from "@/lib/child-money";
import { sumChildLedger } from "@/lib/child-ledger";
import { getKidsMediaData, mediaRestrictionStatusLabel, mediaTypeLabel } from "@/lib/media-time";
import { checklistProgressLabel, getKidsChecklistData } from "@/lib/checklists";
import { createChildLedgerEntryAction, deleteChildLedgerEntryAction, markKidsTaskDoneAction, toggleKidsChecklistItemAction } from "./actions";

export default async function KidsPage() {
  const [{ view }, moneyData, mediaData, checklistData] = await Promise.all([getKidsTaskData(), getKidsMoneyData(), getKidsMediaData(), getKidsChecklistData()]);

  return (
    <div className="space-y-5">
      <section className="rounded-[2rem] bg-gradient-to-br from-sky-500 via-emerald-500 to-lime-400 p-5 text-white shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wide text-white/80">Kinder-Modus</p>
        <h2 className="mt-2 text-3xl font-black">Meine Aufgaben heute</h2>
        <p className="mt-3 text-sm leading-6 text-white/90">
          Such deinen Namen aus, mach deine Karte fertig und tippe danach auf „Ich hab’s gemacht“.
        </p>
      </section>

      {view.children.length === 0 ? (
        <section className="rounded-3xl bg-white p-5 text-center shadow-sm">
          <p className="text-4xl" aria-hidden="true">👋</p>
          <h3 className="mt-2 text-xl font-bold text-slate-950">Noch keine Kinderprofile</h3>
          <p className="mt-2 text-sm text-slate-600">Ein Elternteil kann zuerst ein Profil anlegen.</p>
          <Button asChild className="mt-4 min-h-11 px-4">
            <Link href="/app/family">Profile öffnen</Link>
          </Button>
        </section>
      ) : null}

      <div className="space-y-4">
        {view.children.map((child) => {
          const moneyChild = moneyData.children.find((entry) => entry.id === child.id);
          const visibleRules = moneyChild?.moneyRules ?? [];
          const occurrences = moneyChild?.moneyOccurrences ?? [];
          const ledgerEntries = moneyChild?.childLedgerEntries ?? [];
          const financeAccounts = moneyChild?.financeAccounts ?? [];
          const mediaSummary = mediaData.summaries.find((entry) => entry.childId === child.id);
          const checklists = checklistData.instances.filter((entry) => entry.assignedFamilyMemberId === child.id || entry.taskOccurrence?.familyMemberId === child.id);
          return (
          <section key={child.id} className="space-y-3 rounded-3xl bg-white p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-2xl" aria-hidden="true">
                {child.icon ?? "⭐"}
              </span>
              <div>
                <h3 className="text-xl font-black text-slate-950">{child.name}</h3>
                <p className="text-sm text-slate-500">{child.tasks.length === 0 ? "Alles frei" : `${child.tasks.length} Aufgabe(n)`}</p>
              </div>
            </div>

            <div className="rounded-3xl bg-indigo-50 p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-indigo-700">Meine Medienzeit</p>
              {mediaSummary && mediaSummary.rules.length > 0 ? (
                <div className="mt-2 grid gap-2">
                  {mediaSummary.rules.map((rule) => (
                    <div key={rule.id} className="rounded-2xl bg-white px-3 py-2">
                      <p className="font-bold text-slate-950">{mediaTypeLabel(rule.mediaType)}</p>
                      <p className="text-xs font-semibold text-slate-500">
                        {rule.minutesPerDay !== null ? `${rule.minutesPerDay} Min./Tag` : ""}{rule.minutesPerDay !== null && rule.minutesPerWeek !== null ? " · " : ""}{rule.minutesPerWeek !== null ? `${rule.minutesPerWeek} Min./Woche` : ""}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-2 text-sm text-slate-600">Noch keine Medienzeit eingestellt.</p>
              )}
              {mediaSummary && (mediaSummary.activeRestrictions.length > 0 || mediaSummary.expiredRestrictions.length > 0) ? (
                <div className="mt-3 grid gap-2">
                  {[...mediaSummary.activeRestrictions, ...mediaSummary.expiredRestrictions].map((restriction) => (
                    <div key={restriction.id} className="rounded-2xl bg-white px-3 py-2">
                      <p className="font-bold text-slate-950">{mediaTypeLabel(restriction.mediaType)}</p>
                      <p className="text-xs font-semibold text-slate-500">{mediaRestrictionStatusLabel(mediaSummary.expiredRestrictions.some((entry) => entry.id === restriction.id) ? "ENDED" : restriction.status)} · wieder frei ab {new Intl.DateTimeFormat("de-DE", { dateStyle: "short", timeStyle: "short" }).format(restriction.endsAt)}</p>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="rounded-3xl bg-teal-50 p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-teal-700">Meine Checklisten</p>
              {checklists.length === 0 ? (
                <p className="mt-2 text-sm text-slate-600">Keine aktive Liste.</p>
              ) : (
                <div className="mt-3 grid gap-3">
                  {checklists.map((list) => (
                    <div key={list.id} className="rounded-2xl bg-white p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-black text-slate-950">{list.titleSnapshot}</p>
                          <p className="text-xs font-semibold text-slate-500">{checklistProgressLabel(list.items)}</p>
                        </div>
                        <span className="rounded-full bg-teal-100 px-2 py-1 text-xs font-bold text-teal-800">🎒</span>
                      </div>
                      <div className="mt-2 grid gap-2">
                        {list.items.map((item) => (
                          <form key={item.id} action={toggleKidsChecklistItemAction} className="flex items-center justify-between gap-2 rounded-2xl bg-slate-50 px-3 py-2">
                            <input type="hidden" name="itemId" value={item.id} />
                            <input type="hidden" name="checked" value={item.checked ? "false" : "true"} />
                            <span className={item.checked ? "text-sm font-bold text-slate-400 line-through" : "text-sm font-bold text-slate-950"}>{item.titleSnapshot}{item.quantityLabelSnapshot ? ` · ${item.quantityLabelSnapshot}` : ""}</span>
                            <Button type="submit" className="min-h-9 px-3 text-xs">{item.checked ? "↩" : "✓"}</Button>
                          </form>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-3xl bg-emerald-50 p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">Mein Geld diesen Monat</p>
              <p className="mt-1 text-2xl font-black text-slate-950">{formatCents(sumChildMoneyRules(visibleRules))}</p>
              {financeAccounts.length > 0 ? (
                <div className="mt-3 grid gap-2">
                  {financeAccounts.map((account) => (
                    <div key={account.id} className="flex items-center justify-between gap-2 rounded-2xl bg-white px-3 py-2">
                      <p className="font-bold text-slate-950">{account.name}</p>
                      <p className="font-black text-slate-950">{formatCents(account.balanceCents)}</p>
                    </div>
                  ))}
                </div>
              ) : null}
              {occurrences.length === 0 ? (
                <p className="mt-2 text-sm text-slate-600">Noch keine Geld-Bausteine eingestellt.</p>
              ) : (
                <div className="mt-3 grid gap-2">
                  {occurrences.map((occurrence) => (
                    <div key={occurrence.id} className="rounded-2xl bg-white px-3 py-2">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-bold text-slate-950">{occurrence.titleSnapshot}</p>
                        <p className="font-black text-slate-950">{formatCents(occurrence.rule.direction === "EXPENSE" ? -occurrence.amountCentsSnapshot : occurrence.amountCentsSnapshot)}</p>
                      </div>
                      <p className="text-xs font-semibold text-slate-500">{occurrence.destinationSnapshot || "kein Ziel"} · {moneyOccurrenceStatusLabel(occurrence.status)}{occurrence.bookedTransaction ? " · gebucht" : ""}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {child.tasks.length === 0 ? (
              <p className="rounded-2xl bg-lime-50 px-4 py-4 text-sm font-semibold text-lime-800">Heute nichts offen. Stark! 🎉</p>
            ) : (
              <div className="grid gap-3">
                {child.tasks.map((task) => (
                  <article key={task.id} className="rounded-3xl border-2 border-emerald-100 bg-emerald-50 p-4">
                    <h4 className="text-lg font-black text-slate-950">{task.title}</h4>
                    {task.rewardLabels.length > 0 ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {task.rewardLabels.map((label) => (
                          <span key={label} className="rounded-full bg-white px-3 py-1 text-xs font-bold text-emerald-700 shadow-sm">
                            + {label}
                          </span>
                        ))}
                      </div>
                    ) : null}
                    <form action={markKidsTaskDoneAction} className="mt-4">
                      <input type="hidden" name="occurrenceId" value={task.id} />
                      <Button type="submit" className="min-h-12 w-full rounded-2xl text-base font-black">Ich hab’s gemacht</Button>
                    </form>
                  </article>
                ))}
              </div>
            )}

            <div className="rounded-3xl bg-sky-50 p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-sky-700">Mein Haushaltsbuch</p>
              <p className="mt-1 text-xl font-black text-slate-950">Saldo {formatCents(sumChildLedger(ledgerEntries))}</p>
              <form action={createChildLedgerEntryAction} className="mt-3 space-y-3">
                <input type="hidden" name="childId" value={child.id} />
                <div className="grid grid-cols-2 gap-2">
                  <label className="grid gap-2 text-sm font-medium text-slate-800" htmlFor={`direction-${child.id}`}>
                    Art
                    <select id={`direction-${child.id}`} name="direction" className="min-h-11 rounded-2xl border border-slate-200 bg-white px-3 text-base text-slate-950" defaultValue="EXPENSE">
                      <option value="INCOME">Plus</option>
                      <option value="EXPENSE">Ausgabe</option>
                    </select>
                  </label>
                  <FormField label="Betrag" name="amount" inputMode="decimal" placeholder="2,00" required />
                </div>
                <FormField label="Wofür?" name="title" placeholder="Eis gekauft" required />
                <label className="grid gap-2 text-sm font-medium text-slate-800" htmlFor={`ledger-account-${child.id}`}>
                  Konto
                  <select id={`ledger-account-${child.id}`} name="financeAccountId" className="min-h-11 rounded-2xl border border-slate-200 bg-white px-3 text-base text-slate-950">
                    <option value="">Nur Haushaltsbuch</option>
                    {financeAccounts.map((account) => <option key={account.id} value={account.id}>{account.name}</option>)}
                  </select>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <FormField label="Kategorie" name="categoryLabel" placeholder="Süßes" />
                  <label className="grid gap-2 text-sm font-medium text-slate-800" htmlFor={`visibility-${child.id}`}>
                    Sichtbarkeit
                    <select id={`visibility-${child.id}`} name="visibility" className="min-h-11 rounded-2xl border border-slate-200 bg-white px-3 text-base text-slate-950" defaultValue="PARENT_VISIBLE">
                      <option value="PARENT_VISIBLE">Eltern sichtbar</option>
                      <option value="CHILD_PRIVATE">Privat</option>
                    </select>
                  </label>
                </div>
                <Button type="submit" className="min-h-11 w-full rounded-2xl font-black">Eintrag speichern</Button>
              </form>
              {ledgerEntries.length > 0 ? (
                <div className="mt-3 grid gap-2">
                  {ledgerEntries.map((entry) => (
                    <div key={entry.id} className="flex items-center justify-between gap-2 rounded-2xl bg-white px-3 py-2">
                      <div>
                        <p className="font-bold text-slate-950">{entry.title} · {formatCents(entry.direction === "EXPENSE" ? -entry.amountCents : entry.amountCents)}</p>
                        <p className="text-xs font-semibold text-slate-500">{entry.account?.name || (entry.visibility === "CHILD_PRIVATE" ? "privat" : "Eltern sichtbar")}</p>
                      </div>
                      {!entry.financeAccountId ? (
                        <form action={deleteChildLedgerEntryAction}>
                          <input type="hidden" name="entryId" value={entry.id} />
                          <input type="hidden" name="childId" value={child.id} />
                          <Button type="submit" className="px-3 py-2 text-xs">Löschen</Button>
                        </form>
                      ) : null}
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          </section>
        );})}
      </div>
    </div>
  );
}
