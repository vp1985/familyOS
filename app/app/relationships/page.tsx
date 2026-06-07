import { createRelationshipContactAction, createRelationshipGiftIdeaAction, createRelationshipGiftListAction, createRelationshipPreferenceAction } from "@/app/app/relationships/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormField } from "@/components/ui/form-field";
import {
  buildPreferenceChips,
  giftListVisibilityLabel,
  giftOccasionLabel,
  giftStatusLabel,
  getRelationshipsPageData,
  preferenceCategoryLabel,
  relationshipTypeLabel,
} from "@/lib/relationships";

function errorText(error?: string) {
  if (!error) return null;
  if (error.includes("gift")) return "Bitte prüfe die Geschenklisten-Angaben.";
  if (error.includes("preference")) return "Bitte prüfe die Vorliebe oder den Hinweis.";
  return "Bitte prüfe Name, Beziehung und Familienbezug.";
}

function formatCents(cents: number | null) {
  if (cents === null) return null;
  return new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(cents / 100);
}

function formatDate(date: Date | null) {
  if (!date) return null;
  return date.toISOString().slice(0, 10);
}

const inputClass = "min-h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-base text-slate-950 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100";
const textareaClass = "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-950 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100";

export default async function RelationshipsPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const [{ members, contacts }, params] = await Promise.all([getRelationshipsPageData(), searchParams]);
  const error = errorText(params.error);

  return (
    <div className="space-y-5">
      <section className="rounded-[2rem] bg-gradient-to-br from-violet-950 via-slate-900 to-emerald-950 p-5 text-white shadow-sm">
        <p className="text-sm text-violet-200">Beziehungen</p>
        <h2 className="mt-2 text-2xl font-bold">Freunde, Familie, Gäste und Vorlieben</h2>
        <p className="mt-3 text-sm leading-6 text-slate-300">
          Speichere Getränke, Allergien, Hobbys und Geschenklisten für Menschen, die euch wichtig sind.
        </p>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Person hinzufügen</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createRelationshipContactAction} className="space-y-4">
            {error ? <p className="rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-800">{error}</p> : null}
            <FormField label="Name" name="name" placeholder="z. B. Max Müller" required />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="grid gap-2 text-sm font-medium text-slate-800" htmlFor="relationshipType">
                Beziehung
                <select id="relationshipType" name="relationshipType" defaultValue="FRIEND" className={inputClass}>
                  <option value="FRIEND">Freund/in</option>
                  <option value="FAMILY">Familie</option>
                  <option value="NEIGHBOR">Nachbar/in</option>
                  <option value="SCHOOL_CLUB">Schule/Verein</option>
                  <option value="OTHER">Sonstiges</option>
                </select>
              </label>
              <label className="grid gap-2 text-sm font-medium text-slate-800" htmlFor="relatedFamilyMemberId">
                Bezug optional
                <select id="relatedFamilyMemberId" name="relatedFamilyMemberId" defaultValue="" className={inputClass}>
                  <option value="">ganze Familie</option>
                  {members.map((member) => <option key={member.id} value={member.id}>{member.name}</option>)}
                </select>
              </label>
            </div>
            <label className="grid gap-2 text-sm font-medium text-slate-800" htmlFor="notes">
              Notiz optional
              <textarea id="notes" name="notes" rows={3} className={textareaClass} placeholder="z. B. Schulfreund, Nachbarin, Verein ..." />
            </label>
            <Button type="submit" className="w-full">Beziehung speichern</Button>
          </form>
        </CardContent>
      </Card>

      <section className="space-y-3">
        <div>
          <h3 className="text-lg font-semibold text-slate-950">Beziehungsliste</h3>
          <p className="text-sm text-slate-500">{contacts.length} Personen · Vorlieben, Allergien und Geschenklisten.</p>
        </div>

        {contacts.length === 0 ? (
          <p className="rounded-3xl bg-white px-4 py-5 text-sm text-slate-500 shadow-sm">Noch keine Beziehungen angelegt.</p>
        ) : (
          <div className="grid gap-4">
            {contacts.map((contact) => {
              const chips = buildPreferenceChips(contact.preferences);
              return (
                <article key={contact.id} className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h4 className="text-lg font-semibold text-slate-950">{contact.name}</h4>
                      <p className="text-sm text-slate-500">
                        {relationshipTypeLabel(contact.relationshipType)}{contact.relatedFamilyMember ? ` · Bezug: ${contact.relatedFamilyMember.name}` : ""}
                      </p>
                    </div>
                    <span className="rounded-full bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-700">{contact.giftLists.length} Listen</span>
                  </div>

                  {contact.notes ? <p className="mt-3 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">{contact.notes}</p> : null}

                  <div className="mt-4 space-y-2">
                    <p className="text-sm font-semibold text-slate-800">Vorlieben & Allergien</p>
                    {chips.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {chips.map((chip) => (
                          <span
                            key={`${chip.category}-${chip.label}`}
                            className={[
                              "rounded-full px-3 py-1 text-xs font-semibold",
                              chip.tone === "warning" ? "bg-red-50 text-red-700" : chip.tone === "favorite" ? "bg-emerald-50 text-emerald-700" : chip.tone === "muted" ? "bg-slate-100 text-slate-500" : "bg-sky-50 text-sky-700",
                            ].join(" ")}
                          >
                            {preferenceCategoryLabel(chip.category)}: {chip.label}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-500">Noch keine Vorlieben oder Hinweise.</p>
                    )}
                  </div>

                  <form action={createRelationshipPreferenceAction} className="mt-4 space-y-3 rounded-2xl bg-slate-50 p-3">
                    <input type="hidden" name="contactId" value={contact.id} />
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <label className="grid gap-2 text-sm font-medium text-slate-800" htmlFor={`category-${contact.id}`}>
                        Kategorie
                        <select id={`category-${contact.id}`} name="category" defaultValue="DRINK" className={inputClass}>
                          <option value="DRINK">Getränke</option>
                          <option value="FOOD">Essen/Snacks</option>
                          <option value="HOBBY">Hobbys</option>
                          <option value="GIFT_IDEA">Geschenkideen</option>
                          <option value="ALLERGY">Allergien</option>
                          <option value="MEDICAL_NOTE">Medizinische Hinweise</option>
                          <option value="OTHER">Sonstiges</option>
                        </select>
                      </label>
                      <FormField label="Eintrag" id={`label-${contact.id}`} name="label" placeholder="z. B. Spezi Gold, Erdnüsse" required />
                    </div>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <label className="grid gap-2 text-sm font-medium text-slate-800" htmlFor={`sentiment-${contact.id}`}>
                        Art
                        <select id={`sentiment-${contact.id}`} name="sentiment" defaultValue="LIKES" className={inputClass}>
                          <option value="LIKES">mag</option>
                          <option value="DISLIKES">mag nicht</option>
                          <option value="NOTE">Hinweis</option>
                        </select>
                      </label>
                      <FormField label="Notiz optional" id={`pref-notes-${contact.id}`} name="notes" placeholder="z. B. nur alkoholfrei" />
                    </div>
                    <label className="flex items-center gap-3 text-sm text-slate-700">
                      <input type="checkbox" name="isFavorite" /> Favorit
                    </label>
                    <Button type="submit" className="w-full">Vorliebe/Hinweis speichern</Button>
                  </form>

                  <div className="mt-5 space-y-3">
                    <p className="text-sm font-semibold text-slate-800">Geschenklisten</p>
                    {contact.giftLists.length > 0 ? (
                      <div className="space-y-3">
                        {contact.giftLists.map((list) => (
                          <div key={list.id} className="rounded-2xl border border-violet-100 bg-violet-50/50 p-3">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="font-semibold text-slate-950">{list.title}</p>
                                <p className="text-xs text-slate-500">
                                  {giftOccasionLabel(list.occasion)}{formatDate(list.eventDate) ? ` · ${formatDate(list.eventDate)}` : ""} · {giftListVisibilityLabel(list.visibility)}
                                </p>
                              </div>
                              <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-violet-700">{list.giftIdeas.length}</span>
                            </div>
                            {list.giftIdeas.length > 0 ? (
                              <div className="mt-3 space-y-2">
                                {list.giftIdeas.map((idea) => (
                                  <div key={idea.id} className="rounded-xl bg-white px-3 py-2 text-sm">
                                    <div className="flex items-center justify-between gap-3">
                                      <p className="font-medium text-slate-900">{idea.title}</p>
                                      <span className="text-xs font-semibold text-violet-700">{giftStatusLabel(idea.status)}</span>
                                    </div>
                                    <p className="mt-1 text-xs text-slate-500">
                                      Prio {idea.priority}{formatCents(idea.estimatedPriceCents) ? ` · ${formatCents(idea.estimatedPriceCents)}` : ""}{idea.url ? ` · ${idea.url}` : ""}
                                    </p>
                                    {idea.notes ? <p className="mt-1 text-xs text-slate-600">{idea.notes}</p> : null}
                                  </div>
                                ))}
                              </div>
                            ) : <p className="mt-3 text-sm text-slate-500">Noch keine Geschenkideen.</p>}
                          </div>
                        ))}
                      </div>
                    ) : <p className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-500">Noch keine Geschenklisten.</p>}
                  </div>

                  <form action={createRelationshipGiftListAction} className="mt-4 space-y-3 rounded-2xl bg-violet-50 p-3">
                    <input type="hidden" name="contactId" value={contact.id} />
                    <FormField label="Neue Geschenkliste" id={`gift-title-${contact.id}`} name="title" placeholder="z. B. Geburtstag 2026" required />
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <label className="grid gap-2 text-sm font-medium text-slate-800" htmlFor={`occasion-${contact.id}`}>
                        Anlass
                        <select id={`occasion-${contact.id}`} name="occasion" defaultValue="BIRTHDAY" className={inputClass}>
                          <option value="BIRTHDAY">Geburtstag</option>
                          <option value="CHRISTMAS">Weihnachten</option>
                          <option value="EASTER">Ostern</option>
                          <option value="SCHOOL">Einschulung/Schule</option>
                          <option value="OTHER">Sonstiges</option>
                        </select>
                      </label>
                      <FormField label="Datum optional" id={`event-date-${contact.id}`} name="eventDate" type="date" />
                    </div>
                    <label className="grid gap-2 text-sm font-medium text-slate-800" htmlFor={`visibility-${contact.id}`}>
                      Sichtbarkeit
                      <select id={`visibility-${contact.id}`} name="visibility" defaultValue="HIDDEN_FROM_CHILDREN" className={inputClass}>
                        <option value="FAMILY_INTERNAL">familienintern</option>
                        <option value="ORGANIZERS_ONLY">nur Organisation</option>
                        <option value="HIDDEN_FROM_CHILDREN">vor Kindern verborgen</option>
                      </select>
                    </label>
                    <Button type="submit" className="w-full">Geschenkliste anlegen</Button>
                  </form>

                  {contact.giftLists.length > 0 ? (
                    <form action={createRelationshipGiftIdeaAction} className="mt-4 space-y-3 rounded-2xl bg-emerald-50 p-3">
                      <label className="grid gap-2 text-sm font-medium text-slate-800" htmlFor={`gift-list-${contact.id}`}>
                        Liste
                        <select id={`gift-list-${contact.id}`} name="giftListId" className={inputClass}>
                          {contact.giftLists.map((list) => <option key={list.id} value={list.id}>{list.title}</option>)}
                        </select>
                      </label>
                      <FormField label="Geschenkidee" id={`idea-title-${contact.id}`} name="title" placeholder="z. B. Lego Set" required />
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <FormField label="Link optional" id={`idea-url-${contact.id}`} name="url" placeholder="https://..." />
                        <FormField label="Preisidee optional" id={`idea-price-${contact.id}`} name="estimatedPrice" placeholder="29,99" inputMode="decimal" />
                      </div>
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <label className="grid gap-2 text-sm font-medium text-slate-800" htmlFor={`idea-priority-${contact.id}`}>
                          Priorität
                          <select id={`idea-priority-${contact.id}`} name="priority" defaultValue="3" className={inputClass}>
                            <option value="1">1 sehr wichtig</option>
                            <option value="2">2</option>
                            <option value="3">3 normal</option>
                            <option value="4">4</option>
                            <option value="5">5 niedrig</option>
                          </select>
                        </label>
                        <label className="grid gap-2 text-sm font-medium text-slate-800" htmlFor={`idea-status-${contact.id}`}>
                          Status
                          <select id={`idea-status-${contact.id}`} name="status" defaultValue="IDEA" className={inputClass}>
                            <option value="IDEA">Idee</option>
                            <option value="WANTED">gewünscht</option>
                            <option value="RESERVED">reserviert</option>
                            <option value="BOUGHT">gekauft</option>
                            <option value="DONE">erledigt</option>
                          </select>
                        </label>
                      </div>
                      <FormField label="Notiz optional" id={`idea-notes-${contact.id}`} name="notes" placeholder="Farbe, Größe, Laden ..." />
                      <Button type="submit" className="w-full">Geschenkidee speichern</Button>
                    </form>
                  ) : null}
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
