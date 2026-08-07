import { redirect } from "next/navigation";
import { z } from "zod";
import type { PlanningDocumentStatus, PlanningStatus, PlanningType, Prisma, ProjectStatus, TaskStatus } from "@prisma/client";
import { db } from "@/lib/db";
import {
  getChecklistCatalogTemplate,
  prepareChecklistInstance,
  setChecklistItemChecked,
} from "@/lib/checklists";
import { requireFamilyAdmin } from "@/lib/family-context";
import { buildProjectGuestPreferenceSummary } from "@/lib/projects";
import { updateTaskOccurrenceStatus } from "@/lib/tasks";

const planningInputSchema = z.object({
  type: z.enum(["BIRTHDAY", "VACATION", "VISIT", "OUTING"]),
  title: z.string().trim().min(2),
  description: z.string().trim().optional(),
  location: z.string().trim().optional(),
  startDate: z.string().trim().min(1),
  endDate: z.string().trim().optional(),
  participantIds: z.array(z.string().min(1)).min(1),
  guestContactIds: z.array(z.string().min(1)),
  giftListIds: z.array(z.string().min(1)),
  checklistTemplateIds: z.array(z.string().min(1)),
  createCostProject: z.boolean(),
  addStarterChecklist: z.boolean(),
});

const planningTaskInputSchema = z.object({
  title: z.string().trim().min(2),
  familyMemberId: z.string().trim().min(1),
  dueDate: z.string().trim().min(1),
});

const planningDocumentInputSchema = z.object({
  title: z.string().trim().min(2),
  familyMemberId: z.string().trim().optional(),
  note: z.string().trim().optional(),
});

const planningChecklistInputSchema = z.object({
  templateId: z.string().trim().min(1),
  familyMemberId: z.string().trim().optional(),
});

const planningIdsInputSchema = z.object({ ids: z.array(z.string().min(1)).min(1) });

type InvalidInput = { success: false };

export type ParsedPlanningInput = {
  type: PlanningType;
  title: string;
  description: string;
  location: string;
  startsAt: Date;
  endsAt: Date;
  participantIds: string[];
  guestContactIds: string[];
  giftListIds: string[];
  checklistTemplateIds: string[];
  createCostProject: boolean;
  addStarterChecklist: boolean;
};

export type ParsedPlanningTaskInput = {
  title: string;
  familyMemberId: string;
  dueAt: Date;
};

export type ParsedPlanningDocumentInput = {
  title: string;
  familyMemberId: string;
  note: string;
};

export type PlanningProgressInput = {
  tasks: Array<{ status: string }>;
  checklists: Array<{ items: Array<{ checked: boolean; requiredSnapshot?: boolean }> }>;
  documents: Array<{ status: string }>;
};

export type PlanningFamilyLinkCounts = {
  members: number;
  contacts: number;
  giftLists: number;
  templates: number;
};

type PlanningChecklistTemplate = Parameters<typeof prepareChecklistInstance>[0]["template"];

function invalid(): InvalidInput {
  return { success: false };
}

export function isInvalidPlanningInput<T>(input: T | InvalidInput): input is InvalidInput {
  return typeof input === "object" && input !== null && "success" in input && input.success === false;
}

function uniqueIds(ids: string[]) {
  return Array.from(new Set(ids.map((id) => id.trim()).filter(Boolean)));
}

function parseUtcDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) return null;
  return date;
}

