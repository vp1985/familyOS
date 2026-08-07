import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireFamilyAdmin } from "@/lib/family-context";
import { parseEuroToCents } from "@/lib/money";

const projectInputSchema = z.object({
  title: z.string().trim().min(2),
  description: z.string().trim().optional(),
  participantIds: z.array(z.string().min(1)).min(1),
});

const expenseInputSchema = z.object({
  title: z.string().trim().min(2),
  description: z.string().trim().optional(),
  amount: z.string().min(1),
  paidByMemberId: z.string().min(1),
  shareMemberIds: z.array(z.string().min(1)).min(1),
});

const projectGuestInputSchema = z.object({
  contactIds: z.array(z.string().min(1)).min(1),
});

type InvalidInput = { success: false };

export type ParsedProjectInput = {
  title: string;
  description: string;
  participantIds: string[];
};

export type ParsedExpenseInput = {
  title: string;
  description: string;
  amountCents: number;
  paidByMemberId: string;
  shareMemberIds: string[];
};

export type ParsedProjectGuestInput = {
  contactIds: string[];
};

type ProjectGuestPreference = {
  category: string;
  label: string;
  sentiment: string;
  isFavorite: boolean;
};

export type ProjectGuestPreferenceSummaryEntry = {
  label: string;
  sentiment: string;
  contactNames: string[];
  isFavorite: boolean;
  isSafetyHint: boolean;
};

export type ProjectGuestPreferenceSummaryGroup = {
  category: string;
  entries: ProjectGuestPreferenceSummaryEntry[];
};

export type ProjectGuestWithPreferences = {
  contact: {
    name: string;
    preferences: ProjectGuestPreference[];
  };
};

export type ProjectBalanceMember = {
  id: string;
  name: string;
};

export type ProjectBalanceExpense = {
  id: string;
  status: "active" | "voided";
  amountCents: number;
  paidByMemberId: string;
  shares: Array<{ familyMemberId: string; shareCents: number }>;
};

export type ProjectSettlementSuggestion = {
  fromMemberId: string;
  fromName: string;
  toMemberId: string;
  toName: string;
  amountCents: number;
};

export type ProjectBalanceRow = {
  familyMemberId: string;
  name: string;
  paidCents: number;
  owedShareCents: number;
  netCents: number;
};

function uniqueIds(ids: string[]) {
  return Array.from(new Set(ids.map((id) => id.trim()).filter(Boolean)));
}

function invalid(): InvalidInput {
  return { success: false };
}

export function isInvalidInput<T>(input: T | InvalidInput): input is InvalidInput {
  return typeof input === "object" && input !== null && "success" in input && input.success === false;
}

export function parseProjectInput(input: {
  title?: string;
  description?: string;
  participantIds?: string[];
}): ParsedProjectInput | InvalidInput {
  const parsed = projectInputSchema.safeParse({
    title: input.title,
    description: input.description,
    participantIds: uniqueIds(input.participantIds ?? []),
  });

  if (!parsed.success) return invalid();

  return {
    title: parsed.data.title,
    description: parsed.data.description ?? "",
    participantIds: parsed.data.participantIds,
  };
}

export function parseExpenseInput(input: {
  title?: string;
  description?: string;
  amount?: string;
  paidByMemberId?: string;
  shareMemberIds?: string[];
}): ParsedExpenseInput | InvalidInput {
  const parsed = expenseInputSchema.safeParse({
    title: input.title,
    description: input.description,
    amount: input.amount,
    paidByMemberId: input.paidByMemberId,
    shareMemberIds: uniqueIds(input.shareMemberIds ?? []),
  });

  if (!parsed.success) return invalid();

  const amountCents = parseEuroToCents(parsed.data.amount);

  if (amountCents === null || amountCents <= 0) return invalid();

  return {
    title: parsed.data.title,
    description: parsed.data.description ?? "",
    amountCents,
    paidByMemberId: parsed.data.paidByMemberId,
    shareMemberIds: parsed.data.shareMemberIds,
  };
}

