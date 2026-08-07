import { redirect } from "next/navigation";
import { z } from "zod";
import type { ChecklistKind, ChecklistStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { requireFamilyAdmin, requireFamilyAdminOrChild } from "@/lib/family-context";
import { canAccessChecklist } from "@/lib/family-access-policy";

export type ChecklistItemProgress = { checked: boolean; requiredSnapshot?: boolean | null };

export function checklistProgress(items: ChecklistItemProgress[]) {
  const total = items.length;
  const done = items.filter((item) => item.checked).length;
  const required = items.filter((item) => item.requiredSnapshot !== false);
  const requiredDone = required.filter((item) => item.checked).length;
  return { total, done, required: required.length, requiredDone, complete: total > 0 && requiredDone === required.length };
}

export function checklistProgressLabel(items: ChecklistItemProgress[]) {
  const progress = checklistProgress(items);
  return `${progress.done}/${progress.total} erledigt`;
}

export function checklistKindLabel(kind: ChecklistKind | string) {
  return kind === "PACKING" ? "Rüstliste" : "Checkliste";
}

export function checklistStatusLabel(status: ChecklistStatus | string) {
  if (status === "DONE") return "Fertig";
  if (status === "ARCHIVED") return "Archiviert";
  return "Offen";
}

export type ChecklistCatalogItem = { title: string; note?: string; quantityLabel?: string; required?: boolean };
export type ChecklistCatalogTemplate = { id: string; title: string; description: string; category: string; kind: ChecklistKind; items: ChecklistCatalogItem[] };

export const checklistCatalog: ChecklistCatalogTemplate[] = [
  {
    id: "geburtstag-vorbereitung",
    title: "Geburtstag vorbereiten",
    description: "Einladungen, Essen, Geschenke und Ablauf gemeinsam im Blick behalten.",
    category: "Geburtstag",
    kind: "GENERAL",
    items: [
      { title: "Gästeliste abstimmen" },
      { title: "Einladungen verschicken" },
      { title: "Allergien und Vorlieben prüfen" },
      { title: "Essen und Getränke planen" },
      { title: "Geschenke und Wunschliste prüfen", required: false },
      { title: "Dekoration und Ablauf vorbereiten", required: false },
    ],
  },
  {
    id: "besuch-vorbereitung",
    title: "Besuch vorbereiten",
    description: "Die wichtigsten Vorbereitungen für Übernachtungs- oder Tagesbesuch.",
    category: "Besuch",
    kind: "GENERAL",
    items: [
      { title: "Ankunft und Abfahrt abstimmen" },
      { title: "Schlafplätze vorbereiten", required: false },
      { title: "Allergien und Vorlieben prüfen" },
      { title: "Essen und Getränke planen" },
      { title: "Handtücher und Bettwäsche bereitlegen", required: false },
      { title: "Gemeinsamen Ablauf abstimmen", required: false },
    ],
  },
  {
    id: "ausflug-tagesrucksack",
    title: "Ausflug: Tagesrucksack",
    description: "Grundliste für Schule, Zoo, Spielplatz oder Tagesausflug.",
    category: "Ausflug",
    kind: "PACKING",
    items: [
      { title: "Trinkflasche", quantityLabel: "1x" },
      { title: "Brotdose / Snack", quantityLabel: "1x" },
      { title: "Wetterkleidung", note: "Regenjacke, Mütze oder Sonnenhut" },
      { title: "Taschentücher" },
      { title: "Notfallzettel / Telefonnummer", required: false },
      { title: "Kleines Taschengeld", required: false },
    ],
  },
  {
    id: "schwimmbad-badesee",
    title: "Schwimmbad / Badesee",
    description: "Rüstliste fürs Schwimmen, Freibad oder See.",
    category: "Ausflug",
    kind: "PACKING",
    items: [
      { title: "Badesachen", quantityLabel: "1x" },
      { title: "Handtuch", quantityLabel: "1x" },
      { title: "Wechselwäsche", quantityLabel: "1 Satz" },
      { title: "Sonnencreme", required: false },
      { title: "Badekarte / Eintrittsgeld", required: false },
      { title: "Nasse Sachen einpacken", note: "Beutel nicht vergessen" },
    ],
  },
  {
    id: "urlaub-kinderkoffer",
    title: "Urlaub: Kinderkoffer",
    description: "Basispackliste für mehrtägige Reisen.",
    category: "Urlaub",
    kind: "PACKING",
    items: [
      { title: "Unterwäsche", quantityLabel: "pro Tag + Reserve" },
      { title: "Socken", quantityLabel: "pro Tag + Reserve" },
      { title: "Hosen / Röcke" },
      { title: "T-Shirts / Pullis" },
      { title: "Schlafanzug" },
      { title: "Kulturbeutel", note: "Zahnbürste, Zahnpasta, Bürste" },
      { title: "Lieblingskuscheltier / Buch", required: false },
      { title: "Ladegerät / Kopfhörer", required: false },
    ],
  },
  {
    id: "uebernachtung",
    title: "Übernachtung bei Freunden",
    description: "Kleine Tasche für eine Nacht außer Haus.",
    category: "Übernachtung",
    kind: "PACKING",
    items: [
      { title: "Schlafanzug" },
      { title: "Zahnbürste" },
      { title: "Wechselkleidung", quantityLabel: "1 Satz" },
      { title: "Unterwäsche und Socken", quantityLabel: "1x" },
      { title: "Kuscheltier / Buch", required: false },
      { title: "Kontaktdaten / Abholzeit", required: false },
    ],
  },
  {
    id: "schultasche",
    title: "Schultasche packen",
    description: "Wiederverwendbare Schul-Checkliste für den nächsten Tag.",
    category: "Schule",
    kind: "GENERAL",
    items: [
      { title: "Stundenplan prüfen" },
      { title: "Hefte und Bücher einpacken" },
      { title: "Hausaufgaben einpacken" },
      { title: "Federmappe vollständig" },
      { title: "Brotdose / Trinkflasche vorbereiten", required: false },
      { title: "Sport- oder Schwimmsachen", required: false },
    ],
  },
  {
    id: "sporttasche",
    title: "Sporttasche",
    description: "Training, Schulsport oder Verein.",
    category: "Sport",
    kind: "PACKING",
    items: [
      { title: "Sportschuhe" },
      { title: "Sportkleidung" },
      { title: "Trinkflasche" },
      { title: "Handtuch", required: false },
      { title: "Wechselwäsche", required: false },
      { title: "Vereinskarte / Ausrüstung", required: false },
    ],
  },
  {
    id: "morgenroutine",
    title: "Morgenroutine",
    description: "Kurze Checkliste für einen ruhigen Start.",
    category: "Alltag",
    kind: "GENERAL",
    items: [
      { title: "Anziehen" },
      { title: "Zähne putzen" },
      { title: "Frühstück / Trinkflasche" },
      { title: "Tasche nehmen" },
      { title: "Jacke / Schuhe passend zum Wetter" },
    ],
  },
  {
    id: "abendroutine",
    title: "Abendroutine",
    description: "Wiederverwendbare Abend-Checkliste.",
    category: "Alltag",
    kind: "GENERAL",
    items: [
      { title: "Zimmer kurz aufräumen" },
      { title: "Schultasche / Kleidung vorbereiten" },
      { title: "Zähne putzen" },
      { title: "Schlafanzug anziehen" },
      { title: "Lesen / Ruhezeit", required: false },
    ],
  },
  {
    id: "kuechendienst",
    title: "Küchendienst",
    description: "Wiederverwendbare Checkliste nach dem Essen oder für den Familiendienst.",
    category: "Haushalt",
    kind: "GENERAL",
    items: [
      { title: "Tisch abräumen" },
      { title: "Essensreste entsorgen oder wegstellen" },
      { title: "Geschirr in Spülmaschine / Spüle räumen" },
      { title: "Arbeitsfläche und Tisch abwischen" },
      { title: "Herd prüfen und bei Bedarf abwischen" },
      { title: "Boden kurz fegen", required: false },
      { title: "Lappen ausspülen und aufhängen" },
      { title: "Müll prüfen", note: "Wenn voll: Bescheid sagen oder rausbringen", required: false },
    ],
  },
];

export function getChecklistCatalogTemplate(id: string) {
  return checklistCatalog.find((template) => template.id === id) ?? null;
}

export function catalogTemplateToRows(template: ChecklistCatalogTemplate) {
  return template.items.map((item, sortOrder) => ({
    title: item.title,
    note: item.note ?? null,
    quantityLabel: item.quantityLabel ?? null,
    required: item.required ?? true,
    sortOrder,
  }));
}

export function prepareChecklistInstance(input: {
  template: { id: string; title: string; category: string; kind: ChecklistKind; items: Array<{ title: string; note: string | null; quantityLabel: string | null; required: boolean; sortOrder: number }> };
  assignedFamilyMemberId?: string | null;
  taskOccurrenceId?: string | null;
  taskTemplateId?: string | null;
}) {
  return {
    templateId: input.template.id,
    taskOccurrenceId: input.taskOccurrenceId ?? null,
    taskTemplateId: input.taskTemplateId ?? null,
    assignedFamilyMemberId: input.assignedFamilyMemberId ?? null,
    titleSnapshot: input.template.title,
    categorySnapshot: input.template.category,
    kindSnapshot: input.template.kind,
    items: input.template.items.map((item) => ({
      titleSnapshot: item.title,
      noteSnapshot: item.note,
      quantityLabelSnapshot: item.quantityLabel,
      requiredSnapshot: item.required,
      sortOrder: item.sortOrder,
    })),
  };
}

const templateSchema = z.object({
  title: z.string().trim().min(2),
  description: z.string().trim().optional(),
  category: z.string().trim().min(2),
  kind: z.enum(["GENERAL", "PACKING"]),
  items: z.array(z.object({
    title: z.string().trim().min(1),
    note: z.string().trim().optional(),
    quantityLabel: z.string().trim().optional(),
    required: z.boolean(),
  })).min(1),
});

const instanceSchema = z.object({
  templateId: z.string().min(1),
  assignedFamilyMemberId: z.string().optional(),
  taskOccurrenceId: z.string().optional(),
});

function nonEmptyRows(formData: FormData) {
  const titles = formData.getAll("itemTitle").map((value) => value.toString().trim());
  const notes = formData.getAll("itemNote").map((value) => value.toString().trim());
  const quantities = formData.getAll("quantityLabel").map((value) => value.toString().trim());
  return titles.map((title, index) => ({
    title,
    note: notes[index] || undefined,
    quantityLabel: quantities[index] || undefined,
    required: true,
  })).filter((item) => item.title);
}

export async function getChecklistsPageData() {
  const context = await requireFamilyAdmin();
  const [templates, instances, members, tasks] = await Promise.all([
    db.checklistTemplate.findMany({
      where: { familyId: context.family.id, active: true },
      include: { items: { orderBy: { sortOrder: "asc" } } },
      orderBy: [{ kind: "desc" }, { createdAt: "desc" }],
    }),
    db.checklistInstance.findMany({
      where: { familyId: context.family.id, status: { not: "ARCHIVED" } },
      include: { items: { orderBy: { sortOrder: "asc" } }, assignedMember: true, taskOccurrence: true },
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
      take: 40,
    }),
    db.familyMember.findMany({ where: { familyId: context.family.id }, orderBy: [{ role: "asc" }, { createdAt: "asc" }] }),
    db.taskOccurrence.findMany({
      where: { familyId: context.family.id, status: { in: ["open", "in_progress", "done"] } },
      include: { member: true },
      orderBy: [{ dueAt: "asc" }, { createdAt: "asc" }],
      take: 50,
    }),
  ]);
  return { context, templates, instances, members, tasks, catalog: checklistCatalog };
}

export async function getKidsChecklistData() {
  const context = await requireFamilyAdminOrChild();
  const childId = context.childMemberId;
  const instances = await db.checklistInstance.findMany({
    where: {
      familyId: context.family.id,
      status: "OPEN",
      ...(childId ? { OR: [{ assignedFamilyMemberId: childId }, { taskOccurrence: { familyMemberId: childId } }] } : {}),
    },
    include: { items: { orderBy: { sortOrder: "asc" } }, assignedMember: true, taskOccurrence: true },
    orderBy: [{ createdAt: "desc" }],
    take: 30,
  });
  return { context, instances };
}

export async function createChecklistTemplate(formData: FormData) {
  const context = await requireFamilyAdmin();
  const parsed = templateSchema.safeParse({
    title: formData.get("title")?.toString(),
    description: formData.get("description")?.toString(),
    category: formData.get("category")?.toString() || "Alltag",
    kind: formData.get("kind")?.toString() || "GENERAL",
    items: nonEmptyRows(formData),
  });
  if (!parsed.success) redirect("/app/checklists?error=invalid-template");

  await db.checklistTemplate.create({
    data: {
      familyId: context.family.id,
      title: parsed.data.title,
      description: parsed.data.description || null,
      category: parsed.data.category,
      kind: parsed.data.kind,
      createdByUserId: context.user.id,
      items: { create: parsed.data.items.map((item, sortOrder) => ({ ...item, note: item.note || null, quantityLabel: item.quantityLabel || null, sortOrder })) },
    },
  });
}


export async function importChecklistCatalogTemplate(formData: FormData) {
  const context = await requireFamilyAdmin();
  const catalogId = formData.get("catalogId")?.toString() ?? "";
  const titleOverride = formData.get("titleOverride")?.toString().trim() ?? "";
  const template = getChecklistCatalogTemplate(catalogId);
  if (!template) redirect("/app/checklists?error=invalid-catalog");

  await db.checklistTemplate.create({
    data: {
      familyId: context.family.id,
      title: titleOverride || template.title,
      description: template.description,
      category: template.category,
      kind: template.kind,
      createdByUserId: context.user.id,
      items: { create: catalogTemplateToRows(template) },
    },
  });
}

export async function createChecklistInstance(formData: FormData) {
  const context = await requireFamilyAdmin();
  const parsed = instanceSchema.safeParse({
    templateId: formData.get("templateId")?.toString(),
    assignedFamilyMemberId: formData.get("assignedFamilyMemberId")?.toString() || undefined,
    taskOccurrenceId: formData.get("taskOccurrenceId")?.toString() || undefined,
  });
  if (!parsed.success) redirect("/app/checklists?error=invalid-instance");

  const template = await db.checklistTemplate.findFirst({
    where: { id: parsed.data.templateId, familyId: context.family.id, active: true },
    include: { items: { orderBy: { sortOrder: "asc" } } },
  });
  if (!template) redirect("/app/checklists?error=invalid-template");

  const task = parsed.data.taskOccurrenceId
    ? await db.taskOccurrence.findFirst({ where: { id: parsed.data.taskOccurrenceId, familyId: context.family.id } })
    : null;
  if (parsed.data.taskOccurrenceId && !task) redirect("/app/checklists?error=invalid-task");

  const memberId = parsed.data.assignedFamilyMemberId || task?.familyMemberId || null;
  if (memberId) {
    const member = await db.familyMember.findFirst({ where: { id: memberId, familyId: context.family.id } });
    if (!member) redirect("/app/checklists?error=invalid-member");
  }

  const prepared = prepareChecklistInstance({ template, assignedFamilyMemberId: memberId, taskOccurrenceId: task?.id ?? null, taskTemplateId: task?.taskTemplateId ?? null });
  await db.checklistInstance.create({
    data: {
      familyId: context.family.id,
      templateId: prepared.templateId,
      taskOccurrenceId: prepared.taskOccurrenceId,
      taskTemplateId: prepared.taskTemplateId,
      assignedFamilyMemberId: prepared.assignedFamilyMemberId,
      titleSnapshot: prepared.titleSnapshot,
      categorySnapshot: prepared.categorySnapshot,
      kindSnapshot: prepared.kindSnapshot,
      createdByUserId: context.user.id,
      items: { create: prepared.items },
    },
  });
}

export async function setChecklistItemChecked(itemId: string, checked: boolean) {
  const context = await requireFamilyAdminOrChild();
  const item = await db.checklistItemInstance.findFirst({
    where: { id: itemId, checklistInstance: { familyId: context.family.id } },
    include: { checklistInstance: { include: { items: true, taskOccurrence: true } } },
  });
  if (!item) redirect("/app/checklists?error=invalid-item");
  if (!canAccessChecklist(
    context,
    item.checklistInstance.assignedFamilyMemberId,
    item.checklistInstance.taskOccurrence?.familyMemberId ?? null,
  )) {
    redirect("/app/kids?error=forbidden-checklist-item");
  }

  await db.checklistItemInstance.update({
    where: { id: item.id },
    data: { checked, checkedByUserId: checked ? context.user.id : null, checkedAt: checked ? new Date() : null },
  });

  const nextItems = item.checklistInstance.items.map((current) => current.id === item.id ? { ...current, checked } : current);
  const progress = checklistProgress(nextItems);
  await db.checklistInstance.update({
    where: { id: item.checklistInstanceId },
    data: { status: progress.complete ? "DONE" : "OPEN", completedAt: progress.complete ? new Date() : null },
  });
}

export async function archiveChecklistInstance(instanceId: string) {
  const context = await requireFamilyAdmin();
  const instance = await db.checklistInstance.findFirst({ where: { id: instanceId, familyId: context.family.id } });
  if (!instance) redirect("/app/checklists?error=invalid-instance");
  await db.checklistInstance.update({ where: { id: instance.id }, data: { status: "ARCHIVED" } });
}
