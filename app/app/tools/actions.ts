"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireFamilyContext } from "@/lib/family-context";
import { normalizeCompetitionPlayerName } from "@/lib/chess-competition";

export async function createCompetitionPlayerAction(formData: FormData) {
  const { family, user } = await requireFamilyContext();
  const name = normalizeCompetitionPlayerName(String(formData.get("name") ?? ""));

  if (name.length < 2) {
    redirect("/app/tools?player=invalid#chess-clock-title");
  }

  await db.competitionPlayer.upsert({
    where: { familyId_name: { familyId: family.id, name } },
    create: {
      familyId: family.id,
      name,
      createdByUserId: user.id,
    },
    update: {},
  });

  revalidatePath("/app/tools");
  redirect("/app/tools#chess-clock-title");
}
