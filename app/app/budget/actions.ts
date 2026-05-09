"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createHouseholdBudgetEntry, createHouseholdBudgetPlanItem, deactivateHouseholdBudgetPlanItem } from "@/lib/household-budget";

export async function createHouseholdBudgetPlanItemAction(formData: FormData) {
  await createHouseholdBudgetPlanItem(formData);
  revalidatePath("/app/budget");
  redirect("/app/budget");
}

export async function createHouseholdBudgetEntryAction(formData: FormData) {
  await createHouseholdBudgetEntry(formData);
  revalidatePath("/app/budget");
  redirect("/app/budget");
}

export async function deactivateHouseholdBudgetPlanItemAction(formData: FormData) {
  const itemId = formData.get("itemId")?.toString();
  if (!itemId) redirect("/app/budget?error=invalid-plan-item");
  await deactivateHouseholdBudgetPlanItem(itemId);
  revalidatePath("/app/budget");
  redirect("/app/budget");
}
