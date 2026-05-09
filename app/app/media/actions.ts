"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  cancelMediaRestriction,
  createMediaAllowanceRule,
  createMediaRestriction,
  deactivateMediaAllowanceRule,
  releaseMediaRestriction,
} from "@/lib/media-time";

export async function createMediaAllowanceRuleAction(formData: FormData) {
  await createMediaAllowanceRule(formData);
  revalidatePath("/app/media");
  revalidatePath("/app/kids");
  redirect("/app/media");
}

export async function deactivateMediaAllowanceRuleAction(ruleId: string) {
  await deactivateMediaAllowanceRule(ruleId);
  revalidatePath("/app/media");
  revalidatePath("/app/kids");
}

export async function createMediaRestrictionAction(formData: FormData) {
  await createMediaRestriction(formData);
  revalidatePath("/app/media");
  revalidatePath("/app/kids");
  revalidatePath("/app");
  redirect("/app/media");
}

export async function releaseMediaRestrictionAction(restrictionId: string) {
  await releaseMediaRestriction(restrictionId);
  revalidatePath("/app/media");
  revalidatePath("/app/kids");
  revalidatePath("/app");
}

export async function cancelMediaRestrictionAction(restrictionId: string) {
  await cancelMediaRestriction(restrictionId);
  revalidatePath("/app/media");
  revalidatePath("/app/kids");
  revalidatePath("/app");
}
