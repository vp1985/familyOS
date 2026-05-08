"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createCalendarEvent, createCalendarSource, syncCalendarSourceById } from "@/lib/calendar";

export async function createCalendarEventAction(formData: FormData) {
  await createCalendarEvent(formData);
  revalidatePath("/app");
  revalidatePath("/app/calendar");
  redirect("/app/calendar");
}

export async function createCalendarSourceAction(formData: FormData) {
  await createCalendarSource(formData);
  revalidatePath("/app");
  revalidatePath("/app/calendar");
  redirect("/app/calendar");
}

export async function syncCalendarSourceAction(sourceId: string) {
  await syncCalendarSourceById(sourceId);
  revalidatePath("/app");
  revalidatePath("/app/calendar");
  redirect("/app/calendar");
}
