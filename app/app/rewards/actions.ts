"use server";

import { revalidatePath } from "next/cache";
import { assignBadge, createPointTransaction, createReward, redeemReward } from "@/lib/gamification";

export async function createPointTransactionAction(formData: FormData) {
  await createPointTransaction(formData);
  revalidatePath("/app");
  revalidatePath("/app/rewards");
}

export async function createRewardAction(formData: FormData) {
  await createReward(formData);
  revalidatePath("/app/rewards");
}

export async function redeemRewardAction(formData: FormData) {
  await redeemReward(formData);
  revalidatePath("/app");
  revalidatePath("/app/rewards");
}

export async function assignBadgeAction(formData: FormData) {
  await assignBadge(formData);
  revalidatePath("/app");
  revalidatePath("/app/rewards");
}
