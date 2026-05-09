import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { MoneyDirection, MoneyOccurrenceStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { requireFamilyAdmin, requireFamilyContext } from "@/lib/family-context";
import { parseEuroToCents } from "@/lib/money";
import { bookMoneyTransaction } from "@/lib/finances";

export type ChildMoneyDirection = "INCOME" | "EXPENSE";
export type ChildMoneyOccurrenceStatus = "OPEN" | "PAID_CASH" | "TRANSFERRED" | "SAVED" | "SKIPPED";

export type ChildMoneyRuleInput = {
  id: string;
  childId: string;
  title: string;
  amountCents: number;
  direction: ChildMoneyDirection;
  destinationLabel: string | null;
  financeAccountId?: string | null;
  autoConfirm?: boolean;
  visibleToChild: boolean;
  active: boolean;
};

export type PreparedMoneyOccurrence = {
  ruleId: string;
  childId: string;
  dueMonth: string;
  amountCentsSnapshot: number;
  titleSnapshot: string;
  destinationSnapshot: string | null;
  financeAccountIdSnapshot: string | null;
  autoConfirmSnapshot: boolean;
};

const statusLabels: Record<ChildMoneyOccurrenceStatus, string> = {
  OPEN: "Noch offen",
  PAID_CASH: "Bar ausgezahlt",
  TRANSFERRED: "Überwiesen",
  SAVED: "Gespart / zurückgelegt",
  SKIPPED: "Ausgelassen",
};

const moneyRuleSchema = z.object({
  childId: z.string().min(1),
  financeAccountId: z.string().optional(),
  title: z.string().trim().min(2),
  amount: z.string().min(1),
  direction: z.enum(["INCOME", "EXPENSE"]),
  destinationLabel: z.string().trim().optional(),
  autoConfirm: z.boolean(),
  visibleToChild: z.boolean(),
});

const occurrenceStatusSchema = z.object({
  occurrenceId: z.string().min(1),
  status: z.enum(["OPEN", "PAID_CASH", "TRANSFERRED", "SAVED", "SKIPPED"]),
});

export function monthKey(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

export function signedRuleAmount(rule: Pick<ChildMoneyRuleInput, "amountCents" | "direction">): number {
  return rule.direction === "EXPENSE" ? -rule.amountCents : rule.amountCents;
}

export function visibleChildMoneyRules<T extends Pick<ChildMoneyRuleInput, "visibleToChild" | "active">>(rules: T[]): T[] {
  return rules.filter((rule) => rule.active && rule.visibleToChild);
}

export function sumChildMoneyRules(rules: Pick<ChildMoneyRuleInput, "amountCents" | "direction">[]): number {
  return rules.reduce((sum, rule) => sum + signedRuleAmount(rule), 0);
}

export function prepareMoneyOccurrencesForMonth(
  rules: ChildMoneyRuleInput[],
  dueMonth: string,
): PreparedMoneyOccurrence[] {
  return rules
    .filter((rule) => rule.active)
    .map((rule) => ({
      ruleId: rule.id,
      childId: rule.childId,
      dueMonth,
      amountCentsSnapshot: rule.amountCents,
      titleSnapshot: rule.title,
      destinationSnapshot: rule.destinationLabel,
      financeAccountIdSnapshot: rule.financeAccountId ?? null,
      autoConfirmSnapshot: rule.autoConfirm ?? false,
    }));
}

export function moneyOccurrenceStatusLabel(status: ChildMoneyOccurrenceStatus | MoneyOccurrenceStatus): string {
  return statusLabels[status as ChildMoneyOccurrenceStatus];
}

async function bookOccurrenceIfNeeded(occurrenceId: string, userId: string) {
  const occurrence = await db.moneyOccurrence.findUnique({
    where: { id: occurrenceId },
    include: { rule: true },
  });
  if (!occurrence || occurrence.bookedTransactionId || !occurrence.financeAccountIdSnapshot || occurrence.status === "OPEN" || occurrence.status === "SKIPPED") return;

  const transaction = await bookMoneyTransaction({
    familyId: occurrence.familyId,
    userId,
    accountId: occurrence.financeAccountIdSnapshot,
    type: occurrence.rule.direction === "EXPENSE" ? "loan" : "allowance",
    title: occurrence.titleSnapshot,
    amountCents: occurrence.amountCentsSnapshot,
  });
  if (!transaction) return;
  await db.moneyOccurrence.update({
    where: { id: occurrence.id },
    data: { bookedTransactionId: transaction.id },
  });
}

export async function ensureMoneyOccurrencesForMonth(familyId: string, dueMonth = monthKey()) {
  const rules = await db.moneyRule.findMany({
    where: { familyId, active: true },
    orderBy: { createdAt: "asc" },
  });

  for (const rule of rules) {
    const occurrence = await db.moneyOccurrence.upsert({
      where: { ruleId_dueMonth: { ruleId: rule.id, dueMonth } },
      update: {},
      create: {
        familyId,
        ruleId: rule.id,
        childId: rule.childId,
        financeAccountIdSnapshot: rule.financeAccountId,
        dueMonth,
        amountCentsSnapshot: rule.amountCents,
        titleSnapshot: rule.title,
        destinationSnapshot: rule.destinationLabel,
        autoConfirmSnapshot: rule.autoConfirm,
        status: rule.autoConfirm ? "TRANSFERRED" : "OPEN",
        confirmedByParentId: rule.autoConfirm ? rule.createdByUserId : null,
        confirmedAt: rule.autoConfirm ? new Date() : null,
      },
    });
    if (occurrence.autoConfirmSnapshot) await bookOccurrenceIfNeeded(occurrence.id, rule.createdByUserId);
  }
}

export async function getChildMoneyOverview() {
  const context = await requireFamilyContext();
  const dueMonth = monthKey();
  await ensureMoneyOccurrencesForMonth(context.family.id, dueMonth);

  const [children, rules, occurrences, accounts] = await Promise.all([
    db.familyMember.findMany({
      where: { familyId: context.family.id, role: "child" },
      include: {
        childLedgerEntries: {
          where: { visibility: "PARENT_VISIBLE" },
          include: { account: true },
          orderBy: { occurredAt: "desc" },
          take: 8,
        },
      },
      orderBy: { createdAt: "asc" },
    }),
    db.moneyRule.findMany({
      where: { familyId: context.family.id },
      include: { child: true, account: true },
      orderBy: [{ active: "desc" }, { createdAt: "asc" }],
    }),
    db.moneyOccurrence.findMany({
      where: { familyId: context.family.id, dueMonth },
      include: { child: true, rule: true, bookedTransaction: true },
      orderBy: { createdAt: "asc" },
    }),
    db.financeAccount.findMany({
      where: { familyId: context.family.id, member: { role: "child" } },
      include: { member: true },
      orderBy: [{ member: { createdAt: "asc" } }, { isDefault: "desc" }, { createdAt: "asc" }],
    }),
  ]);

  return { context, dueMonth, children, rules, occurrences, accounts };
}

export async function getKidsMoneyData() {
  const context = await requireFamilyContext();
  const dueMonth = monthKey();
  await ensureMoneyOccurrencesForMonth(context.family.id, dueMonth);

  const children = await db.familyMember.findMany({
    where: { familyId: context.family.id, role: "child" },
    include: {
      financeAccounts: { orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }] },
      moneyRules: { where: { active: true, visibleToChild: true }, include: { account: true }, orderBy: { createdAt: "asc" } },
      moneyOccurrences: {
        where: { dueMonth, rule: { visibleToChild: true } },
        include: { rule: true, bookedTransaction: true },
        orderBy: { createdAt: "asc" },
      },
      childLedgerEntries: { include: { account: true }, orderBy: { occurredAt: "desc" }, take: 6 },
    },
    orderBy: { createdAt: "asc" },
  });

  return { dueMonth, children };
}