export function parsePlanningInput(input: {
  type?: string;
  title?: string;
  description?: string;
  location?: string;
  startDate?: string;
  endDate?: string;
  participantIds?: string[];
  guestContactIds?: string[];
  giftListIds?: string[];
  checklistTemplateIds?: string[];
  createCostProject?: boolean;
  addStarterChecklist?: boolean;
}): ParsedPlanningInput | InvalidInput {
  const parsed = planningInputSchema.safeParse({
    type: input.type,
    title: input.title,
    description: input.description,
    location: input.location,
    startDate: input.startDate,
    endDate: input.endDate,
    participantIds: uniqueIds(input.participantIds ?? []),
    guestContactIds: uniqueIds(input.guestContactIds ?? []),
    giftListIds: uniqueIds(input.giftListIds ?? []),
    checklistTemplateIds: uniqueIds(input.checklistTemplateIds ?? []),
    createCostProject: Boolean(input.createCostProject),
    addStarterChecklist: Boolean(input.addStarterChecklist),
  });
  if (!parsed.success) return invalid();

  const startsAt = parseUtcDate(parsed.data.startDate);
  const endsAt = parseUtcDate(parsed.data.endDate || parsed.data.startDate);
  if (!startsAt || !endsAt || endsAt < startsAt) return invalid();
  if (parsed.data.type === "VACATION" && !parsed.data.endDate) return invalid();

  return {
    type: parsed.data.type,
    title: parsed.data.title,
    description: parsed.data.description ?? "",
    location: parsed.data.location ?? "",
    startsAt,
    endsAt,
    participantIds: parsed.data.participantIds,
    guestContactIds: parsed.data.guestContactIds,
    giftListIds: parsed.data.giftListIds,
    checklistTemplateIds: parsed.data.checklistTemplateIds,
    createCostProject: parsed.data.createCostProject,
    addStarterChecklist: parsed.data.addStarterChecklist,
  };
}

export function parsePlanningTaskInput(input: { title?: string; familyMemberId?: string; dueDate?: string }): ParsedPlanningTaskInput | InvalidInput {
  const parsed = planningTaskInputSchema.safeParse(input);
  if (!parsed.success) return invalid();
  const dueAt = parseUtcDate(parsed.data.dueDate);
  if (!dueAt) return invalid();
  return { title: parsed.data.title, familyMemberId: parsed.data.familyMemberId, dueAt };
}

export function parsePlanningDocumentInput(input: { title?: string; familyMemberId?: string; note?: string }): ParsedPlanningDocumentInput | InvalidInput {
  const parsed = planningDocumentInputSchema.safeParse(input);
  if (!parsed.success) return invalid();
  return {
    title: parsed.data.title,
    familyMemberId: parsed.data.familyMemberId ?? "",
    note: parsed.data.note ?? "",
  };
}

export function planningLinksBelongToFamily(
  input: Pick<ParsedPlanningInput, "participantIds" | "guestContactIds" | "giftListIds" | "checklistTemplateIds">,
  counts: PlanningFamilyLinkCounts,
) {
  return counts.members === input.participantIds.length
    && counts.contacts === input.guestContactIds.length
    && counts.giftLists === input.giftListIds.length
    && counts.templates === input.checklistTemplateIds.length;
}

export function buildPlanningProgress(input: PlanningProgressInput) {
  const taskDone = input.tasks.filter((task) => task.status === "done" || task.status === "confirmed" || task.status === "skipped").length;
  const checklistItems = input.checklists.flatMap((checklist) => checklist.items).filter((item) => item.requiredSnapshot !== false);
  const checklistDone = checklistItems.filter((item) => item.checked).length;
  const documentDone = input.documents.filter((document) => document.status === "READY").length;
  const total = input.tasks.length + checklistItems.length + input.documents.length;
  const done = taskDone + checklistDone + documentDone;
  return {
    tasks: { done: taskDone, total: input.tasks.length },
    checklistItems: { done: checklistDone, total: checklistItems.length },
    documents: { done: documentDone, total: input.documents.length },
    done,
    total,
  };
}

export function planningTypeLabel(type: PlanningType | string) {
  if (type === "BIRTHDAY") return "Geburtstag";
  if (type === "VACATION") return "Urlaub";
  if (type === "VISIT") return "Besuch";
  return "Ausflug";
}

