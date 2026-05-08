"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createConsequence, updateConsequenceStatus } from "@/lib/consequences";

export async function createConsequenceAction(formData: FormData) {
  await createConsequence(formData);
  revalidatePath("/app");
  revalidatePath("/app/consequences");
  redirect("/app/consequences");
}

export async function updateConsequenceStatusAction(consequenceId: string, status: string) {
  await updateConsequenceStatus(consequenceId, status);
  revalidatePath("/app");
  revalidatePath("/app/consequences");
}
