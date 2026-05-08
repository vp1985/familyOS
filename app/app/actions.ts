"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { updateTaskOccurrenceStatus } from "@/lib/tasks";

async function updateFromDashboard(formData: FormData, status: "done" | "confirmed") {
  const occurrenceId = formData.get("occurrenceId")?.toString();
  if (!occurrenceId) redirect("/app?error=invalid-task");
  await updateTaskOccurrenceStatus(occurrenceId, status);
  revalidatePath("/app");
  revalidatePath("/app/tasks");
  redirect("/app");
}

export async function markDashboardTaskDoneAction(formData: FormData) {
  await updateFromDashboard(formData, "done");
}

export async function confirmDashboardTaskAction(formData: FormData) {
  await updateFromDashboard(formData, "confirmed");
}
