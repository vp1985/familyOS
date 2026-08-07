"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createFinanceAccount, createMoneyTransaction, reverseMoneyTransaction, updateChildCashAccountSettings } from "@/lib/finances";
import { createMoneyRule, deactivateMoneyRule, markMoneyOccurrenceStatus, reverseMoneyOccurrence } from "@/lib/child-money";

export async function createMoneyTransactionAction(formData: FormData) {
  await createMoneyTransaction(formData);
  revalidatePath("/app");
  revalidatePath("/app/finance");
  revalidatePath("/app/kids");
  redirect("/app/finance");
}

export async function reverseMoneyTransactionAction(formData: FormData) {
  const transactionId = formData.get("transactionId")?.toString();
  if (!transactionId) redirect("/app/finance?error=invalid-transaction");

  const reversal = await reverseMoneyTransaction(transactionId);
  if (!reversal) redirect("/app/finance?error=invalid-reversal");

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

export async function updateChildCashAccountSettingsAction(formData: FormData) {
  await updateChildCashAccountSettings(formData);
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

export async function reverseMoneyOccurrenceAction(formData: FormData) {
  const occurrenceId = formData.get("occurrenceId")?.toString();
  if (!occurrenceId) redirect("/app/finance?error=invalid-money-occurrence");

  const reversal = await reverseMoneyOccurrence(occurrenceId);
  if (!reversal) redirect("/app/finance?error=invalid-money-occurrence");

  revalidatePath("/app");
  revalidatePath("/app/finance");
  revalidatePath("/app/kids");
  redirect("/app/finance");
}

export async function markMoneyOccurrenceStatusAction(formData: FormData) {
  await markMoneyOccurrenceStatus(formData);
  redirect("/app/finance");
}