export function planningTypeIcon(type: PlanningType | string) {
  if (type === "BIRTHDAY") return "🎂";
  if (type === "VACATION") return "🏖️";
  if (type === "VISIT") return "🏡";
  return "🎒";
}

export function planningStatusLabel(status: PlanningStatus | string) {
  if (status === "DONE") return "Abgeschlossen";
  if (status === "ARCHIVED") return "Archiviert";
  return "Aktiv";
}

export function planningProjectStatus(status: PlanningStatus): ProjectStatus {
  if (status === "DONE") return "done";
  if (status === "ARCHIVED") return "archived";
  return "active";
}

export function planningDocumentStatusLabel(status: PlanningDocumentStatus | string) {
  return status === "READY" ? "Bereit" : "Offen";
}

export function formatPlanningDateRange(startsAt: Date, endsAt: Date) {
  const formatter = new Intl.DateTimeFormat("de-DE", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "UTC" });
  const start = formatter.format(startsAt);
  const end = formatter.format(endsAt);
  return start === end ? start : `${start}–${end}`;
}

function starterChecklistId(type: PlanningType) {
  if (type === "BIRTHDAY") return "geburtstag-vorbereitung";
  if (type === "VACATION") return "urlaub-kinderkoffer";
  if (type === "VISIT") return "besuch-vorbereitung";
  return "ausflug-tagesrucksack";
}

function catalogInstanceData(catalogId: string) {
  const template = getChecklistCatalogTemplate(catalogId);
  if (!template) return null;
  return {
    titleSnapshot: template.title,
    categorySnapshot: template.category,
    kindSnapshot: template.kind,
    items: template.items.map((item, sortOrder) => ({
      titleSnapshot: item.title,
      noteSnapshot: item.note ?? null,
      quantityLabelSnapshot: item.quantityLabel ?? null,
      requiredSnapshot: item.required ?? true,
      sortOrder,
    })),
  };
}

export async function getPlanningListData() {
  const context = await requireFamilyAdmin();
  const plans = await db.planningEvent.findMany({
    where: { familyId: context.family.id },
    include: {
      calendarEvent: true,
      members: { include: { member: true }, orderBy: { createdAt: "asc" } },
      guests: true,
      taskOccurrences: { select: { status: true } },
      checklistInstances: { include: { items: { select: { checked: true, requiredSnapshot: true } } } },
      documents: { select: { status: true } },
      costProject: { select: { id: true } },
    },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
  });
  plans.sort((left, right) => left.status.localeCompare(right.status) || left.calendarEvent.startsAt.getTime() - right.calendarEvent.startsAt.getTime() || right.createdAt.getTime() - left.createdAt.getTime());
  return { context, plans };
}

export async function getPlanningFormData() {
  const context = await requireFamilyAdmin();
  const [members, contacts, giftLists, checklistTemplates] = await Promise.all([
    db.familyMember.findMany({ where: { familyId: context.family.id }, orderBy: [{ role: "asc" }, { createdAt: "asc" }] }),
    db.relationshipContact.findMany({ where: { familyId: context.family.id }, orderBy: [{ name: "asc" }, { createdAt: "asc" }] }),
    db.relationshipGiftList.findMany({
      where: { familyId: context.family.id },
      include: { contact: true },
      orderBy: [{ eventDate: "asc" }, { createdAt: "desc" }],
    }),
    db.checklistTemplate.findMany({
      where: { familyId: context.family.id, active: true },
      include: { items: { orderBy: { sortOrder: "asc" } } },
      orderBy: [{ category: "asc" }, { title: "asc" }],
    }),
  ]);
  return { context, members, contacts, giftLists, checklistTemplates };
}

