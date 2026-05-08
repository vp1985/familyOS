import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireFamilyAdmin, requireFamilyContext } from "@/lib/family-context";
import { applyMoneyTransaction, parseEuroToCents } from "@/lib/money";

export type TaskStatus = "open" | "in_progress" | "done" | "confirmed" | "skipped" | "missed";
export type TaskRecurrenceType = "once" | "daily" | "weekly" | "monthly" | "weekdays";

type InvalidInput = { success: false };
type RewardFields = {
  drachmenReward?: number;
  xpReward?: number;
  moneyRewardCents?: number;
  badgeRewardTitle?: string;
  badgeRewardIcon?: string;
};

const taskStatusLabels: Record<TaskStatus, string> = {
  open: "Offen",
  in_progress: "In Arbeit",
  done: "Erledigt",
  confirmed: "Bestätigt",
  skipped: "Übersprungen",
  missed: "Verpasst",
};

const kanbanStatuses: TaskStatus[] = ["open", "in_progress", "done", "confirmed"];
const allowedStatuses = new Set<TaskStatus>(["open", "in_progress", "done", "confirmed", "skipped", "missed"]);

const taskTemplateSchema = z.object({
  title: z.string().trim().min(2),
  description: z.string().trim().optional(),
  category: z.string().trim().min(2),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
  familyMemberIds: z.array(z.string().trim().min(1)).min(1),
  subtasks: z.array(z.string().trim().min(1)).default([]),
  recurrenceType: z.enum(["once", "daily", "weekly", "monthly", "weekdays"]).default("once"),
  weekdays: z.array(z.coerce.number().int().min(0).max(6)).default([]),
  startsAt: z.date(),
  endsAt: z.date().optional(),
  dueTime: z.string().trim().regex(/^\d{2}:\d{2}$/).optional(),
  drachmenReward: z.coerce.number().int().min(0).optional(),
  xpReward: z.coerce.number().int().min(0).optional(),
  moneyRewardCents: z.number().int().min(0).optional(),
  badgeRewardTitle: z.string().trim().optional(),
  badgeRewardIcon: z.string().trim().optional(),
  requiresConfirmation: z.boolean().default(true),
});

function invalid(): InvalidInput {
  return { success: false };
}

export function isInvalidInput<T>(input: T | InvalidInput): input is InvalidInput {
  return typeof input === "object" && input !== null && "success" in input && input.success === false;
}

function nonEmpty(values: FormDataEntryValue[]) {
  return values.map((value) => value.toString().trim()).filter(Boolean);
}

function optionalNumber(value: FormDataEntryValue | null) {
  const text = value?.toString().trim() ?? "";
  return text ? text : undefined;
}

