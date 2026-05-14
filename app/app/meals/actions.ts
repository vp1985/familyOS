"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createMealPlanEntry } from "@/lib/meal-planner";

export async function createMealPlanEntryAction(formData: FormData) {
  await createMealPlanEntry(formData);
  revalidatePath("/app");
  revalidatePath("/app/meals");
  redirect("/app/meals");
}
