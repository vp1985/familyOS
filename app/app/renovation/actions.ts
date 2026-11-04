"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  createRenovationProject,
  createRenovationRoom,
  createRenovationTask,
  createRenovationWorkPackage,
  updateRenovationTaskStatus,
} from "@/lib/renovation";

export async function createRenovationProjectAction(formData: FormData) {
  const projectId = await createRenovationProject(formData);
  revalidatePath("/app");
  revalidatePath("/app/renovation");
  redirect(`/app/renovation/${projectId}`);
}

export async function createRenovationRoomAction(renovationId: string, formData: FormData) {
  const roomId = await createRenovationRoom(renovationId, formData);
  revalidatePath("/app/renovation");
  revalidatePath(`/app/renovation/${renovationId}`);
  redirect(`/app/renovation/${renovationId}/rooms/${roomId}`);
}

export async function createRenovationWorkPackageAction(renovationId: string, formData: FormData) {
  await createRenovationWorkPackage(renovationId, formData);
  revalidatePath("/app/renovation");
  revalidatePath(`/app/renovation/${renovationId}`);
  redirect(`/app/renovation/${renovationId}`);
}

export async function createRenovationTaskAction(renovationId: string, formData: FormData) {
  await createRenovationTask(renovationId, formData);
  revalidatePath("/app/renovation");
  revalidatePath(`/app/renovation/${renovationId}`);
  redirect(`/app/renovation/${renovationId}`);
}

export async function updateRenovationTaskStatusAction(renovationId: string, formData: FormData) {
  await updateRenovationTaskStatus(renovationId, formData);
  revalidatePath("/app/renovation");
  revalidatePath(`/app/renovation/${renovationId}`);
  redirect(`/app/renovation/${renovationId}`);
}