export async function getPlanningDetailData(planningId: string) {
  const context = await requireFamilyAdmin();
  const plan = await db.planningEvent.findFirst({
    where: { id: planningId, familyId: context.family.id },
    include: {
      calendarEvent: true,
      costProject: { include: { expenses: { where: { status: "active" }, select: { amountCents: true } } } },
      members: { include: { member: true }, orderBy: { createdAt: "asc" } },
      guests: {
        include: { contact: { include: { preferences: true } } },
        orderBy: { createdAt: "asc" },
      },
      giftLists: {
        include: { giftList: { include: { contact: true, giftIdeas: { orderBy: [{ status: "asc" }, { priority: "asc" }] } } } },
        orderBy: { createdAt: "asc" },
      },
      documents: { include: { responsibleMember: true }, orderBy: [{ status: "asc" }, { createdAt: "asc" }] },
      taskOccurrences: { include: { member: true }, orderBy: [{ dueAt: "asc" }, { createdAt: "asc" }] },
      checklistInstances: {
        include: { assignedMember: true, items: { orderBy: { sortOrder: "asc" } } },
        orderBy: [{ status: "asc" }, { createdAt: "asc" }],
      },
    },
  });
  if (!plan) redirect("/app/planning?error=not-found");

  const [contacts, checklistTemplates, giftLists] = await Promise.all([
    db.relationshipContact.findMany({ where: { familyId: context.family.id }, orderBy: [{ name: "asc" }, { createdAt: "asc" }] }),
    db.checklistTemplate.findMany({
      where: { familyId: context.family.id, active: true },
      include: { items: { orderBy: { sortOrder: "asc" } } },
      orderBy: [{ category: "asc" }, { title: "asc" }],
    }),
    db.relationshipGiftList.findMany({
      where: { familyId: context.family.id },
      include: { contact: true },
      orderBy: [{ eventDate: "asc" }, { createdAt: "desc" }],
    }),
  ]);

  const guestPreferenceSummary = buildProjectGuestPreferenceSummary(plan.guests);
  const progress = buildPlanningProgress({
    tasks: plan.taskOccurrences,
    checklists: plan.checklistInstances,
    documents: plan.documents,
  });
  return { context, plan, contacts, checklistTemplates, giftLists, guestPreferenceSummary, progress };
}

async function countFamilyRecords(input: {
  familyId: string;
  participantIds: string[];
  guestContactIds: string[];
  giftListIds: string[];
  checklistTemplateIds: string[];
}) {
  const [members, contacts, giftLists, templates] = await Promise.all([
    db.familyMember.count({ where: { familyId: input.familyId, id: { in: input.participantIds } } }),
    db.relationshipContact.count({ where: { familyId: input.familyId, id: { in: input.guestContactIds } } }),
    db.relationshipGiftList.count({ where: { familyId: input.familyId, id: { in: input.giftListIds } } }),
    db.checklistTemplate.count({ where: { familyId: input.familyId, active: true, id: { in: input.checklistTemplateIds } } }),
  ]);
  return { members, contacts, giftLists, templates };
}

