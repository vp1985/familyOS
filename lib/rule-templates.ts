export type RuleTemplateAgeGroupId = "3-5" | "6-8" | "9-12" | "13-15" | "16-18";

export type RuleTemplateCategoryId =
  | "medien"
  | "ordnung"
  | "schule"
  | "umgang"
  | "routine"
  | "gesundheit"
  | "sicherheit"
  | "haushalt"
  | "geld";

export type RuleTemplate = {
  id: string;
  ageGroups: RuleTemplateAgeGroupId[];
  category: RuleTemplateCategoryId;
  title: string;
  description: string;
};

type InvalidSelection = { success: false };

export const ruleTemplateAgeGroups: Array<{ id: RuleTemplateAgeGroupId; label: string }> = [
  { id: "3-5", label: "3–5 Jahre" },
  { id: "6-8", label: "6–8 Jahre" },
  { id: "9-12", label: "9–12 Jahre" },
  { id: "13-15", label: "13–15 Jahre" },
  { id: "16-18", label: "16–18 Jahre" },
];

export const ruleTemplateCategories: Array<{ id: RuleTemplateCategoryId; label: string }> = [
  { id: "medien", label: "Medien" },
  { id: "ordnung", label: "Ordnung" },
  { id: "schule", label: "Hausaufgaben / Schule" },
  { id: "umgang", label: "Umgang / Respekt" },
  { id: "routine", label: "Schlafen / Morgenroutine" },
  { id: "gesundheit", label: "Gesundheit" },
  { id: "sicherheit", label: "Sicherheit" },
  { id: "haushalt", label: "Mithilfe im Haushalt" },
  { id: "geld", label: "Geld / Konsum" },
];