export async function createMoneyRule(formData: FormData) {
  const context = await requireFamilyAdmin();
  const parsed = moneyRuleSchema.safeParse({
    childId: formData.get("childId")?.toString(),
    financeAccountId: formData.get("financeAccountId")?.toString(),
    title: formData.get("title")?.toString(),
    amount: formData.get("amount")?.toString(),
    direction: formData.get("direction")?.toString(),
    destinationLabel: formData.get("destinationLabel")?.toString(),
    autoConfirm: formData.get("autoConfirm") === "on",
    visibleToChild: formData.get("visibleToChild") === "on",
  });

  if (!parsed.success) redirect("/app/finance?error=invalid-money-rule");
  const amountCents = parseEuroToCents(parsed.data.amount);
  if (amountCents === null || amountCents <= 0) redirect("/app/finance?error=invalid-amount");

  const child = await db.familyMember.findFirst({
    where: { id: parsed.data.childId, familyId: context.family.id, role: "child" },
  });
  if (!child) redirect("/app/finance?error=invalid-member");

  const account = parsed.data.financeAccountId
    ? await db.financeAccount.findFirst({ where: { id: parsed.data.financeAccountId, familyId: context.family.id, familyMemberId: child.id } })
    : null;
  if (parsed.data.financeAccountId && !account) redirect("/app/finance?error=invalid-account");

  await db.moneyRule.create({
    data: {
      familyId: context.family.id,
      childId: child.id,
      financeAccountId: account?.id ?? null,
      title: parsed.data.title,
      amountCents,
      direction: parsed.data.direction as MoneyDirection,
      destinationLabel: parsed.data.destinationLabel || account?.name || null,
      autoConfirm: parsed.data.autoConfirm,
      visibleToChild: parsed.data.visibleToChild,
      createdByUserId: context.user.id,
    },
  });

  await ensureMoneyOccurrencesForMonth(context.family.id, monthKey());
  revalidatePath("/app/finance");
  revalidatePath("/app/kids");
}

export async function deactivateMoneyRule(ruleId: string) {
  const context = await requireFamilyAdmin();
  await db.moneyRule.updateMany({
    where: { id: ruleId, familyId: context.family.id },
    data: { active: false },
  });
  revalidatePath("/app/finance");
  revalidatePath("/app/kids");
}

export async function markMoneyOccurrenceStatus(formData: FormData) {
  const context = await requireFamilyAdmin();
  const parsed = occurrenceStatusSchema.safeParse({
    occurrenceId: formData.get("occurrenceId")?.toString(),
    status: formData.get("status")?.toString(),
  });
  if (!parsed.success) redirect("/app/finance?error=invalid-money-status");

  const occurrence = await db.moneyOccurrence.update({
    where: { id: parsed.data.occurrenceId, familyId: context.family.id },
    data: {
      status: parsed.data.status as MoneyOccurrenceStatus,
      confirmedByParentId: parsed.data.status === "OPEN" ? null : context.user.id,
      confirmedAt: parsed.data.status === "OPEN" ? null : new Date(),
    },
  });
  if (parsed.data.status !== "OPEN") await bookOccurrenceIfNeeded(occurrence.id, context.user.id);
  revalidatePath("/app/finance");
  revalidatePath("/app/kids");
}
