"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  createRelationshipContact,
  createRelationshipGiftIdea,
  createRelationshipGiftList,
  createRelationshipPreference,
} from "@/lib/relationships";

export async function createRelationshipContactAction(formData: FormData) {
  await createRelationshipContact(formData);
  revalidatePath("/app/relationships");
  redirect("/app/relationships");
}

export async function createRelationshipPreferenceAction(formData: FormData) {
  await createRelationshipPreference(formData);
  revalidatePath("/app/relationships");
  redirect("/app/relationships");
}

export async function createRelationshipGiftListAction(formData: FormData) {
  await createRelationshipGiftList(formData);
  revalidatePath("/app/relationships");
  redirect("/app/relationships");
}

export async function createRelationshipGiftIdeaAction(formData: FormData) {
  await createRelationshipGiftIdea(formData);
  revalidatePath("/app/relationships");
  redirect("/app/relationships");
}
