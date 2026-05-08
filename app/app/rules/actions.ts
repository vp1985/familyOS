"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createRule, createRuleEvent, setRuleActive } from "@/lib/rules";

export async function createRuleAction(formData: FormData) {
  const ruleId = await createRule(formData);
  revalidatePath("/app");
  revalidatePath("/app/rules");
  redirect(`/app/rules?created=${ruleId}`);
}

export async function createRuleEventAction(ruleId: string, formData: FormData) {
  await createRuleEvent(ruleId, formData);
  revalidatePath("/app");
  revalidatePath("/app/rules");
  redirect("/app/rules");
}

export async function toggleRuleAction(ruleId: string, isActive: boolean) {
  await setRuleActive(ruleId, isActive);
  revalidatePath("/app/rules");
}
