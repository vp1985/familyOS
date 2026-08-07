import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { ChildLedgerVisibility, MoneyDirection } from "@prisma/client";
import { db } from "@/lib/db";
import { requireFamilyAdminOrChild } from "@/lib/family-context";
import { canAccessChildMember } from "@/lib/family-access-policy";
import { parseEuroToCents } from "@/lib/money";
import { bookMoneyTransaction } from "@/lib/finances";
import type { ChildMoneyDirection } from "./child-money";

export type ChildLedgerVisibilityValue = "PARENT_VISIBLE" | "CHILD_PRIVATE";

export type ChildLedgerEntryInput = {
  id: string;
  childId: string;
  financeAccountId?: string | null;
  amountCents: number;
  direction: ChildMoneyDirection;
  title: string;
  visibility: ChildLedgerVisibilityValue;
  createdByChildId: string;
};

const ledgerEntrySchema = z.object({
  childId: z.string().min(1),
  financeAccountId: z.string().optional(),
  amount: z.string().min(1),
  direction: z.enum(["INCOME", "EXPENSE"]),
  title: z.string().trim().min(2),
  note: z.string().trim().optional(),
  categoryLabel: z.string().trim().optional(),
  visibility: z.enum(["PARENT_VISIBLE", "CHILD_PRIVATE"]),
});

export function signedLedgerAmount(entry: Pick<ChildLedgerEntryInput, "amountCents" | "direction">): number {
  return entry.direction === "EXPENSE" ? -entry.amountCents : entry.amountCents;
}

export function sumChildLedger(entries: Pick<ChildLedgerEntryInput, "amountCents" | "direction">[]): number {
  return entries.reduce((sum, entry) => sum + signedLedgerAmount(entry), 0);
}

export function entriesVisibleToParents<T extends Pick<ChildLedgerEntryInput, "visibility">>(entries: T[]): T[] {
  return entries.filter((entry) => entry.visibility === "PARENT_VISIBLE");
}

export function canDeleteChildLedgerEntry(
  entry: Pick<ChildLedgerEntryInput, "createdByChildId" | "childId" | "financeAccountId">,
  actorChildId: string,
): boolean {
  return !entry.financeAccountId && entry.childId === actorChildId && entry.createdByChildId === actorChildId;
}

export async function createChildLedgerEntry(formData: FormData) {
  const context = await requireFamilyAdminOrChild();
  const parsed = ledgerEntrySchema.safeParse({
    childId: formData.get("childId")?.toString(),
    financeAccountId: formData.get("financeAccountId")?.toString(),
    amount: formData.get("amount")?.toString(),
    direction: formData.get("direction")?.toString(),
    title: formData.get("title")?.toString(),
    note: formData.get("note")?.toString(),
    categoryLabel: formData.get("categoryLabel")?.toString(),
    visibility: formData.get("visibility")?.toString() || "PARENT_VISIBLE",
  });

  if (!parsed.success) redirect("/app/kids?error=invalid-ledger-entry");
  if (!canAccessChildMember(context, parsed.data.childId)) redirect("/app/kids?error=forbidden-ledger-entry");
  const amountCents = parseEuroToCents(parsed.data.amount);
  if (amountCents === null || amountCents <= 0) redirect("/app/kids?error=invalid-amount");

  const child = await db.familyMember.findFirst({
    where: { id: parsed.data.childId, familyId: context.family.id, role: "child" },
  });
  if (!child) redirect("/app/kids?error=invalid-child");

  const account = parsed.data.financeAccountId
    ? await db.financeAccount.findFirst({ where: { id: parsed.data.financeAccountId, familyId: context.family.id, familyMemberId: child.id, childCanBook: true, kind: { in: ["CASH", "HOME_SAVINGS"] } } })
    : null;
  if (parsed.data.financeAccountId && !account) redirect("/app/kids?error=invalid-account");

  await db.childLedgerEntry.create({
    data: {
      familyId: context.family.id,
      childId: child.id,
      financeAccountId: account?.id ?? null,
      amountCents,
      direction: parsed.data.direction as MoneyDirection,
      title: parsed.data.title,
      note: parsed.data.note || null,
      categoryLabel: parsed.data.categoryLabel || null,
      visibility: parsed.data.visibility as ChildLedgerVisibility,
      createdByUserId: context.user.id,
      createdByChildId: child.id,
    },
  });

  if (account) {
    await bookMoneyTransaction({
      familyId: context.family.id,
      userId: context.user.id,
      accountId: account.id,
      type: parsed.data.direction === "EXPENSE" ? "loan" : "allowance",
      title: parsed.data.title,
      amountCents,
    });
  }

  revalidatePath("/app/kids");
  revalidatePath("/app/finance");
}

export async function deleteChildLedgerEntry(formData: FormData) {
  const context = await requireFamilyAdminOrChild();
  const entryId = formData.get("entryId")?.toString();
  const childId = formData.get("childId")?.toString();
  if (!entryId || !childId) redirect("/app/kids?error=invalid-ledger-entry");
  if (!canAccessChildMember(context, childId)) redirect("/app/kids?error=forbidden-ledger-delete");

  const entry = await db.childLedgerEntry.findFirst({
    where: { id: entryId, familyId: context.family.id, childId },
  });
  if (!entry || !canDeleteChildLedgerEntry(entry, childId)) redirect("/app/kids?error=forbidden-ledger-delete");

  await db.childLedgerEntry.delete({ where: { id: entry.id } });
  revalidatePath("/app/kids");
  revalidatePath("/app/finance");
}
