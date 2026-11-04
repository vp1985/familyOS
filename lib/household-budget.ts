import { redirect } from "next/navigation";
import { z } from "zod";
import type { HouseholdBudgetDirection, HouseholdBudgetKind } from "@prisma/client";
import { db } from "@/lib/db";
import { requireFamilyAdmin } from "@/lib/family-context";
import { parseEuroToCents } from "@/lib/money";

export const householdBudgetCategorySuggestions = [
  "Gehalt",
  "Kindergeld",
  "Miete",
  "Strom",
  "Heizung",
  "Versicherung",
  "Lebensmittel",
  "Tanken",
  "Kleidung",
  "Freizeit",
  "Sparen",
  "Schulden",
];

const planItemInputSchema = z.object({
  title: z.string().trim().min(2).max(80),
  category: z.string().trim().min(2).max(40),
  amount: z.string().min(1),
  direction: z.enum(["INCOME", "EXPENSE"]),
  kind: z.enum(["FIXED", "VARIABLE", "SAVING", "DEBT", "OTHER"]),
});

const entryInputSchema = z.object({
  planItemId: z.string().optional(),
  title: z.string().trim().min(2).max(80),
  category: z.string().trim().min(2).max(40),
  amount: z.string().min(1),
  direction: z.enum(["INCOME", "EXPENSE"]),
  occurredAt: z.string().optional(),
});

export function budgetMonthKey(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", { year: "numeric", month: "2-digit", timeZone: "Europe/Berlin" }).formatToParts(date);
  const year = parts.find((part) => part.type === "year")?.value ?? date.getFullYear().toString();
  const month = parts.find((part) => part.type === "month")?.value ?? String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

export function parseBudgetMonth(value: string | undefined | null) {
  if (!value || !/^\d{4}-\d{2}$/.test(value)) return budgetMonthKey();
  return value;
}

export function householdBudgetDirectionLabel(direction: HouseholdBudgetDirection) {
  return direction === "INCOME" ? "Einnahme" : "Ausgabe";
}

export function householdBudgetKindLabel(kind: HouseholdBudgetKind) {
  const labels: Record<HouseholdBudgetKind, string> = {
    FIXED: "Fixkosten",
    VARIABLE: "Variabel",
    SAVING: "Sparen",
    DEBT: "Schulden",
    OTHER: "Sonstiges",
  };
  return labels[kind];
}

export function sumBudgetAmounts(items: Array<{ amountCents: number; direction: HouseholdBudgetDirection }>) {
  return items.reduce(
    (sum, item) => sum + (item.direction === "INCOME" ? item.amountCents : -item.amountCents),
    0,
  );
}

export function summarizeHouseholdBudget(input: {
  planItems: Array<{ amountCents: number; direction: HouseholdBudgetDirection }>;
  entries: Array<{ amountCents: number; direction: HouseholdBudgetDirection }>;
}) {
  const plannedIncomeCents = input.planItems.filter((item) => item.direction === "INCOME").reduce((sum, item) => sum + item.amountCents, 0);
  const plannedExpenseCents = input.planItems.filter((item) => item.direction === "EXPENSE").reduce((sum, item) => sum + item.amountCents, 0);
  const actualIncomeCents = input.entries.filter((item) => item.direction === "INCOME").reduce((sum, item) => sum + item.amountCents, 0);
  const actualExpenseCents = input.entries.filter((item) => item.direction === "EXPENSE").reduce((sum, item) => sum + item.amountCents, 0);
  return {
    plannedIncomeCents,
    plannedExpenseCents,
    plannedBalanceCents: plannedIncomeCents - plannedExpenseCents,
    actualIncomeCents,
    actualExpenseCents,
    actualBalanceCents: actualIncomeCents - actualExpenseCents,
    remainingExpenseBudgetCents: plannedExpenseCents - actualExpenseCents,
  };
}

export async function getHouseholdBudgetData(month?: string) {
  const context = await requireFamilyAdmin();
  const selectedMonth = parseBudgetMonth(month);
  const [planItems, entries] = await Promise.all([
    db.householdBudgetPlanItem.findMany({
      where: { familyId: context.family.id, active: true },
      orderBy: [{ direction: "asc" }, { kind: "asc" }, { category: "asc" }, { createdAt: "asc" }],
    }),
    db.householdBudgetEntry.findMany({
      where: { familyId: context.family.id, monthKey: selectedMonth },
      include: { planItem: true },
      orderBy: { occurredAt: "desc" },
    }),
  ]);
  return {
    context,
    month: selectedMonth,
    planItems,
    entries,
    summary: summarizeHouseholdBudget({ planItems, entries }),
  };
}

export async function createHouseholdBudgetPlanItem(formData: FormData) {
  const context = await requireFamilyAdmin();
  const parsed = planItemInputSchema.safeParse({
    title: formData.get("title")?.toString(),
    category: formData.get("category")?.toString(),
    amount: formData.get("amount")?.toString(),
    direction: formData.get("direction")?.toString(),
    kind: formData.get("kind")?.toString(),
  });
  if (!parsed.success) redirect("/app/budget?error=invalid-plan-item");
  const amountCents = parseEuroToCents(parsed.data.amount);
  if (!amountCents || amountCents <= 0) redirect("/app/budget?error=invalid-amount");

  await db.householdBudgetPlanItem.create({
    data: {
      familyId: context.family.id,
      title: parsed.data.title,
      category: parsed.data.category,
      amountCents,
      direction: parsed.data.direction,
      kind: parsed.data.kind,
      createdByUserId: context.user.id,
    },
  });
}

export async function deactivateHouseholdBudgetPlanItem(itemId: string) {
  const context = await requireFamilyAdmin();
  await db.householdBudgetPlanItem.updateMany({
    where: { id: itemId, familyId: context.family.id },
    data: { active: false },
  });
}

export async function createHouseholdBudgetEntry(formData: FormData) {
  const context = await requireFamilyAdmin();
  const parsed = entryInputSchema.safeParse({
    planItemId: formData.get("planItemId")?.toString() || undefined,
    title: formData.get("title")?.toString(),
    category: formData.get("category")?.toString(),
    amount: formData.get("amount")?.toString(),
    direction: formData.get("direction")?.toString(),
    occurredAt: formData.get("occurredAt")?.toString(),
  });
  if (!parsed.success) redirect("/app/budget?error=invalid-entry");
  const amountCents = parseEuroToCents(parsed.data.amount);
  if (!amountCents || amountCents <= 0) redirect("/app/budget?error=invalid-amount");

  let planItem = null;
  if (parsed.data.planItemId) {
    planItem = await db.householdBudgetPlanItem.findFirst({ where: { id: parsed.data.planItemId, familyId: context.family.id } });
    if (!planItem) redirect("/app/budget?error=invalid-plan-item");
  }

  const occurredAt = parsed.data.occurredAt ? new Date(`${parsed.data.occurredAt}T12:00:00`) : new Date();
  if (Number.isNaN(occurredAt.getTime())) redirect("/app/budget?error=invalid-date");

  await db.householdBudgetEntry.create({
    data: {
      familyId: context.family.id,
      planItemId: planItem?.id,
      title: parsed.data.title,
      category: parsed.data.category,
      amountCents,
      direction: parsed.data.direction,
      monthKey: budgetMonthKey(occurredAt),
      occurredAt,
      createdByUserId: context.user.id,
    },
  });
}
