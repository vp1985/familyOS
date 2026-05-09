"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { updateTaskOccurrenceStatus } from "@/lib/tasks";
import { createChildLedgerEntry, deleteChildLedgerEntry } from "@/lib/child-ledger";
import { createChildCashAccount } from "@/lib/finances";
import { setChecklistItemChecked } from "@/lib/checklists";

export async function markKidsTaskDoneAction(formData: FormData) {
  const occurrenceId = formData.get("occurrenceId")?.toString();
  if (!occurrenceId) redirect("/app/kids?error=invalid-task");
  await updateTaskOccurrenceStatus(occurrenceId, "done");
  revalidatePath("/app/kids");
  revalidatePath("/app");
  redirect("/app/kids");
}

export async function createChildLedgerEntryAction(formData: FormData) {
  await createChildLedgerEntry(formData);
  redirect("/app/kids");
}

export async function createChildCashAccountAction(formData: FormData) {
  await createChildCashAccount(formData);
  revalidatePath("/app/kids");
  revalidatePath("/app/finance");
  redirect("/app/kids");
}

export async function deleteChildLedgerEntryAction(formData: FormData) {
  await deleteChildLedgerEntry(formData);
  redirect("/app/kids");
}

export async function toggleKidsChecklistItemAction(formData: FormData) {
  const itemId = formData.get("itemId")?.toString();
  const checked = formData.get("checked")?.toString() === "true";
  if (!itemId) redirect("/app/kids?error=invalid-checklist-item");
  await setChecklistItemChecked(itemId, checked);
  revalidatePath("/app/kids");
  revalidatePath("/app/checklists");
  revalidatePath("/app/tasks");
  redirect("/app/kids");
}
