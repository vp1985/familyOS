"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createFinanceAccount, createMoneyTransaction } from "@/lib/finances";
import { createMoneyRule, deactivateMoneyRule, markMoneyOccurrenceStatus } from "@/lib/child-money";

export async function createMoneyTransactionAction(formData: FormData) {
  await createMoneyTransaction(formData);
  revalidatePath("/app");
  revalidatePath("/app/finance");
  revalidatePath("/app/kids");
  redirect("/app/finance");
}

export async function createFinanceAccountAction(formData: FormData) {
  await createFinanceAccount(formData);
  revalidatePath("/app/finance");
  revalidatePath("/app/kids");
  redirect("/app/finance");
}

export async function createMoneyRuleAction(formData: FormData) {
  await createMoneyRule(formData);
  redirect("/app/finance");
}

export async function deactivateMoneyRuleAction(formData: FormData) {
  const ruleId = formData.get("ruleId")?.toString();
  if (!ruleId) redirect("/app/finance?error=invalid-money-rule");
  await deactivateMoneyRule(ruleId);
  redirect("/app/finance");
}

export async function markMoneyOccurrenceStatusAction(formData: FormData) {
  await markMoneyOccurrenceStatus(formData);
  redirect("/app/finance");
}