export function parseProjectGuestInput(input: { contactIds?: string[] }): ParsedProjectGuestInput | InvalidInput {
  const parsed = projectGuestInputSchema.safeParse({
    contactIds: uniqueIds(input.contactIds ?? []),
  });

  if (!parsed.success) return invalid();

  return { contactIds: parsed.data.contactIds };
}

export function buildProjectGuestPreferenceSummary(guests: ProjectGuestWithPreferences[]): ProjectGuestPreferenceSummaryGroup[] {
  const entriesByKey = new Map<string, ProjectGuestPreferenceSummaryEntry & { category: string }>();

  for (const guest of guests) {
    const contactName = guest.contact.name.trim();
    if (!contactName) continue;

    for (const preference of guest.contact.preferences) {
      const label = preference.label.trim();
      if (!label) continue;

      const isSafetyHint = preference.category === "ALLERGY" || preference.category === "MEDICAL_NOTE";
      const sentiment = isSafetyHint ? "NOTE" : preference.sentiment;
      const key = `${preference.category}::${sentiment}::${label.toLocaleLowerCase("de-DE")}`;
      const existing = entriesByKey.get(key);

      if (existing) {
        if (!existing.contactNames.includes(contactName)) existing.contactNames.push(contactName);
        existing.isFavorite = existing.isFavorite || preference.isFavorite;
        continue;
      }

      entriesByKey.set(key, {
        category: preference.category,
        label,
        sentiment,
        contactNames: [contactName],
        isFavorite: preference.isFavorite,
        isSafetyHint,
      });
    }
  }

  const categoryOrder = ["ALLERGY", "MEDICAL_NOTE", "DRINK", "FOOD", "HOBBY", "GIFT_IDEA", "OTHER"];
  const groupsByCategory = new Map<string, ProjectGuestPreferenceSummaryEntry[]>();

  for (const entry of entriesByKey.values()) {
    const { category, ...summaryEntry } = entry;
    const groupEntries = groupsByCategory.get(category) ?? [];
    groupEntries.push({
      ...summaryEntry,
      contactNames: [...summaryEntry.contactNames].sort((a, b) => a.localeCompare(b, "de-DE")),
    });
    groupsByCategory.set(category, groupEntries);
  }

  return Array.from(groupsByCategory.entries())
    .map(([category, entries]) => ({
      category,
      entries: entries.sort((a, b) => Number(b.isSafetyHint) - Number(a.isSafetyHint) || Number(b.isFavorite) - Number(a.isFavorite) || a.label.localeCompare(b.label, "de-DE")),
    }))
    .sort((a, b) => categoryOrder.indexOf(a.category) - categoryOrder.indexOf(b.category));
}

export function splitEvenly(amountCents: number, familyMemberIds: string[]) {
  const ids = uniqueIds(familyMemberIds);
  if (amountCents <= 0 || ids.length === 0) return [];

  const baseShare = Math.floor(amountCents / ids.length);
  const remainder = amountCents % ids.length;

  return ids.map((familyMemberId, index) => ({
    familyMemberId,
    shareCents: baseShare + (index < remainder ? 1 : 0),
  }));
}

export function calculateProjectBalance({
  members,
  expenses,
}: {
  members: ProjectBalanceMember[];
  expenses: ProjectBalanceExpense[];
}) {
  const rowsByMember = new Map<string, ProjectBalanceRow>();

  for (const member of members) {
    rowsByMember.set(member.id, {
      familyMemberId: member.id,
      name: member.name,
      paidCents: 0,
      owedShareCents: 0,
      netCents: 0,
    });
  }

  let totalCents = 0;

  for (const expense of expenses) {
    if (expense.status !== "active") continue;

    totalCents += expense.amountCents;
    const payerRow = rowsByMember.get(expense.paidByMemberId);
    if (payerRow) payerRow.paidCents += expense.amountCents;

    for (const share of expense.shares) {
      const row = rowsByMember.get(share.familyMemberId);
      if (row) row.owedShareCents += share.shareCents;
    }
  }

  const rows = members.map((member) => {
    const row = rowsByMember.get(member.id)!;
    return {
      ...row,
      netCents: row.paidCents - row.owedShareCents,
    };
  });

  return { totalCents, rows };
}

