import { redirect } from "next/navigation";
import { z } from "zod";
import type { FinanceAccountKind, MoneyTransactionType as PrismaMoneyTransactionType } from "@prisma/client";
import { db } from "@/lib/db";
import { requireFamilyAdmin, requireFamilyContext } from "@/lib/family-context";
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
});

const typeLabels: Record<PrismaMoneyTransactionType, string> = {
  allowance: "Taschengeld",
  loan: "Leihe/Ausgabe",
  repayment: "Rückzahlung",
  adjustment: "Korrektur",
  reward: "Aufgabenbonus",
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
      balanceCents: 0,
    },
  });
}

export async function getChildFinanceOverview() {
  const context = await requireFamilyContext();

  const children = await db.familyMember.findMany({
    where: {
      familyId: context.family.id,
      role: "child",
    },
    include: { financeAccounts: true },
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
      include: { member: true, account: true },
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
      balanceCents: openingBalanceCents,
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
