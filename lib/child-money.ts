import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { MoneyDirection, MoneyOccurrenceStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { requireFamilyAdmin, requireFamilyContext } from "@/lib/family-context";
import { parseEuroToCents } from "@/lib/money";

export type ChildMoneyDirection = "INCOME" | "EXPENSE";
export type ChildMoneyOccurrenceStatus = "OPEN" | "PAID_CASH" | "TRANSFERRED" | "SAVED" | "SKIPPED";

export type ChildMoneyRuleInput = {
  id: string;
  childId: string;
  title: string;
  amountCents: number;
  direction: ChildMoneyDirection;
  destinationLabel: string | null;
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
  title: z.string().trim().min(2),
  amount: z.string().min(1),
  direction: z.enum(["INCOME", "EXPENSE"]),
  destinationLabel: z.string().trim().optional(),
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
    }));
}

export function moneyOccurrenceStatusLabel(status: ChildMoneyOccurrenceStatus | MoneyOccurrenceStatus): string {
  return statusLabels[status as ChildMoneyOccurrenceStatus];
}

export async function ensureMoneyOccurrencesForMonth(familyId: string, dueMonth = monthKey()) {
  const rules = await db.moneyRule.findMany({
    where: { familyId, active: true },
    orderBy: { createdAt: "asc" },
  });

  for (const rule of rules) {
    await db.moneyOccurrence.upsert({
      where: { ruleId_dueMonth: { ruleId: rule.id, dueMonth } },
      update: {},
      create: {
        familyId,
        ruleId: rule.id,
        childId: rule.childId,
        dueMonth,
        amountCentsSnapshot: rule.amountCents,
        titleSnapshot: rule.title,
        destinationSnapshot: rule.destinationLabel,
      },
    });
  }
}

export async function getChildMoneyOverview() {
  const context = await requireFamilyContext();
  const dueMonth = monthKey();
  await ensureMoneyOccurrencesForMonth(context.family.id, dueMonth);

  const [children, rules, occurrences] = await Promise.all([
    db.familyMember.findMany({
      where: { familyId: context.family.id, role: "child" },
      orderBy: { createdAt: "asc" },
    }),
    db.moneyRule.findMany({
      where: { familyId: context.family.id },
      include: { child: true },
      orderBy: [{ active: "desc" }, { createdAt: "asc" }],
    }),
    db.moneyOccurrence.findMany({
      where: { familyId: context.family.id, dueMonth },
      include: { child: true, rule: true },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  return { context, dueMonth, children, rules, occurrences };
}

export async function getKidsMoneyData() {
  const context = await requireFamilyContext();
  const dueMonth = monthKey();
  await ensureMoneyOccurrencesForMonth(context.family.id, dueMonth);

  const children = await db.familyMember.findMany({
    where: { familyId: context.family.id, role: "child" },
    include: {
      moneyRules: { where: { active: true, visibleToChild: true }, orderBy: { createdAt: "asc" } },
      moneyOccurrences: {
        where: { dueMonth, rule: { visibleToChild: true } },
        include: { rule: true },
        orderBy: { createdAt: "asc" },
      },
      childLedgerEntries: { orderBy: { occurredAt: "desc" }, take: 6 },
    },
    orderBy: { createdAt: "asc" },
  });

  return { dueMonth, children };
}

export async function createMoneyRule(formData: FormData) {
  const context = await requireFamilyAdmin();
  const parsed = moneyRuleSchema.safeParse({
    childId: formData.get("childId")?.toString(),
    title: formData.get("title")?.toString(),
    amount: formData.get("amount")?.toString(),
    direction: formData.get("direction")?.toString(),
    destinationLabel: formData.get("destinationLabel")?.toString(),
    visibleToChild: formData.get("visibleToChild") === "on",
  });

  if (!parsed.success) redirect("/app/finance?error=invalid-money-rule");
  const amountCents = parseEuroToCents(parsed.data.amount);
  if (amountCents === null || amountCents <= 0) redirect("/app/finance?error=invalid-amount");

  const child = await db.familyMember.findFirst({
    where: { id: parsed.data.childId, familyId: context.family.id, role: "child" },
  });
  if (!child) redirect("/app/finance?error=invalid-member");

  await db.moneyRule.create({
    data: {
      familyId: context.family.id,
      childId: child.id,
      title: parsed.data.title,
      amountCents,
      direction: parsed.data.direction as MoneyDirection,
      destinationLabel: parsed.data.destinationLabel || null,
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

  await db.moneyOccurrence.updateMany({
    where: { id: parsed.data.occurrenceId, familyId: context.family.id },
    data: {
      status: parsed.data.status as MoneyOccurrenceStatus,
      confirmedByParentId: parsed.data.status === "OPEN" ? null : context.user.id,
      confirmedAt: parsed.data.status === "OPEN" ? null : new Date(),
    },
  });
  revalidatePath("/app/finance");
  revalidatePath("/app/kids");
}
