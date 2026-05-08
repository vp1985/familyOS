import { redirect } from "next/navigation";
import { z } from "zod";
import type { MoneyTransactionType as PrismaMoneyTransactionType } from "@prisma/client";
import { db } from "@/lib/db";
import { requireFamilyAdmin, requireFamilyContext } from "@/lib/family-context";
import { applyMoneyTransaction, formatCents, parseEuroToCents } from "@/lib/money";

const transactionInputSchema = z.object({
  familyMemberId: z.string().min(1),
  type: z.enum(["allowance", "loan", "repayment", "adjustment"]),
  title: z.string().trim().min(2).optional(),
  amount: z.string().min(1),
});

const typeLabels: Record<PrismaMoneyTransactionType, string> = {
  allowance: "Taschengeld",
  loan: "Leihe/Ausgabe",
  repayment: "Rückzahlung",
  adjustment: "Korrektur",
  reward: "Aufgabenbonus",
};

export function moneyTransactionLabel(type: PrismaMoneyTransactionType) {
  return typeLabels[type];
}

export async function ensureFinanceAccount(familyId: string, familyMemberId: string) {
  return db.financeAccount.upsert({
    where: { familyMemberId },
    update: {},
    create: {
      familyId,
      familyMemberId,
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
    include: { financeAccount: true },
    orderBy: { createdAt: "asc" },
  });

  for (const child of children) {
    if (!child.financeAccount) {
      await ensureFinanceAccount(context.family.id, child.id);
    }
  }

  const [accounts, transactions] = await Promise.all([
    db.financeAccount.findMany({
      where: { familyId: context.family.id, member: { role: "child" } },
      include: { member: true },
      orderBy: { member: { createdAt: "asc" } },
    }),
    db.moneyTransaction.findMany({
      where: { familyId: context.family.id },
      include: { member: true },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
  ]);

  const totalBalanceCents = accounts.reduce((sum, account) => sum + account.balanceCents, 0);

  return { context, accounts, transactions, totalBalanceCents };
}

export async function createMoneyTransaction(formData: FormData) {

  const context = await requireFamilyAdmin();
  const parsed = transactionInputSchema.safeParse({
    familyMemberId: formData.get("familyMemberId")?.toString(),
    type: formData.get("type")?.toString(),
    title: formData.get("title")?.toString(),
    amount: formData.get("amount")?.toString(),
  });

  if (!parsed.success) {
    redirect("/app/finance?error=invalid-transaction");
  }

  const amountCents = parseEuroToCents(parsed.data.amount);

  if (amountCents === null) {
    redirect("/app/finance?error=invalid-amount");
  }

  const member = await db.familyMember.findFirst({
    where: {
      id: parsed.data.familyMemberId,
      familyId: context.family.id,
      role: "child",
    },
    include: { financeAccount: true },
  });

  if (!member) {
    redirect("/app/finance?error=invalid-member");
  }

  const account = member.financeAccount ?? (await ensureFinanceAccount(context.family.id, member.id));
  const nextBalanceCents = applyMoneyTransaction(account.balanceCents, parsed.data.type, amountCents);
  const title = parsed.data.title || moneyTransactionLabel(parsed.data.type);

  await db.$transaction([
    db.financeAccount.update({
      where: { id: account.id },
      data: { balanceCents: nextBalanceCents },
    }),
    db.moneyTransaction.create({
      data: {
        familyId: context.family.id,
        familyMemberId: member.id,
        type: parsed.data.type,
        title,
        amountCents,
        balanceAfterCents: nextBalanceCents,
        createdByUserId: context.user.id,
      },
    }),
  ]);
}

export { formatCents };
