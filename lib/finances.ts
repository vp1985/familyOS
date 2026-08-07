import { redirect } from "next/navigation";
import { z } from "zod";
import type { FinanceAccountKind, MoneyTransactionType as PrismaMoneyTransactionType } from "@prisma/client";
import { db } from "@/lib/db";
import { requireFamilyAdmin, requireFamilyAdminOrChild } from "@/lib/family-context";
import { canAccessChildMember } from "@/lib/family-access-policy";
import { applyMoneyTransaction, formatCents, parseEuroToCents } from "@/lib/money";

const transactionInputSchema = z.object({
  financeAccountId: z.string().min(1),
  type: z.enum(["allowance", "loan", "repayment", "adjustment"]),
  title: z.string().trim().min(2).optional(),
  amount: z.string().min(1),
});

const accountInputSchema = z.object({
  familyMemberId: z.string().min(1),
  name: z.string().trim().min(2),
  kind: z.enum(["CASH", "GIRO", "SAVINGS", "DAY_MONEY", "HOME_SAVINGS", "OTHER"]),
  openingBalance: z.string().optional(),
  childCanBook: z.boolean(),
});

const childCashSettingsSchema = z.object({
  childId: z.string().min(1),
  childCanCreateCashAccounts: z.boolean(),
  childCashAccountLimit: z.coerce.number().int().min(0).max(10),
});

export const childCashAccountNameSuggestions = ["Führerschein", "Fahrrad", "Handy", "Urlaub", "Geschenke", "Spielzeug", "Bücher", "Notgroschen"];

export function canChildCreateCashAccount(input: { childCanCreateCashAccounts: boolean; childCashAccountLimit: number; existingChildManagedCashAccounts: number }) {
  return input.childCanCreateCashAccounts && input.existingChildManagedCashAccounts < input.childCashAccountLimit;
}

const typeLabels: Record<PrismaMoneyTransactionType, string> = {
  allowance: "Taschengeld",
  loan: "Leihe/Ausgabe",
  repayment: "Rückzahlung",
  adjustment: "Korrektur",
  reward: "Aufgabenbonus",
  reversal: "Storno",
};

const accountKindLabels: Record<FinanceAccountKind, string> = {
  CASH: "Bargeld",
  GIRO: "Girokonto",
  SAVINGS: "Sparkonto",
  DAY_MONEY: "Tagesgeld",
  HOME_SAVINGS: "Sparen zu Hause",
  OTHER: "Sonstiges",
};

export function moneyTransactionLabel(type: PrismaMoneyTransactionType) {
  return typeLabels[type];
}

export function financeAccountKindLabel(kind: FinanceAccountKind) {
  return accountKindLabels[kind];
}

export function signedTransactionAmount(type: PrismaMoneyTransactionType, amountCents: number): number {
  if (type === "loan") return -amountCents;
  return amountCents;
}

export function reversalAmountCents(originalAmountCents: number): number {
  return -originalAmountCents;
}

export function canReverseMoneyTransaction(input: {
  type: PrismaMoneyTransactionType;
  reversalTransactionId: string | null;
  bookedOccurrenceCount: number;
}): boolean {
  return input.type !== "reversal" && !input.reversalTransactionId && input.bookedOccurrenceCount === 0;
}

export async function ensureFinanceAccount(familyId: string, familyMemberId: string) {
  const existing = await db.financeAccount.findFirst({
    where: { familyId, familyMemberId },
    orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
  });
  if (existing) return existing;
  return db.financeAccount.create({
    data: {
      familyId,
      familyMemberId,
      name: "Bargeld",
      kind: "CASH",
      isDefault: true,
      childCanBook: true,
      balanceCents: 0,
    },
  });
}

