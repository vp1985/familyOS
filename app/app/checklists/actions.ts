"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { archiveChecklistInstance, createChecklistInstance, createChecklistTemplate, setChecklistItemChecked } from "@/lib/checklists";

export async function createChecklistTemplateAction(formData: FormData) {
  await createChecklistTemplate(formData);
  revalidatePath("/app/checklists");
  redirect("/app/checklists");
}

export async function createChecklistInstanceAction(formData: FormData) {
  await createChecklistInstance(formData);
  revalidatePath("/app/checklists");
  revalidatePath("/app/tasks");
  revalidatePath("/app/kids");
  redirect("/app/checklists");
}

export async function checkChecklistItemAction(itemId: string) {
  await setChecklistItemChecked(itemId, true);
  revalidatePath("/app/checklists");
  revalidatePath("/app/tasks");
  revalidatePath("/app/kids");
}

export async function uncheckChecklistItemAction(itemId: string) {
  await setChecklistItemChecked(itemId, false);
  revalidatePath("/app/checklists");
  revalidatePath("/app/tasks");
  revalidatePath("/app/kids");
}

export async function archiveChecklistInstanceAction(instanceId: string) {
  await archiveChecklistInstance(instanceId);
  revalidatePath("/app/checklists");
  revalidatePath("/app/tasks");
  revalidatePath("/app/kids");
  redirect("/app/checklists");
}