function parseDateInput(value: FormDataEntryValue | null) {
  const text = value?.toString().trim() ?? "";
  if (!text) return null;
  const date = new Date(`${text}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function normalizeOptionalText(value: FormDataEntryValue | null) {
  const text = value?.toString().trim() ?? "";
  return text || undefined;
}

export function parseTaskTemplateInput(formData: FormData) {
  const startsAt = parseDateInput(formData.get("startsAt"));
  const endsAt = parseDateInput(formData.get("endsAt"));
  const moneyText = formData.get("moneyRewardEuro")?.toString().trim() ?? "";
  const moneyRewardCents = moneyText ? parseEuroToCents(moneyText) : undefined;

  if (!startsAt || moneyRewardCents === null) return invalid();
  if (endsAt && endsAt < startsAt) return invalid();

  const parsed = taskTemplateSchema.safeParse({
    title: formData.get("title")?.toString(),
    description: formData.get("description")?.toString(),
    category: formData.get("category")?.toString() || "haushalt",
    priority: formData.get("priority")?.toString() || "medium",
    familyMemberIds: nonEmpty(formData.getAll("familyMemberId")),
    subtasks: nonEmpty(formData.getAll("subtask")),
    recurrenceType: formData.get("recurrenceType")?.toString() || "once",
    weekdays: nonEmpty(formData.getAll("weekday")),
    startsAt,
    endsAt: endsAt ?? undefined,
    dueTime: normalizeOptionalText(formData.get("dueTime")),
    drachmenReward: optionalNumber(formData.get("drachmenReward")),
    xpReward: optionalNumber(formData.get("xpReward")),
    moneyRewardCents,
    badgeRewardTitle: normalizeOptionalText(formData.get("badgeRewardTitle")),
    badgeRewardIcon: normalizeOptionalText(formData.get("badgeRewardIcon")),
    requiresConfirmation: formData.get("requiresConfirmation") !== "false",
  });

  if (!parsed.success) return invalid();
  if (parsed.data.recurrenceType === "weekdays" && parsed.data.weekdays.length === 0) return invalid();

  return {
    ...parsed.data,
    description: parsed.data.description ?? "",
    subtasks: parsed.data.subtasks,
    weekdays: Array.from(new Set(parsed.data.weekdays)).sort((a, b) => a - b),
    drachmenReward: parsed.data.drachmenReward ?? 0,
    xpReward: parsed.data.xpReward ?? 0,
    moneyRewardCents: parsed.data.moneyRewardCents ?? 0,
    badgeRewardTitle: parsed.data.badgeRewardTitle ?? "",
    badgeRewardIcon: parsed.data.badgeRewardIcon ?? "🏅",
  };
}

export function parseTaskStatusInput(status: string | null | undefined) {
  if (!status || !allowedStatuses.has(status as TaskStatus)) return invalid();
  return { status: status as TaskStatus };
}

function withTime(date: Date, dueTime?: string) {
  const result = new Date(date);
  const [hours = "0", minutes = "0"] = (dueTime ?? "00:00").split(":");
  result.setUTCHours(Number(hours), Number(minutes), 0, 0);
  return result;
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function addMonths(date: Date, months: number) {
  const next = new Date(date);
  next.setUTCMonth(next.getUTCMonth() + months);
  return next;
}

function occurrenceDates(input: { recurrenceType: TaskRecurrenceType; weekdays: number[]; startsAt: Date; endsAt?: Date; horizonDays: number }) {
  const horizonEnd = addDays(input.startsAt, input.horizonDays);
  const end = input.endsAt && input.endsAt < horizonEnd ? input.endsAt : horizonEnd;
  const dates: Date[] = [];

  if (input.recurrenceType === "once") return [input.startsAt];

  if (input.recurrenceType === "monthly") {
    for (let cursor = new Date(input.startsAt); cursor <= end; cursor = addMonths(cursor, 1)) dates.push(new Date(cursor));
    return dates;
  }

  const step = input.recurrenceType === "weekly" ? 7 : 1;
  for (let cursor = new Date(input.startsAt); cursor <= end; cursor = addDays(cursor, step)) {
    if (input.recurrenceType !== "weekdays" || input.weekdays.includes(cursor.getUTCDay())) dates.push(new Date(cursor));
  }
  return dates;
}

export function generateTaskOccurrences(input: {
  taskTemplateId: string;
  title: string;
  familyMemberIds: string[];
  recurrenceType: TaskRecurrenceType;
  weekdays: number[];
  startsAt: Date;
  endsAt?: Date;
  dueTime?: string;
  horizonDays?: number;
  rewards?: RewardFields;
}) {
  const dates = occurrenceDates({
    recurrenceType: input.recurrenceType,
    weekdays: input.weekdays,
    startsAt: input.startsAt,
    endsAt: input.endsAt,
    horizonDays: input.horizonDays ?? 30,
  });

  return dates.flatMap((date) => input.familyMemberIds.map((familyMemberId) => ({
    taskTemplateId: input.taskTemplateId,
    familyMemberId,
    titleSnapshot: input.title,
    dueAt: withTime(date, input.dueTime),
    drachmenReward: input.rewards?.drachmenReward ?? 0,
    xpReward: input.rewards?.xpReward ?? 0,
    moneyRewardCents: input.rewards?.moneyRewardCents ?? 0,
    badgeRewardTitle: input.rewards?.badgeRewardTitle ?? "",
    badgeRewardIcon: input.rewards?.badgeRewardIcon ?? "🏅",
  })));
}

export function groupTaskOccurrencesByStatus<T extends { status: string }>(items: T[]) {
  return kanbanStatuses.map((status) => ({
    status,
    label: taskStatusLabels[status],
    items: items.filter((item) => item.status === status),
  }));
}

export function buildTaskRewardOperations(input: {
  occurrenceId: string;
  familyMemberId: string;
  title: string;
  drachmenReward?: number | null;
  xpReward?: number | null;
  moneyRewardCents?: number | null;
  badgeRewardTitle?: string | null;
  badgeRewardIcon?: string | null;
  alreadyBooked: boolean;
}) {
  if (input.alreadyBooked) return {};
  const reason = `Aufgabe bestätigt: ${input.title}`;
  return {
    ...(input.drachmenReward && input.drachmenReward > 0 ? { pointTransaction: { familyMemberId: input.familyMemberId, points: input.drachmenReward, reason } } : {}),
    ...(input.moneyRewardCents && input.moneyRewardCents > 0 ? { moneyTransaction: { familyMemberId: input.familyMemberId, amountCents: input.moneyRewardCents, title: `Aufgabenbonus: ${input.title}` } } : {}),
    ...(input.badgeRewardTitle ? { badgeAssignment: { familyMemberId: input.familyMemberId, title: input.badgeRewardTitle, icon: input.badgeRewardIcon || "🏅", description: `Erhalten durch Aufgabe: ${input.title}` } } : {}),
    ...(input.xpReward && input.xpReward > 0 ? { xpEvent: { familyMemberId: input.familyMemberId, xp: input.xpReward, reason } } : {}),
  };
}

async function ensureMembers(familyId: string, memberIds: string[]) {
  const members = await db.familyMember.findMany({ where: { familyId, id: { in: memberIds } } });
  return members.length === new Set(memberIds).size ? members : null;
}

export async function getTasksPageData() {
  const context = await requireFamilyContext();
  const today = new Date();
  today.setUTCHours(23, 59, 59, 999);
  const [members, occurrences] = await Promise.all([
    db.familyMember.findMany({ where: { familyId: context.family.id }, orderBy: [{ role: "asc" }, { createdAt: "asc" }] }),
    db.taskOccurrence.findMany({
      where: { familyId: context.family.id },
      include: { member: true, subtasks: { orderBy: { position: "asc" } } },
      orderBy: [{ dueAt: "asc" }, { createdAt: "asc" }],
      take: 80,
    }),
  ]);
  return {
    context,
    members,
    todayOpen: occurrences.filter((item) => item.status === "open" && item.dueAt && item.dueAt <= today).slice(0, 6),
    groups: groupTaskOccurrencesByStatus(occurrences),
  };
}

export async function getNewTaskPageData() {
  const context = await requireFamilyContext();
  const members = await db.familyMember.findMany({ where: { familyId: context.family.id }, orderBy: [{ role: "asc" }, { createdAt: "asc" }] });
  return { context, members };
}

export async function createTaskTemplate(formData: FormData) {
  const context = await requireFamilyAdmin();
  const parsed = parseTaskTemplateInput(formData);
  if (isInvalidInput(parsed)) redirect("/app/tasks/new?error=invalid-task");
  const members = await ensureMembers(context.family.id, parsed.familyMemberIds);
  if (!members) redirect("/app/tasks/new?error=invalid-member");

  const template = await db.taskTemplate.create({
    data: {
      familyId: context.family.id,
      title: parsed.title,
      description: parsed.description || null,
      category: parsed.category,
      priority: parsed.priority,
      requiresConfirmation: parsed.requiresConfirmation,
      recurrenceType: parsed.recurrenceType,
      weekdays: parsed.weekdays,
      startsAt: parsed.startsAt,
      endsAt: parsed.endsAt,
      dueTime: parsed.dueTime,
      drachmenReward: parsed.drachmenReward || null,
      xpReward: parsed.xpReward || null,
      moneyRewardCents: parsed.moneyRewardCents || null,
      badgeRewardTitle: parsed.badgeRewardTitle || null,
      badgeRewardIcon: parsed.badgeRewardIcon || null,
      createdByUserId: context.user.id,
      assignments: { create: parsed.familyMemberIds.map((familyMemberId) => ({ familyMemberId })) },
      subtasks: { create: parsed.subtasks.map((title, position) => ({ title, position })) },
    },
    include: { subtasks: true },
  });

  const occurrences = generateTaskOccurrences({
    taskTemplateId: template.id,
    title: template.title,
    familyMemberIds: parsed.familyMemberIds,
    recurrenceType: parsed.recurrenceType,
    weekdays: parsed.weekdays,
    startsAt: parsed.startsAt,
    endsAt: parsed.endsAt,
    dueTime: parsed.dueTime,
    rewards: parsed,
  });

  await db.$transaction(
    occurrences.map((occurrence) => db.taskOccurrence.create({
      data: {
        familyId: context.family.id,
        ...occurrence,
        drachmenReward: occurrence.drachmenReward || null,
        xpReward: occurrence.xpReward || null,
        moneyRewardCents: occurrence.moneyRewardCents || null,
        badgeRewardTitle: occurrence.badgeRewardTitle || null,
        badgeRewardIcon: occurrence.badgeRewardTitle ? occurrence.badgeRewardIcon : null,
        subtasks: { create: parsed.subtasks.map((title, position) => ({ titleSnapshot: title, position })) },
      },
    })),
  );

  return template.id;
}

export async function updateTaskOccurrenceStatus(occurrenceId: string, status: TaskStatus) {
  const context = await requireFamilyAdmin();
  const parsed = parseTaskStatusInput(status);
  if (isInvalidInput(parsed)) redirect("/app/tasks?error=invalid-status");
  const occurrence = await db.taskOccurrence.findFirst({ where: { id: occurrenceId, familyId: context.family.id } });
  if (!occurrence) redirect("/app/tasks?error=invalid-task");

  if (status !== "confirmed") {
    await db.taskOccurrence.update({
      where: { id: occurrence.id },
      data: { status, doneAt: status === "done" ? new Date() : occurrence.doneAt },
    });
    return;
  }

  const rewards = buildTaskRewardOperations({
    occurrenceId: occurrence.id,
    familyMemberId: occurrence.familyMemberId,
    title: occurrence.titleSnapshot,
    drachmenReward: occurrence.drachmenReward,
    xpReward: occurrence.xpReward,
    moneyRewardCents: occurrence.moneyRewardCents,
    badgeRewardTitle: occurrence.badgeRewardTitle,
    badgeRewardIcon: occurrence.badgeRewardIcon,
    alreadyBooked: Boolean(occurrence.rewardBookedAt),
  });

  const writes = [
    db.taskOccurrence.update({
      where: { id: occurrence.id },
      data: { status: "confirmed", doneAt: occurrence.doneAt ?? new Date(), confirmedAt: new Date(), confirmedByUserId: context.user.id, rewardBookedAt: occurrence.rewardBookedAt ?? new Date() },
    }),
  ];

  if ("pointTransaction" in rewards && rewards.pointTransaction) {
    writes.push(db.pointTransaction.create({ data: { familyId: context.family.id, ...rewards.pointTransaction, createdByUserId: context.user.id } }) as never);
  }
  if ("badgeAssignment" in rewards && rewards.badgeAssignment) {
    writes.push(db.badgeAssignment.create({ data: { familyId: context.family.id, ...rewards.badgeAssignment, createdByUserId: context.user.id } }) as never);
  }
  if ("xpEvent" in rewards && rewards.xpEvent) {
    writes.push(db.xpTransaction.create({ data: { familyId: context.family.id, familyMemberId: rewards.xpEvent.familyMemberId, xp: rewards.xpEvent.xp, reason: rewards.xpEvent.reason, createdByUserId: context.user.id } }) as never);
  }
  if ("moneyTransaction" in rewards && rewards.moneyTransaction) {
    const account = await db.financeAccount.findUnique({ where: { familyMemberId: occurrence.familyMemberId } });
    if (account) {
      const balanceAfterCents = applyMoneyTransaction(account.balanceCents, "reward", rewards.moneyTransaction.amountCents);
      writes.push(db.financeAccount.update({ where: { id: account.id }, data: { balanceCents: balanceAfterCents } }) as never);
      writes.push(db.moneyTransaction.create({ data: { familyId: context.family.id, familyMemberId: occurrence.familyMemberId, type: "reward", title: rewards.moneyTransaction.title, amountCents: rewards.moneyTransaction.amountCents, balanceAfterCents, createdByUserId: context.user.id } }) as never);
    }
  }

  await db.$transaction(writes);
}

export { taskStatusLabels };
