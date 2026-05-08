"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createCalendarEvent } from "@/lib/calendar";

export async function createCalendarEventAction(formData: FormData) {
  await createCalendarEvent(formData);
  revalidatePath("/app");
  revalidatePath("/app/calendar");
  redirect("/app/calendar");
}