export async function persistPlanningWithTransaction(
  tx: Prisma.TransactionClient,
  input: {
    familyId: string;
    userId: string;
    parsed: ParsedPlanningInput;
    templates: PlanningChecklistTemplate[];
  },
) {
  const { familyId, userId, parsed, templates } = input;
  const calendarEvent = await tx.calendarEvent.create({
    data: {
      familyId,
      title: parsed.title,
      description: parsed.description || null,
      location: parsed.location || null,
      startsAt: parsed.startsAt,
      endsAt: parsed.endsAt,
      allDay: true,
      createdByUserId: userId,
    },
  });

  const costProject = parsed.createCostProject
    ? await tx.project.create({
      data: {
        familyId,
        title: parsed.title,
        description: parsed.description ? `Kosten zu ${parsed.description}` : `Kostenprojekt für ${planningTypeLabel(parsed.type).toLowerCase()}`,
        createdByUserId: userId,
        participants: { create: parsed.participantIds.map((familyMemberId) => ({ familyMemberId })) },
        relationshipGuests: {
          create: parsed.guestContactIds.map((contactId) => ({ familyId, contactId, createdByUserId: userId })),
        },
      },
    })
    : null;

  const plan = await tx.planningEvent.create({
    data: {
      familyId,
      type: parsed.type,
      calendarEventId: calendarEvent.id,
      costProjectId: costProject?.id ?? null,
      createdByUserId: userId,
      members: { create: parsed.participantIds.map((familyMemberId) => ({ familyId, familyMemberId })) },
      guests: {
        create: parsed.guestContactIds.map((contactId) => ({ familyId, contactId, createdByUserId: userId })),
      },
      giftLists: {
        create: parsed.giftListIds.map((giftListId) => ({ familyId, giftListId, createdByUserId: userId })),
      },
    },
  });

  for (const template of templates) {
    const prepared = prepareChecklistInstance({ template });
    await tx.checklistInstance.create({
      data: {
        familyId,
        planningEventId: plan.id,
        templateId: prepared.templateId,
        titleSnapshot: prepared.titleSnapshot,
        categorySnapshot: prepared.categorySnapshot,
        kindSnapshot: prepared.kindSnapshot,
        createdByUserId: userId,
        items: { create: prepared.items },
      },
    });
  }

  if (parsed.addStarterChecklist) {
    const starter = catalogInstanceData(starterChecklistId(parsed.type));
    if (starter) {
      await tx.checklistInstance.create({
        data: {
          familyId,
          planningEventId: plan.id,
          titleSnapshot: starter.titleSnapshot,
          categorySnapshot: starter.categorySnapshot,
          kindSnapshot: starter.kindSnapshot,
          createdByUserId: userId,
          items: { create: starter.items },
        },
      });
    }
  }

  return plan.id;
}

export async function createPlanning(formData: FormData) {
  const context = await requireFamilyAdmin();
  const parsed = parsePlanningInput({
    type: formData.get("type")?.toString(),
    title: formData.get("title")?.toString(),
    description: formData.get("description")?.toString(),
    location: formData.get("location")?.toString(),
    startDate: formData.get("startDate")?.toString(),
    endDate: formData.get("endDate")?.toString(),
    participantIds: formData.getAll("participantIds").map(String),
    guestContactIds: formData.getAll("guestContactIds").map(String),
    giftListIds: formData.getAll("giftListIds").map(String),
    checklistTemplateIds: formData.getAll("checklistTemplateIds").map(String),
    createCostProject: formData.get("createCostProject") === "on",
    addStarterChecklist: formData.get("addStarterChecklist") === "on",
  });
  if (isInvalidPlanningInput(parsed)) redirect("/app/planning/new?error=invalid-planning");

  const counts = await countFamilyRecords({ familyId: context.family.id, ...parsed });
  if (!planningLinksBelongToFamily(parsed, counts)) redirect("/app/planning/new?error=invalid-links");

  const templates = parsed.checklistTemplateIds.length > 0
    ? await db.checklistTemplate.findMany({
      where: { familyId: context.family.id, active: true, id: { in: parsed.checklistTemplateIds } },
      include: { items: { orderBy: { sortOrder: "asc" } } },
    })
    : [];

  const planningId = await db.$transaction((tx) => persistPlanningWithTransaction(tx, {
    familyId: context.family.id,
    userId: context.user.id,
    parsed,
    templates,
  }));

  return planningId;
}

async function requirePlanningMember(planningId: string, familyId: string, familyMemberId: string) {
  return db.planningMember.findFirst({ where: { planningEventId: planningId, familyId, familyMemberId }, select: { id: true } });
}