export async function getChildFinanceOverview() {
  const context = await requireFamilyAdmin();

  const children = await db.familyMember.findMany({
    where: {
      familyId: context.family.id,
      role: "child",
    },
    include: { financeAccounts: { orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }] } },
    orderBy: { createdAt: "asc" },
  });

  for (const child of children) {
    if (child.financeAccounts.length === 0) {
      await ensureFinanceAccount(context.family.id, child.id);
    }
  }

  const [accounts, transactions] = await Promise.all([
    db.financeAccount.findMany({
      where: { familyId: context.family.id, member: { role: "child" } },
      include: { member: true },
      orderBy: [{ member: { createdAt: "asc" } }, { isDefault: "desc" }, { createdAt: "asc" }],
    }),
    db.moneyTransaction.findMany({
      where: { familyId: context.family.id },
      include: {
        member: true,
        account: true,
        reversalTransaction: true,
        bookedOccurrences: { select: { id: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 12,
    }),
  ]);

  const totalBalanceCents = accounts.reduce((sum, account) => sum + account.balanceCents, 0);

  return { context, children, accounts, transactions, totalBalanceCents };
}

export async function createFinanceAccount(formData: FormData) {
  const context = await requireFamilyAdmin();
  const parsed = accountInputSchema.safeParse({
    familyMemberId: formData.get("familyMemberId")?.toString(),
    name: formData.get("name")?.toString(),
    kind: formData.get("kind")?.toString(),
    openingBalance: formData.get("openingBalance")?.toString(),
    childCanBook: formData.get("childCanBook") === "on",
  });
  if (!parsed.success) redirect("/app/finance?error=invalid-account");

  const openingBalanceCents = parsed.data.openingBalance ? parseEuroToCents(parsed.data.openingBalance) : 0;
  if (openingBalanceCents === null || openingBalanceCents < 0) redirect("/app/finance?error=invalid-amount");

  const child = await db.familyMember.findFirst({
    where: { id: parsed.data.familyMemberId, familyId: context.family.id, role: "child" },
  });
  if (!child) redirect("/app/finance?error=invalid-member");

  const existingCount = await db.financeAccount.count({ where: { familyId: context.family.id, familyMemberId: child.id } });
  await db.financeAccount.create({
    data: {
      familyId: context.family.id,
      familyMemberId: child.id,
      name: parsed.data.name,
      kind: parsed.data.kind as FinanceAccountKind,
      isDefault: existingCount === 0,
      childCanBook: ["CASH", "HOME_SAVINGS"].includes(parsed.data.kind) && parsed.data.childCanBook,
      balanceCents: openingBalanceCents,
    },
  });
}


export async function updateChildCashAccountSettings(formData: FormData) {
  const context = await requireFamilyAdmin();
  const parsed = childCashSettingsSchema.safeParse({
    childId: formData.get("childId")?.toString(),
    childCanCreateCashAccounts: formData.get("childCanCreateCashAccounts") === "on",
    childCashAccountLimit: formData.get("childCashAccountLimit")?.toString() || "5",
  });
  if (!parsed.success) redirect("/app/finance?error=invalid-cash-settings");

  await db.familyMember.updateMany({
    where: { id: parsed.data.childId, familyId: context.family.id, role: "child" },
    data: {
      childCanCreateCashAccounts: parsed.data.childCanCreateCashAccounts,
      childCashAccountLimit: parsed.data.childCashAccountLimit,
    },
  });
}

export async function createChildCashAccount(formData: FormData) {
  const context = await requireFamilyAdminOrChild();
  const parsed = z.object({
    childId: z.string().min(1),
    name: z.string().trim().min(2).max(40),
  }).safeParse({
    childId: formData.get("childId")?.toString(),
    name: formData.get("name")?.toString(),
  });
  if (!parsed.success) redirect("/app/kids?error=invalid-account");
  if (!canAccessChildMember(context, parsed.data.childId)) redirect("/app/kids?error=forbidden-account");

  const child = await db.familyMember.findFirst({
    where: { id: parsed.data.childId, familyId: context.family.id, role: "child" },
    include: { financeAccounts: { where: { kind: "CASH", childManaged: true } } },
  });
  if (!child) redirect("/app/kids?error=invalid-child");
  if (!canChildCreateCashAccount({
    childCanCreateCashAccounts: child.childCanCreateCashAccounts,
    childCashAccountLimit: child.childCashAccountLimit,
    existingChildManagedCashAccounts: child.financeAccounts.length,
  })) redirect("/app/kids?error=account-limit");

  await db.financeAccount.create({
    data: {
      familyId: context.family.id,
      familyMemberId: child.id,
      name: parsed.data.name,
      kind: "CASH",
      childManaged: true,
      childCanBook: true,
      balanceCents: 0,
    },
  });
}

export async function bookMoneyTransaction(input: {
  familyId: string;
  userId: string;
  accountId: string;
  type: PrismaMoneyTransactionType;
  title: string;
  amountCents: number;
}) {
  const account = await db.financeAccount.findFirst({
    where: { id: input.accountId, familyId: input.familyId, member: { role: "child" } },
  });
  if (!account) return null;
  const nextBalanceCents = applyMoneyTransaction(account.balanceCents, input.type, input.amountCents);
  const transactionAmount = input.type === "adjustment" ? nextBalanceCents - account.balanceCents : signedTransactionAmount(input.type, input.amountCents);

  const [, transaction] = await db.$transaction([
    db.financeAccount.update({
      where: { id: account.id },
      data: { balanceCents: nextBalanceCents },
    }),
    db.moneyTransaction.create({
      data: {
        familyId: input.familyId,
        familyMemberId: account.familyMemberId,
        financeAccountId: account.id,
        type: input.type,
        title: input.title,
        amountCents: transactionAmount,
        balanceAfterCents: nextBalanceCents,
        createdByUserId: input.userId,
      },
    }),
  ]);
  return transaction;
}

export async function reverseMoneyTransaction(transactionId: string) {
  const context = await requireFamilyAdmin();

  return db.$transaction(async (tx) => {
    const original = await tx.moneyTransaction.findFirst({
      where: { id: transactionId, familyId: context.family.id },
      include: {
        account: true,
        bookedOccurrences: { select: { id: true } },
      },
    });
    if (!original || !original.account || !canReverseMoneyTransaction({
      type: original.type,
      reversalTransactionId: original.reversalTransactionId,
      bookedOccurrenceCount: original.bookedOccurrences.length,
    })) {
      return null;
    }

    const reversal = await tx.moneyTransaction.create({
      data: {
        familyId: context.family.id,
        familyMemberId: original.familyMemberId,
        financeAccountId: original.financeAccountId,
        type: "reversal",
        title: `Storno: ${original.title}`,
        amountCents: reversalAmountCents(original.amountCents),
        balanceAfterCents: 0,
        createdByUserId: context.user.id,
      },
    });

    const claimed = await tx.moneyTransaction.updateMany({
      where: { id: original.id, reversalTransactionId: null },
      data: { reversalTransactionId: reversal.id },
    });
    if (claimed.count !== 1) {
      throw new Error("Die Geldbewegung wurde bereits storniert.");
    }

    const account = await tx.financeAccount.update({
      where: { id: original.account.id },
      data: { balanceCents: { increment: reversal.amountCents } },
      select: { balanceCents: true },
    });

    return tx.moneyTransaction.update({
      where: { id: reversal.id },
      data: { balanceAfterCents: account.balanceCents },
    });
  });
}

export async function createMoneyTransaction(formData: FormData) {
  const context = await requireFamilyAdmin();
  const parsed = transactionInputSchema.safeParse({
    financeAccountId: formData.get("financeAccountId")?.toString(),
    type: formData.get("type")?.toString(),
    title: formData.get("title")?.toString(),
    amount: formData.get("amount")?.toString(),
  });

  if (!parsed.success) redirect("/app/finance?error=invalid-transaction");

  const amountCents = parseEuroToCents(parsed.data.amount);
  if (amountCents === null) redirect("/app/finance?error=invalid-amount");

  const title = parsed.data.title || moneyTransactionLabel(parsed.data.type);
  const transaction = await bookMoneyTransaction({
    familyId: context.family.id,
    userId: context.user.id,
    accountId: parsed.data.financeAccountId,
    type: parsed.data.type,
    title,
    amountCents,
  });

  if (!transaction) redirect("/app/finance?error=invalid-account");
}

export { formatCents };
