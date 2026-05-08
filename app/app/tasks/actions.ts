"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createTaskTemplate, updateTaskOccurrenceStatus, type TaskStatus } from "@/lib/tasks";

export async function createTaskTemplateAction(formData: FormData) {
  await createTaskTemplate(formData);
  revalidatePath("/app");
  revalidatePath("/app/tasks");
  redirect("/app/tasks");
}

export async function setTaskOccurrenceStatusAction(occurrenceId: string, status: TaskStatus) {
  await updateTaskOccurrenceStatus(occurrenceId, status);
  revalidatePath("/app");
  revalidatePath("/app/tasks");
  redirect("/app/tasks");
}

export async function startTaskOccurrenceAction(occurrenceId: string) {
  await setTaskOccurrenceStatusAction(occurrenceId, "in_progress");
}

export async function doneTaskOccurrenceAction(occurrenceId: string) {
  await setTaskOccurrenceStatusAction(occurrenceId, "done");
}

export async function confirmTaskOccurrenceAction(occurrenceId: string) {
  await setTaskOccurrenceStatusAction(occurrenceId, "confirmed");
}

export async function skipTaskOccurrenceAction(occurrenceId: string) {
  await setTaskOccurrenceStatusAction(occurrenceId, "skipped");
}
