import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { ChildLedgerVisibility, MoneyDirection } from "@prisma/client";
import { db } from "@/lib/db";
import { requireFamilyContext } from "@/lib/family-context";
import { parseEuroToCents } from "@/lib/money";
import type { ChildMoneyDirection } from "./child-money";

export type ChildLedgerVisibilityValue = "PARENT_VISIBLE" | "CHILD_PRIVATE";

export type ChildLedgerEntryInput = {
  id: string;
  childId: string;
  amountCents: number;
  direction: ChildMoneyDirection;
  title: string;
  visibility: ChildLedgerVisibilityValue;
  createdByChildId: string;
};

const ledgerEntrySchema = z.object({
  childId: z.string().min(1),
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
  entry: Pick<ChildLedgerEntryInput, "createdByChildId" | "childId">,
  actorChildId: string,
): boolean {
  return entry.childId === actorChildId && entry.createdByChildId === actorChildId;
}

export async function createChildLedgerEntry(formData: FormData) {
  const context = await requireFamilyContext();
  const parsed = ledgerEntrySchema.safeParse({
    childId: formData.get("childId")?.toString(),
    amount: formData.get("amount")?.toString(),
    direction: formData.get("direction")?.toString(),
    title: formData.get("title")?.toString(),
    note: formData.get("note")?.toString(),
    categoryLabel: formData.get("categoryLabel")?.toString(),
    visibility: formData.get("visibility")?.toString() || "PARENT_VISIBLE",
  });

  if (!parsed.success) redirect("/app/kids?error=invalid-ledger-entry");
  const amountCents = parseEuroToCents(parsed.data.amount);
  if (amountCents === null || amountCents <= 0) redirect("/app/kids?error=invalid-amount");

  const child = await db.familyMember.findFirst({
    where: { id: parsed.data.childId, familyId: context.family.id, role: "child" },
  });
  if (!child) redirect("/app/kids?error=invalid-child");

  await db.childLedgerEntry.create({
    data: {
      familyId: context.family.id,
      childId: child.id,
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

  revalidatePath("/app/kids");
  revalidatePath("/app/finance");
}

export async function deleteChildLedgerEntry(formData: FormData) {
  const context = await requireFamilyContext();
  const entryId = formData.get("entryId")?.toString();
  const childId = formData.get("childId")?.toString();
  if (!entryId || !childId) redirect("/app/kids?error=invalid-ledger-entry");

  const entry = await db.childLedgerEntry.findFirst({
    where: { id: entryId, familyId: context.family.id, childId },
  });
  if (!entry || !canDeleteChildLedgerEntry(entry, childId)) redirect("/app/kids?error=forbidden-ledger-delete");

  await db.childLedgerEntry.delete({ where: { id: entry.id } });
  revalidatePath("/app/kids");
  revalidatePath("/app/finance");
}
