"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { updateTaskOccurrenceStatus } from "@/lib/tasks";
import { createChildLedgerEntry, deleteChildLedgerEntry } from "@/lib/child-ledger";

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

export async function deleteChildLedgerEntryAction(formData: FormData) {
  await deleteChildLedgerEntry(formData);
  redirect("/app/kids");
}