export function buildProjectSettlementSuggestions(rows: ProjectBalanceRow[]): ProjectSettlementSuggestion[] {
  const debtors = rows
    .filter((row) => row.netCents < 0)
    .map((row) => ({ ...row, remainingCents: Math.abs(row.netCents) }))
    .sort((a, b) => b.remainingCents - a.remainingCents || a.name.localeCompare(b.name));
  const creditors = rows
    .filter((row) => row.netCents > 0)
    .map((row) => ({ ...row, remainingCents: row.netCents }))
    .sort((a, b) => b.remainingCents - a.remainingCents || a.name.localeCompare(b.name));

  const suggestions: ProjectSettlementSuggestion[] = [];
  let debtorIndex = 0;
  let creditorIndex = 0;

  while (debtorIndex < debtors.length && creditorIndex < creditors.length) {
    const debtor = debtors[debtorIndex];
    const creditor = creditors[creditorIndex];
    const amountCents = Math.min(debtor.remainingCents, creditor.remainingCents);

    if (amountCents > 0) {
      suggestions.push({
        fromMemberId: debtor.familyMemberId,
        fromName: debtor.name,
        toMemberId: creditor.familyMemberId,
        toName: creditor.name,
        amountCents,
      });
    }

    debtor.remainingCents -= amountCents;
    creditor.remainingCents -= amountCents;
    if (debtor.remainingCents === 0) debtorIndex += 1;
    if (creditor.remainingCents === 0) creditorIndex += 1;
  }

  return suggestions;
}