export async function createPlanningTask(planningId: string, formData: FormData) {
  const context = await requireFamilyAdmin();
  const parsed = parsePlanningTaskInput({
    title: formData.get("title")?.toString(),
    familyMemberId: formData.get("familyMemberId")?.toString(),
    dueDate: formData.get("dueDate")?.toString(),
  });
  if (isInvalidPlanningInput(parsed)) redirect(`/app/planning/${planningId}?error=invalid-task`);
  const [plan, membership] = await Promise.all([
    db.planningEvent.findFirst({ where: { id: planningId, familyId: context.family.id }, select: { id: true } }),
    requirePlanningMember(planningId, context.family.id, parsed.familyMemberId),
  ]);
  if (!plan || !membership) redirect(`/app/planning/${planningId}?error=invalid-member`);

  await db.$transaction(async (tx) => {
    const template = await tx.taskTemplate.create({
      data: {
        familyId: context.family.id,
        planningEventId: planningId,
        title: parsed.title,
        category: "Planung",
        priority: "medium",
        requiresConfirmation: false,
        recurrenceType: "once",
        startsAt: parsed.dueAt,
        createdByUserId: context.user.id,
        assignments: { create: { familyMemberId: parsed.familyMemberId } },
      },
    });
    await tx.taskOccurrence.create({
      data: {
        familyId: context.family.id,
        planningEventId: planningId,
        taskTemplateId: template.id,
        familyMemberId: parsed.familyMemberId,
        titleSnapshot: parsed.title,
        dueAt: parsed.dueAt,
        requiresConfirmation: false,
      },
    });
  });
}

export async function createPlanningChecklist(planningId: string, formData: FormData) {
  const context = await requireFamilyAdmin();
  const parsed = planningChecklistInputSchema.safeParse({
    templateId: formData.get("templateId")?.toString(),
    familyMemberId: formData.get("familyMemberId")?.toString() || undefined,
  });
  if (!parsed.success) redirect(`/app/planning/${planningId}?error=invalid-checklist`);

  const [plan, template, membership] = await Promise.all([
    db.planningEvent.findFirst({ where: { id: planningId, familyId: context.family.id }, select: { id: true } }),
    db.checklistTemplate.findFirst({
      where: { id: parsed.data.templateId, familyId: context.family.id, active: true },
      include: { items: { orderBy: { sortOrder: "asc" } } },
    }),
    parsed.data.familyMemberId ? requirePlanningMember(planningId, context.family.id, parsed.data.familyMemberId) : Promise.resolve({ id: "family" }),
  ]);
  if (!plan || !template || !membership) redirect(`/app/planning/${planningId}?error=invalid-checklist-link`);

  const prepared = prepareChecklistInstance({ template, assignedFamilyMemberId: parsed.data.familyMemberId ?? null });
  await db.checklistInstance.create({
    data: {
      familyId: context.family.id,
      planningEventId: planningId,
      templateId: prepared.templateId,
      assignedFamilyMemberId: prepared.assignedFamilyMemberId,
      titleSnapshot: prepared.titleSnapshot,
      categorySnapshot: prepared.categorySnapshot,
      kindSnapshot: prepared.kindSnapshot,
      createdByUserId: context.user.id,
      items: { create: prepared.items },
    },
  });
}

export async function createPlanningDocument(planningId: string, formData: FormData) {
  const context = await requireFamilyAdmin();
  const parsed = parsePlanningDocumentInput({
    title: formData.get("title")?.toString(),
    familyMemberId: formData.get("familyMemberId")?.toString(),
    note: formData.get("note")?.toString(),
  });
  if (isInvalidPlanningInput(parsed)) redirect(`/app/planning/${planningId}?error=invalid-document`);

  const [plan, membership] = await Promise.all([
    db.planningEvent.findFirst({ where: { id: planningId, familyId: context.family.id }, select: { id: true } }),
    parsed.familyMemberId ? requirePlanningMember(planningId, context.family.id, parsed.familyMemberId) : Promise.resolve({ id: "family" }),
  ]);
  if (!plan || !membership) redirect(`/app/planning/${planningId}?error=invalid-document-member`);

  await db.planningDocument.create({
    data: {
      familyId: context.family.id,
      planningEventId: planningId,
      responsibleFamilyMemberId: parsed.familyMemberId || null,
      title: parsed.title,
      note: parsed.note || null,
      createdByUserId: context.user.id,
    },
  });
}

