"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createMoneyTransaction } from "@/lib/finances";

export async function createMoneyTransactionAction(formData: FormData) {
  await createMoneyTransaction(formData);
  revalidatePath("/app");
  revalidatePath("/app/finance");
  redirect("/app/finance");
}
