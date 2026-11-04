"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { PlanningDocumentStatus, PlanningStatus, TaskStatus } from "@prisma/client";
import {
  addPlanningGiftLists,
  addPlanningGuests,
  createPlanning,
  createPlanningChecklist,
  createPlanningCostProject,
  createPlanningDocument,
  createPlanningTask,
  updatePlanningChecklistItem,
  updatePlanningDocumentStatus,
  updatePlanningStatus,
  updatePlanningTask,
} from "@/lib/planning";

function revalidatePlanning(planningId: string) {
  revalidatePath("/app");
  revalidatePath("/app/planning");
  revalidatePath(`/app/planning/${planningId}`);
  revalidatePath("/app/calendar");
  revalidatePath("/app/projects");
  revalidatePath("/app/tasks");
  revalidatePath("/app/checklists");
  revalidatePath("/app/kids");
}

export async function createPlanningAction(formData: FormData) {
  const planningId = await createPlanning(formData);
  revalidatePlanning(planningId);
  redirect(`/app/planning/${planningId}`);
}

export async function createPlanningTaskAction(planningId: string, formData: FormData) {
  await createPlanningTask(planningId, formData);
  revalidatePlanning(planningId);
  redirect(`/app/planning/${planningId}`);
}

export async function createPlanningChecklistAction(planningId: string, formData: FormData) {
  await createPlanningChecklist(planningId, formData);
  revalidatePlanning(planningId);
  redirect(`/app/planning/${planningId}`);
}

export async function createPlanningCostProjectAction(planningId: string) {
  const projectId = await createPlanningCostProject(planningId);
  revalidatePlanning(planningId);
  redirect(`/app/projects/${projectId}`);
}

export async function createPlanningDocumentAction(planningId: string, formData: FormData) {
  await createPlanningDocument(planningId, formData);
  revalidatePlanning(planningId);
  redirect(`/app/planning/${planningId}`);
}

export async function addPlanningGuestsAction(planningId: string, formData: FormData) {
  await addPlanningGuests(planningId, formData);
  revalidatePlanning(planningId);
  redirect(`/app/planning/${planningId}`);
}

export async function addPlanningGiftListsAction(planningId: string, formData: FormData) {
  await addPlanningGiftLists(planningId, formData);
  revalidatePlanning(planningId);
  redirect(`/app/planning/${planningId}`);
}

export async function updatePlanningStatusAction(planningId: string, status: PlanningStatus) {
  await updatePlanningStatus(planningId, status);
  revalidatePlanning(planningId);
  redirect(`/app/planning/${planningId}`);
}

export async function updatePlanningDocumentStatusAction(planningId: string, documentId: string, status: PlanningDocumentStatus) {
  await updatePlanningDocumentStatus(planningId, documentId, status);
  revalidatePlanning(planningId);
}

export async function updatePlanningTaskAction(planningId: string, occurrenceId: string, status: TaskStatus) {
  await updatePlanningTask(planningId, occurrenceId, status);
  revalidatePlanning(planningId);
}

export async function checkPlanningChecklistItemAction(planningId: string, itemId: string) {
  await updatePlanningChecklistItem(planningId, itemId, true);
  revalidatePlanning(planningId);
}

export async function uncheckPlanningChecklistItemAction(planningId: string, itemId: string) {
  await updatePlanningChecklistItem(planningId, itemId, false);
  revalidatePlanning(planningId);
}