export const ruleTemplates: RuleTemplate[] = [
  // 3–5
  { id: "medien-3-5-gemeinsam", ageGroups: ["3-5"], category: "medien", title: "Bildschirmzeit nur gemeinsam", description: "Bildschirmzeit findet nur gemeinsam oder nach klarer Absprache statt." },
  { id: "medien-3-5-nicht-vor-schlaf", ageGroups: ["3-5"], category: "medien", title: "Keine Videos vor dem Schlafen", description: "Direkt vor dem Schlafen schauen wir keine Videos mehr." },
  { id: "medien-3-5-weglegen", ageGroups: ["3-5"], category: "medien", title: "Gerät gemeinsam weglegen", description: "Wenn die Medienzeit vorbei ist, wird das Gerät gemeinsam weggelegt." },
  { id: "ordnung-3-5-spielsachen", ageGroups: ["3-5"], category: "ordnung", title: "Spielsachen zurücklegen", description: "Spielsachen kommen nach dem Spielen zurück an ihren Platz." },
  { id: "ordnung-3-5-schuhe-jacke", ageGroups: ["3-5"], category: "ordnung", title: "Jacke und Schuhe an den Platz", description: "Jacke und Schuhe kommen nach dem Reinkommen an ihren festen Platz." },
  { id: "ordnung-3-5-abends", ageGroups: ["3-5"], category: "ordnung", title: "Abends kurz aufräumen", description: "Vor dem Schlafen räumen wir gemeinsam grob auf." },
  { id: "umgang-3-5-stopp", ageGroups: ["3-5"], category: "umgang", title: "Stopp heißt Stopp", description: "Wenn jemand Stopp sagt, hören wir auf und holen Hilfe." },
  { id: "umgang-3-5-nicht-hauen", ageGroups: ["3-5"], category: "umgang", title: "Wir hauen nicht", description: "Wir hauen, beißen oder treten nicht, auch wenn wir wütend sind." },
  { id: "routine-3-5-abend", ageGroups: ["3-5"], category: "routine", title: "Abendroutine einhalten", description: "Nach der Abendroutine bleiben wir im Bett und kommen zur Ruhe." },
  { id: "gesundheit-3-5-zaehne", ageGroups: ["3-5"], category: "gesundheit", title: "Zähneputzen morgens und abends", description: "Zähneputzen gehört morgens und abends fest dazu." },
  { id: "sicherheit-3-5-sichtweite", ageGroups: ["3-5"], category: "sicherheit", title: "Draußen in Sichtweite bleiben", description: "Draußen bleiben wir in Sichtweite der Erwachsenen." },
  { id: "sicherheit-3-5-strasse", ageGroups: ["3-5"], category: "sicherheit", title: "Straße nur mit Erwachsenen", description: "Die Straße überqueren wir nur zusammen mit einem Erwachsenen." },

  // 6–8
  { id: "medien-6-8-hausaufgaben-zuerst", ageGroups: ["6-8"], category: "medien", title: "Medienzeit erst nach Aufgaben", description: "Medienzeit beginnt erst nach Schule, Essen und wichtigen Aufgaben." },
  { id: "medien-6-8-erlaubte-inhalte", ageGroups: ["6-8"], category: "medien", title: "Nur erlaubte Inhalte", description: "YouTube, Spiele und Apps werden nur mit erlaubten Inhalten genutzt." },
  { id: "medien-6-8-esstisch", ageGroups: ["6-8"], category: "medien", title: "Kein Gerät beim Essen", description: "Beim Essen bleibt das Gerät weg und liegt nicht am Tisch." },
  { id: "medien-6-8-abgeben", ageGroups: ["6-8"], category: "medien", title: "Gerät nach Zeitende abgeben", description: "Wenn die Medienzeit vorbei ist, wird das Gerät ohne Diskussion abgegeben." },
  { id: "ordnung-6-8-schulsachen", ageGroups: ["6-8"], category: "ordnung", title: "Schulsachen vorbereiten", description: "Schulsachen werden am Vorabend für den nächsten Tag vorbereitet." },
  { id: "ordnung-6-8-waeschekorb", ageGroups: ["6-8"], category: "ordnung", title: "Wäsche in den Korb", description: "Getragene Wäsche kommt in den Wäschekorb und nicht auf den Boden." },
  { id: "ordnung-6-8-zimmer-kurz", ageGroups: ["6-8"], category: "ordnung", title: "Zimmer täglich kurz aufräumen", description: "Das Zimmer wird einmal täglich kurz aufgeräumt." },
  { id: "ordnung-6-8-spielsachen", ageGroups: ["6-8"], category: "ordnung", title: "Sachen nach Nutzung zurücklegen", description: "Spielsachen und Materialien werden nach der Nutzung zurückgelegt." },
  { id: "schule-6-8-hausaufgaben", ageGroups: ["6-8"], category: "schule", title: "Hausaufgaben vor Medienzeit", description: "Hausaufgaben werden erledigt, bevor Medienzeit startet." },
  { id: "schule-6-8-ranzen", ageGroups: ["6-8"], category: "schule", title: "Schulranzen kontrollieren", description: "Der Schulranzen wird für den nächsten Tag kontrolliert." },
  { id: "schule-6-8-lesen", ageGroups: ["6-8"], category: "schule", title: "Kurz lesen oder üben", description: "An Schultagen wird kurz gelesen oder geübt." },
  { id: "umgang-6-8-ausreden", ageGroups: ["6-8"], category: "umgang", title: "Andere ausreden lassen", description: "Wir lassen andere ausreden und hören zu." },
  { id: "umgang-6-8-keine-beleidigungen", ageGroups: ["6-8"], category: "umgang", title: "Keine Beleidigungen", description: "Wir benutzen keine Beleidigungen und sprechen respektvoll." },
  { id: "gesundheit-6-8-suessigkeiten", ageGroups: ["6-8"], category: "gesundheit", title: "Süßigkeiten nach Absprache", description: "Süßigkeiten gibt es nur nach Absprache." },
  { id: "haushalt-6-8-tisch", ageGroups: ["6-8"], category: "haushalt", title: "Beim Tisch helfen", description: "Beim Tischdecken oder Abräumen wird kurz mitgeholfen." },

  // 9–12
  { id: "medien-9-12-zeiten", ageGroups: ["9-12"], category: "medien", title: "Medienzeiten selbst mit im Blick behalten", description: "Medienzeiten werden eingehalten und selbstständig mit beachtet." },
  { id: "medien-9-12-passwoerter", ageGroups: ["9-12"], category: "medien", title: "Keine Passwörter weitergeben", description: "Passwörter, Codes und private Daten werden nicht weitergegeben." },
  { id: "medien-9-12-schlafzimmer", ageGroups: ["9-12"], category: "medien", title: "Geräte nachts außerhalb des Zimmers", description: "Handy, Tablet oder Konsole liegen nachts außerhalb des Schlafzimmers." },
  { id: "ordnung-9-12-wochencheck", ageGroups: ["9-12"], category: "ordnung", title: "Wöchentlicher Zimmer-Check", description: "Einmal pro Woche wird das Zimmer gründlicher kontrolliert und aufgeräumt." },
  { id: "ordnung-9-12-schulsachen", ageGroups: ["9-12"], category: "ordnung", title: "Schulsachen eigenständig vorbereiten", description: "Schulsachen und Materialien werden eigenständig vorbereitet." },
  { id: "schule-9-12-tests", ageGroups: ["9-12"], category: "schule", title: "Tests frühzeitig ankündigen", description: "Tests, Arbeiten und Abgaben werden frühzeitig zu Hause angesprochen." },
  { id: "schule-9-12-lernzeit", ageGroups: ["9-12"], category: "schule", title: "Lernzeit vor Freizeit", description: "Lernzeit und Hausaufgaben kommen vor längerer Freizeit oder Medienzeit." },
  { id: "umgang-9-12-konflikte", ageGroups: ["9-12"], category: "umgang", title: "Konflikte ohne Beleidigungen", description: "Konflikte werden ohne Beleidigungen, Drohungen oder körperliche Gewalt gelöst." },
  { id: "routine-9-12-schlafenszeit", ageGroups: ["9-12"], category: "routine", title: "Schlafenszeit respektieren", description: "Die vereinbarte Schlafenszeit wird respektiert, auch wenn noch nicht alles fertig ist." },
  { id: "haushalt-9-12-spuelmaschine", ageGroups: ["9-12"], category: "haushalt", title: "Haushaltsaufgabe übernehmen", description: "Müll, Spülmaschine oder eine andere kleine Aufgabe wird nach Absprache übernommen." },
  { id: "geld-9-12-kauf-absprechen", ageGroups: ["9-12"], category: "geld", title: "Käufe vorher absprechen", description: "Online-Käufe, In-App-Käufe und größere Wünsche werden vorher abgesprochen." },
  { id: "sicherheit-9-12-unterwegs", ageGroups: ["9-12"], category: "sicherheit", title: "Unterwegs Bescheid geben", description: "Wenn sich der Ort oder Plan ändert, wird zu Hause Bescheid gesagt." },

  // 13–15
  { id: "medien-13-15-schule", ageGroups: ["13-15"], category: "medien", title: "Medien dürfen Schule nicht verdrängen", description: "Mediennutzung darf Schlaf, Schule und vereinbarte Pflichten nicht verdrängen." },
  { id: "medien-13-15-social", ageGroups: ["13-15"], category: "medien", title: "Respektvoll online", description: "Chats, Posts und Kommentare bleiben respektvoll und verletzen niemanden." },
  { id: "medien-13-15-nacht", ageGroups: ["13-15"], category: "medien", title: "Nachtruhe für Geräte", description: "Ab der vereinbarten Uhrzeit haben Geräte Nachtruhe." },
  { id: "ordnung-13-15-eigener-bereich", ageGroups: ["13-15"], category: "ordnung", title: "Eigenen Bereich verantwortlich halten", description: "Der eigene Bereich bleibt so ordentlich, dass Alltag und Schule funktionieren." },
  { id: "schule-13-15-planen", ageGroups: ["13-15"], category: "schule", title: "Schule eigenständig planen", description: "Hausaufgaben, Tests und Abgaben werden selbstständig geplant und rechtzeitig angesprochen." },
  { id: "schule-13-15-hilfe", ageGroups: ["13-15"], category: "schule", title: "Hilfe früh holen", description: "Wenn etwas in der Schule schwierig wird, wird früh Hilfe geholt." },
  { id: "umgang-13-15-ton", ageGroups: ["13-15"], category: "umgang", title: "Respektvoller Ton", description: "Auch bei Streit bleibt der Ton respektvoll und nicht verletzend." },
  { id: "routine-13-15-absprachen", ageGroups: ["13-15"], category: "routine", title: "Absprachen einhalten", description: "Vereinbarte Zeiten für Schlafen, Heimkommen und Lernen werden eingehalten." },
  { id: "haushalt-13-15-feste-aufgabe", ageGroups: ["13-15"], category: "haushalt", title: "Feste Haushaltsaufgabe", description: "Eine feste Haushaltsaufgabe wird regelmäßig übernommen." },
  { id: "geld-13-15-budget", ageGroups: ["13-15"], category: "geld", title: "Budget im Blick behalten", description: "Taschengeld, Drachmen und größere Wünsche werden geplant statt spontan verbraucht." },
  { id: "sicherheit-13-15-heimweg", ageGroups: ["13-15"], category: "sicherheit", title: "Heimweg und Änderungen melden", description: "Bei späterem Heimkommen oder Planänderungen wird kurz Bescheid gegeben." },
  { id: "gesundheit-13-15-schlaf", ageGroups: ["13-15"], category: "gesundheit", title: "Genug Schlaf schützen", description: "Schlaf ist wichtig und wird nicht dauerhaft durch Medien oder Chatten verkürzt." },

  // 16–18
  { id: "medien-16-18-verantwortung", ageGroups: ["16-18"], category: "medien", title: "Eigenverantwortliche Mediennutzung", description: "Medien werden eigenverantwortlich genutzt, ohne Schlaf, Schule oder Verpflichtungen zu gefährden." },
  { id: "medien-16-18-datenschutz", ageGroups: ["16-18"], category: "medien", title: "Datenschutz und Privatsphäre", description: "Eigene und fremde private Daten, Fotos und Nachrichten werden geschützt." },
  { id: "ordnung-16-18-eigenverantwortung", ageGroups: ["16-18"], category: "ordnung", title: "Eigene Ordnung selbst verantworten", description: "Eigener Bereich, Wäsche und wichtige Unterlagen werden selbst verantwortlich organisiert." },
  { id: "schule-16-18-termine", ageGroups: ["16-18"], category: "schule", title: "Termine und Abgaben planen", description: "Prüfungen, Abgaben und wichtige Termine werden rechtzeitig geplant." },
  { id: "schule-16-18-zukunft", ageGroups: ["16-18"], category: "schule", title: "Zukunftsschritte sichtbar machen", description: "Bewerbungen, Ausbildung, Studium oder Praktikum werden offen geplant und besprochen." },
  { id: "umgang-16-18-absprachen", ageGroups: ["16-18"], category: "umgang", title: "Erwachsene Absprachen", description: "Absprachen werden zuverlässig getroffen, eingehalten und bei Problemen rechtzeitig angepasst." },
  { id: "routine-16-18-heimkommen", ageGroups: ["16-18"], category: "routine", title: "Heimkommen absprechen", description: "Heimkommen, Übernachtungen und Planänderungen werden rechtzeitig abgesprochen." },
  { id: "haushalt-16-18-beitrag", ageGroups: ["16-18"], category: "haushalt", title: "Regelmäßiger Haushaltsbeitrag", description: "Ein regelmäßiger Beitrag im Haushalt wird selbstständig übernommen." },
  { id: "geld-16-18-schulden", ageGroups: ["16-18"], category: "geld", title: "Schulden dokumentieren", description: "Schulden bei Familie oder Freunden werden dokumentiert und zuverlässig zurückgezahlt." },
  { id: "geld-16-18-groessere-ausgaben", ageGroups: ["16-18"], category: "geld", title: "Größere Ausgaben planen", description: "Größere Ausgaben werden vorher geplant und nicht spontan entschieden." },
  { id: "sicherheit-16-18-notfall", ageGroups: ["16-18"], category: "sicherheit", title: "Erreichbarkeit im Notfall", description: "Bei längeren Wegen oder abends ist eine Notfall-Erreichbarkeit vereinbart." },
  { id: "gesundheit-16-18-belastung", ageGroups: ["16-18"], category: "gesundheit", title: "Belastung früh ansprechen", description: "Stress, Überforderung oder gesundheitliche Probleme werden früh angesprochen." },
];

