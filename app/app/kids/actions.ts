"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { updateTaskOccurrenceStatus } from "@/lib/tasks";

export async function markKidsTaskDoneAction(formData: FormData) {
  const occurrenceId = formData.get("occurrenceId")?.toString();
  if (!occurrenceId) redirect("/app/kids?error=invalid-task");
  await updateTaskOccurrenceStatus(occurrenceId, "done");
  revalidatePath("/app/kids");
  revalidatePath("/app");
  redirect("/app/kids");
}