export async function addPlanningGuests(planningId: string, formData: FormData) {
  const context = await requireFamilyAdmin();
  const parsed = planningIdsInputSchema.safeParse({ ids: uniqueIds(formData.getAll("contactIds").map(String)) });
  if (!parsed.success) redirect(`/app/planning/${planningId}?error=invalid-guests`);
  const [plan, count] = await Promise.all([
    db.planningEvent.findFirst({ where: { id: planningId, familyId: context.family.id }, select: { id: true, costProjectId: true } }),
    db.relationshipContact.count({ where: { familyId: context.family.id, id: { in: parsed.data.ids } } }),
  ]);
  if (!plan || count !== parsed.data.ids.length) redirect(`/app/planning/${planningId}?error=invalid-guests`);

  await db.$transaction([
    db.planningGuest.createMany({
      data: parsed.data.ids.map((contactId) => ({ familyId: context.family.id, planningEventId: planningId, contactId, createdByUserId: context.user.id })),
      skipDuplicates: true,
    }),
    ...(plan.costProjectId ? [db.projectGuest.createMany({
      data: parsed.data.ids.map((contactId) => ({ familyId: context.family.id, projectId: plan.costProjectId!, contactId, createdByUserId: context.user.id })),
      skipDuplicates: true,
    })] : []),
  ]);
}

export async function addPlanningGiftLists(planningId: string, formData: FormData) {
  const context = await requireFamilyAdmin();
  const parsed = planningIdsInputSchema.safeParse({ ids: uniqueIds(formData.getAll("giftListIds").map(String)) });
  if (!parsed.success) redirect(`/app/planning/${planningId}?error=invalid-gift-lists`);
  const [plan, count] = await Promise.all([
    db.planningEvent.findFirst({ where: { id: planningId, familyId: context.family.id }, select: { id: true } }),
    db.relationshipGiftList.count({ where: { familyId: context.family.id, id: { in: parsed.data.ids } } }),
  ]);
  if (!plan || count !== parsed.data.ids.length) redirect(`/app/planning/${planningId}?error=invalid-gift-lists`);
  await db.planningGiftList.createMany({
    data: parsed.data.ids.map((giftListId) => ({ familyId: context.family.id, planningEventId: planningId, giftListId, createdByUserId: context.user.id })),
    skipDuplicates: true,
  });
}

export async function persistPlanningCostProjectWithTransaction(
  tx: Prisma.TransactionClient,
  input: {
    planningId: string;
    familyId: string;
    userId: string;
    type: PlanningType;
    status: PlanningStatus;
    title: string;
    description: string | null;
    members: Array<{ familyMemberId: string }>;
    guests: Array<{ contactId: string }>;
  },
) {
  const project = await tx.project.create({
    data: {
      familyId: input.familyId,
      title: input.title,
      description: input.description ? `Kosten zu ${input.description}` : `Kostenprojekt für ${planningTypeLabel(input.type).toLowerCase()}`,
      status: planningProjectStatus(input.status),
      createdByUserId: input.userId,
      participants: { create: input.members.map(({ familyMemberId }) => ({ familyMemberId })) },
      relationshipGuests: {
        create: input.guests.map(({ contactId }) => ({ familyId: input.familyId, contactId, createdByUserId: input.userId })),
      },
    },
  });

  const claimed = await tx.planningEvent.updateMany({
    where: { id: input.planningId, familyId: input.familyId, costProjectId: null },
    data: { costProjectId: project.id },
  });
  if (claimed.count === 1) {
    const currentPlan = await tx.planningEvent.findUnique({
      where: { id: input.planningId },
      select: { status: true },
    });
    if (!currentPlan) throw new Error("Planung wurde während der Kostenprojekt-Erstellung entfernt.");
    if (currentPlan.status !== input.status) {
      await tx.project.update({
        where: { id: project.id },
        data: { status: planningProjectStatus(currentPlan.status) },
      });
    }
    return project.id;
  }

  await tx.project.delete({ where: { id: project.id } });
  const winner = await tx.planningEvent.findUnique({
    where: { id: input.planningId },
    select: { costProjectId: true },
  });
  if (!winner?.costProjectId) throw new Error("Planung konnte keinem Kostenprojekt zugeordnet werden.");
  return winner.costProjectId;
}