const templateIds = new Set(ruleTemplates.map((template) => template.id));
const categoryIds = new Set(ruleTemplateCategories.map((category) => category.id));
const ageGroupIds = new Set(ruleTemplateAgeGroups.map((group) => group.id));

export function getRuleTemplateAgeGroups() {
  return ruleTemplateAgeGroups;
}

export function getRuleTemplateCategories() {
  return ruleTemplateCategories;
}

export function isRuleTemplateAgeGroup(value: string): value is RuleTemplateAgeGroupId {
  return ageGroupIds.has(value as RuleTemplateAgeGroupId);
}

export function getRuleTemplatesForSelection(input: {
  ageGroup: string;
  categories?: string[];
}): RuleTemplate[] {
  if (!isRuleTemplateAgeGroup(input.ageGroup)) return [];
  const categories = new Set((input.categories ?? []).filter((category): category is RuleTemplateCategoryId => categoryIds.has(category as RuleTemplateCategoryId)));

  const ageGroup = input.ageGroup;

  return ruleTemplates.filter((template) => {
    const ageMatches = template.ageGroups.includes(ageGroup);
    const categoryMatches = categories.size === 0 || categories.has(template.category);
    return ageMatches && categoryMatches;
  });
}

export function getRuleTemplateById(id: string) {
  return ruleTemplates.find((template) => template.id === id);
}

export function parseRuleTemplateSelection(formData: FormData): { templateIds: string[] } | InvalidSelection {
  const ageGroup = formData.get("ageGroup")?.toString() ?? "";
  if (!isRuleTemplateAgeGroup(ageGroup)) return { success: false };

  const selectedIds = formData.getAll("templateId").map((value) => value.toString());
  const selectedCategories = formData.getAll("category").map((value) => value.toString());
  const categoryTemplateIds = selectedCategories.length > 0
    ? getRuleTemplatesForSelection({ ageGroup, categories: selectedCategories }).map((template) => template.id)
    : [];
  const templateIdsToImport = Array.from(new Set([...selectedIds, ...categoryTemplateIds]));

  if (templateIdsToImport.length === 0) return { success: false };
  if (templateIdsToImport.some((id) => !templateIds.has(id))) return { success: false };

  return { templateIds: templateIdsToImport };
}

export function groupRuleTemplatesByCategory(templates: RuleTemplate[]) {
  return ruleTemplateCategories
    .map((category) => ({
      category,
      templates: templates.filter((template) => template.category === category.id),
    }))
    .filter((group) => group.templates.length > 0);
}
