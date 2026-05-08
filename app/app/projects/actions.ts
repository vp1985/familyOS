"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createProject, createProjectExpense } from "@/lib/projects";

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