export async function createPlanningCostProject(planningId: string) {
  const context = await requireFamilyAdmin();
  const plan = await db.planningEvent.findFirst({
    where: { id: planningId, familyId: context.family.id },
    include: {
      calendarEvent: true,
      members: { select: { familyMemberId: true } },
      guests: { select: { contactId: true } },
    },
  });
  if (!plan) redirect("/app/planning?error=not-found");
  if (plan.costProjectId) return plan.costProjectId;

  return db.$transaction((tx) => persistPlanningCostProjectWithTransaction(tx, {
    planningId: plan.id,
    familyId: context.family.id,
    userId: context.user.id,
    type: plan.type,
    status: plan.status,
    title: plan.calendarEvent.title,
    description: plan.calendarEvent.description,
    members: plan.members,
    guests: plan.guests,
  }));
}

export async function updatePlanningStatus(planningId: string, status: PlanningStatus) {
  const context = await requireFamilyAdmin();
  if (!(["ACTIVE", "DONE", "ARCHIVED"] as string[]).includes(status)) redirect(`/app/planning/${planningId}?error=invalid-status`);
  const plan = await db.planningEvent.findFirst({
    where: { id: planningId, familyId: context.family.id },
    select: { id: true },
  });
  if (!plan) redirect("/app/planning?error=not-found");
  await db.$transaction(async (tx) => {
    const updatedPlan = await tx.planningEvent.update({
      where: { id: plan.id },
      data: { status },
      select: { costProjectId: true },
    });
    if (updatedPlan.costProjectId) {
      await tx.project.update({
        where: { id: updatedPlan.costProjectId },
        data: { status: planningProjectStatus(status) },
      });
    }
  });
}

export async function updatePlanningDocumentStatus(planningId: string, documentId: string, status: PlanningDocumentStatus) {
  const context = await requireFamilyAdmin();
  if (status !== "OPEN" && status !== "READY") redirect(`/app/planning/${planningId}?error=invalid-document-status`);
  const document = await db.planningDocument.findFirst({ where: { id: documentId, planningEventId: planningId, familyId: context.family.id }, select: { id: true } });
  if (!document) redirect(`/app/planning/${planningId}?error=document-not-found`);
  await db.planningDocument.update({ where: { id: document.id }, data: { status } });
}

export async function updatePlanningTask(planningId: string, occurrenceId: string, status: TaskStatus) {
  const context = await requireFamilyAdmin();
  const task = await db.taskOccurrence.findFirst({ where: { id: occurrenceId, planningEventId: planningId, familyId: context.family.id }, select: { id: true } });
  if (!task) redirect(`/app/planning/${planningId}?error=task-not-found`);
  await updateTaskOccurrenceStatus(task.id, status);
}

export async function updatePlanningChecklistItem(planningId: string, itemId: string, checked: boolean) {
  const context = await requireFamilyAdmin();
  const item = await db.checklistItemInstance.findFirst({
    where: { id: itemId, checklistInstance: { planningEventId: planningId, familyId: context.family.id } },
    select: { id: true },
  });
  if (!item) redirect(`/app/planning/${planningId}?error=checklist-item-not-found`);
  await setChecklistItemChecked(item.id, checked);
}
