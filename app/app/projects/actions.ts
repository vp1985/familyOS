"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createProject, createProjectExpense, updateProjectStatus, voidProjectExpense } from "@/lib/projects";

export async function createProjectAction(formData: FormData) {
  const projectId = await createProject(formData);
  revalidatePath("/app");
  revalidatePath("/app/projects");
  redirect(`/app/projects/${projectId}`);
}

export async function createProjectExpenseAction(projectId: string, formData: FormData) {
  await createProjectExpense(projectId, formData);
  revalidatePath("/app");
  revalidatePath("/app/projects");
  revalidatePath(`/app/projects/${projectId}`);
  redirect(`/app/projects/${projectId}`);
}

export async function voidProjectExpenseAction(projectId: string, expenseId: string) {
  await voidProjectExpense(projectId, expenseId);
  revalidatePath("/app");
  revalidatePath("/app/projects");
  revalidatePath(`/app/projects/${projectId}`);
  redirect(`/app/projects/${projectId}`);
}

export async function updateProjectStatusAction(projectId: string, status: "active" | "done" | "archived") {
  await updateProjectStatus(projectId, status);
  revalidatePath("/app");
  revalidatePath("/app/projects");
  revalidatePath(`/app/projects/${projectId}`);
  redirect(`/app/projects/${projectId}`);
}