export async function getProjectList() {
  const context = await requireFamilyAdmin();
  const projects = await db.project.findMany({
    where: { familyId: context.family.id },
    include: {
      participants: { include: { member: true } },
      expenses: { where: { status: "active" }, include: { shares: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return { context, projects };
}

export async function getProjectFormData() {
  const context = await requireFamilyAdmin();
  const members = await db.familyMember.findMany({
    where: { familyId: context.family.id },
    orderBy: [{ role: "asc" }, { createdAt: "asc" }],
  });

  return { context, members };
}

export async function getProjectDetail(projectId: string) {
  const context = await requireFamilyAdmin();
  const project = await db.project.findFirst({
    where: { id: projectId, familyId: context.family.id },
    include: {
      planningEvent: { select: { id: true } },
      participants: { include: { member: true }, orderBy: { createdAt: "asc" } },
      relationshipGuests: {
        include: { contact: { include: { preferences: true } } },
        orderBy: { createdAt: "asc" },
      },
      expenses: {
        include: { paidByMember: true, shares: { include: { member: true } } },
        orderBy: { expenseDate: "desc" },
      },
      settlements: {
        include: { fromMember: true, toMember: true },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!project) redirect("/app/projects?error=not-found");

  const availableRelationshipContacts = await db.relationshipContact.findMany({
    where: { familyId: context.family.id },
    orderBy: [{ name: "asc" }, { createdAt: "asc" }],
  });

  const guestPreferenceSummary = buildProjectGuestPreferenceSummary(project.relationshipGuests);

  const members = project.participants.map((participant) => ({
    id: participant.member.id,
    name: participant.member.name,
  }));
  const balance = calculateProjectBalance({
    members,
    expenses: project.expenses.map((expense) => ({
      id: expense.id,
      status: expense.status,
      amountCents: expense.amountCents,
      paidByMemberId: expense.paidByMemberId,
      shares: expense.shares.map((share) => ({
        familyMemberId: share.familyMemberId,
        shareCents: share.shareCents,
      })),
    })),
  });

  const settlementSuggestions = buildProjectSettlementSuggestions(balance.rows);

  return { context, project, balance, settlementSuggestions, availableRelationshipContacts, guestPreferenceSummary };
}

async function getFamilyScopedProjectWithBalance(projectId: string, familyId: string) {
  const project = await db.project.findFirst({
    where: { id: projectId, familyId },
    include: {
      participants: { include: { member: true }, orderBy: { createdAt: "asc" } },
      expenses: { include: { shares: true } },
    },
  });

  if (!project) return null;

  const balance = calculateProjectBalance({
    members: project.participants.map((participant) => ({ id: participant.member.id, name: participant.member.name })),
    expenses: project.expenses.map((expense) => ({
      id: expense.id,
      status: expense.status,
      amountCents: expense.amountCents,
      paidByMemberId: expense.paidByMemberId,
      shares: expense.shares.map((share) => ({ familyMemberId: share.familyMemberId, shareCents: share.shareCents })),
    })),
  });

  return { project, balance };
}

export async function createProjectSettlementPlan(projectId: string) {
  const context = await requireFamilyAdmin();
  const detail = await getFamilyScopedProjectWithBalance(projectId, context.family.id);
  if (!detail) redirect("/app/projects?error=not-found");

  const existingOpen = await db.projectSettlement.count({
    where: { projectId, familyId: context.family.id, status: "open" },
  });
  if (existingOpen > 0) return;

  const suggestions = buildProjectSettlementSuggestions(detail.balance.rows);
  if (suggestions.length === 0) return;

  await db.projectSettlement.createMany({
    data: suggestions.map((suggestion) => ({
      familyId: context.family.id,
      projectId: detail.project.id,
      fromMemberId: suggestion.fromMemberId,
      toMemberId: suggestion.toMemberId,
      amountCents: suggestion.amountCents,
      createdByUserId: context.user.id,
    })),
  });
}

export async function settleProjectSettlement(projectId: string, settlementId: string) {
  const context = await requireFamilyAdmin();
  const settlement = await db.projectSettlement.findFirst({
    where: { id: settlementId, projectId, familyId: context.family.id },
    select: { id: true },
  });

  if (!settlement) redirect(`/app/projects/${projectId}?error=settlement-not-found`);

  await db.projectSettlement.update({
    where: { id: settlement.id },
    data: { status: "settled", settledAt: new Date() },
  });
}

export async function createProject(formData: FormData) {
  const context = await requireFamilyAdmin();
  const parsed = parseProjectInput({
    title: formData.get("title")?.toString(),
    description: formData.get("description")?.toString(),
    participantIds: formData.getAll("participantIds").map(String),
  });

  if (isInvalidInput(parsed)) redirect("/app/projects/new?error=invalid-project");

  const memberCount = await db.familyMember.count({
    where: { familyId: context.family.id, id: { in: parsed.participantIds } },
  });

  if (memberCount !== parsed.participantIds.length) redirect("/app/projects/new?error=invalid-participants");

  const project = await db.project.create({
    data: {
      familyId: context.family.id,
      title: parsed.title,
      description: parsed.description || null,
      createdByUserId: context.user.id,
      participants: {
        create: parsed.participantIds.map((familyMemberId) => ({ familyMemberId })),
      },
    },
  });

  return project.id;
}

export async function voidProjectExpense(projectId: string, expenseId: string) {
  const context = await requireFamilyAdmin();
  const expense = await db.projectExpense.findFirst({
    where: {
      id: expenseId,
      projectId,
      familyId: context.family.id,
    },
    select: { id: true },
  });

  if (!expense) redirect(`/app/projects/${projectId}?error=expense-not-found`);

  await db.projectExpense.update({
    where: { id: expense.id },
    data: { status: "voided" },
  });
}

export async function updateProjectStatus(projectId: string, status: "active" | "done" | "archived") {
  const context = await requireFamilyAdmin();
  const project = await db.project.findFirst({
    where: { id: projectId, familyId: context.family.id },
    select: { id: true, planningEvent: { select: { id: true } } },
  });

  if (!project) redirect("/app/projects?error=not-found");

  await db.$transaction(async (tx) => {
    if (project.planningEvent) {
      await tx.planningEvent.update({
        where: { id: project.planningEvent.id },
        data: { status: status === "active" ? "ACTIVE" : status === "done" ? "DONE" : "ARCHIVED" },
      });
    }
    await tx.project.update({
      where: { id: project.id },
      data: { status },
    });
  });
}

export async function addProjectGuests(projectId: string, formData: FormData) {
  const context = await requireFamilyAdmin();
  const parsed = parseProjectGuestInput({ contactIds: formData.getAll("contactIds").map(String) });

  if (isInvalidInput(parsed)) redirect(`/app/projects/${projectId}?error=invalid-guests`);

  const [project, validContactCount] = await Promise.all([
    db.project.findFirst({ where: { id: projectId, familyId: context.family.id }, select: { id: true } }),
    db.relationshipContact.count({ where: { familyId: context.family.id, id: { in: parsed.contactIds } } }),
  ]);

  if (!project) redirect("/app/projects?error=not-found");
  if (validContactCount !== parsed.contactIds.length) redirect(`/app/projects/${projectId}?error=invalid-guests`);

  await db.projectGuest.createMany({
    data: parsed.contactIds.map((contactId) => ({
      familyId: context.family.id,
      projectId: project.id,
      contactId,
      createdByUserId: context.user.id,
    })),
    skipDuplicates: true,
  });
}

export async function createProjectExpense(projectId: string, formData: FormData) {
  const context = await requireFamilyAdmin();
  const parsed = parseExpenseInput({
    title: formData.get("title")?.toString(),
    description: formData.get("description")?.toString(),
    amount: formData.get("amount")?.toString(),
    paidByMemberId: formData.get("paidByMemberId")?.toString(),
    shareMemberIds: formData.getAll("shareMemberIds").map(String),
  });

  if (isInvalidInput(parsed)) redirect(`/app/projects/${projectId}/expenses/new?error=invalid-expense`);

  const project = await db.project.findFirst({
    where: { id: projectId, familyId: context.family.id },
    include: { participants: true },
  });

  if (!project) redirect("/app/projects?error=not-found");

  const projectParticipantIds = new Set(project.participants.map((participant) => participant.familyMemberId));
  const allMemberIds = uniqueIds([parsed.paidByMemberId, ...parsed.shareMemberIds]);
  const membersInFamily = await db.familyMember.findMany({
    where: { familyId: context.family.id, id: { in: allMemberIds } },
    select: { id: true },
  });
  const familyMemberIds = new Set(membersInFamily.map((member) => member.id));

  const validMembers = allMemberIds.every((id) => familyMemberIds.has(id));
  const validParticipants = parsed.shareMemberIds.every((id) => projectParticipantIds.has(id));

  if (!validMembers || !validParticipants) {
    redirect(`/app/projects/${projectId}/expenses/new?error=invalid-members`);
  }

  const shares = splitEvenly(parsed.amountCents, parsed.shareMemberIds);
  const shareTotal = shares.reduce((sum, share) => sum + share.shareCents, 0);
  if (shareTotal !== parsed.amountCents) {
    redirect(`/app/projects/${projectId}/expenses/new?error=invalid-split`);
  }

  await db.projectExpense.create({
    data: {
      familyId: context.family.id,
      projectId: project.id,
      title: parsed.title,
      description: parsed.description || null,
      amountCents: parsed.amountCents,
      paidByMemberId: parsed.paidByMemberId,
      createdByUserId: context.user.id,
      shares: {
        create: shares.map((share) => ({
          familyMemberId: share.familyMemberId,
          shareCents: share.shareCents,
        })),
      },
    },
  });
}
