import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireFamilyAdmin, requireFamilyContext } from "@/lib/family-context";

export type MealKind = "BREAKFAST" | "LUNCH" | "DINNER" | "UNSPECIFIED";

type InvalidInput = { success: false };

const mealKindOrder: Record<MealKind, number> = {
  BREAKFAST: 1,
  LUNCH: 2,
  DINNER: 3,
  UNSPECIFIED: 4,
};

const mealKindLabels: Record<MealKind, string> = {
  BREAKFAST: "Frühstück",
  LUNCH: "Mittag",
  DINNER: "Abendessen",
  UNSPECIFIED: "Essen",
};

const mealPlanInputSchema = z.object({
  dishName: z.string().trim().min(2),
  plannedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  mealKind: z.enum(["BREAKFAST", "LUNCH", "DINNER", "UNSPECIFIED"]).optional().or(z.literal("")),
  note: z.string().trim().optional(),
  familyMemberId: z.string().trim().optional(),
  visibleInNutrition: z.string().optional(),
});

function invalid(): InvalidInput {
  return { success: false };
}

export function isInvalidInput<T>(input: T | InvalidInput): input is InvalidInput {
  return typeof input === "object" && input !== null && "success" in input && input.success === false;
}

function parseUtcDate(date: string) {
  const [year, month, day] = date.split("-").map(Number);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;

  const value = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
  if (value.getUTCFullYear() !== year || value.getUTCMonth() !== month - 1 || value.getUTCDate() !== day) return null;

  return value;
}

export function parseMealPlanInput(input: {
  dishName?: string;
  plannedDate?: string;
  mealKind?: string;
  note?: string;
  familyMemberId?: string;
  visibleInNutrition?: string;
}) {
  const parsed = mealPlanInputSchema.safeParse(input);
  if (!parsed.success) return invalid();

  const plannedDate = parseUtcDate(parsed.data.plannedDate);
  if (!plannedDate) return invalid();

  return {
    dishName: parsed.data.dishName,
    plannedDate,
    mealKind: (parsed.data.mealKind || "UNSPECIFIED") as MealKind,
    note: parsed.data.note ?? "",
    familyMemberId: parsed.data.familyMemberId?.trim() || null,
    visibleInNutrition: parsed.data.visibleInNutrition !== "off",
    sourceApp: "familyos" as const,
  };
}

export function getWeekRange(referenceDate = new Date()) {
  const start = new Date(Date.UTC(referenceDate.getUTCFullYear(), referenceDate.getUTCMonth(), referenceDate.getUTCDate(), 0, 0, 0, 0));
  const day = start.getUTCDay();
  const offsetToMonday = day === 0 ? -6 : 1 - day;
  start.setUTCDate(start.getUTCDate() + offsetToMonday);

  const end = new Date(start);
  end.setUTCDate(start.getUTCDate() + 7);

  return { start, end };
}

export function formatDayLabel(date: Date) {
  const weekdays = ["So.", "Mo.", "Di.", "Mi.", "Do.", "Fr.", "Sa."];
  const day = String(date.getUTCDate()).padStart(2, "0");
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `${weekdays[date.getUTCDay()]} ${day}.${month}.`;
}

function dayKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

export type MealPlanLike = {
  id: string;
  dishName: string;
  plannedDate: Date;
  mealKind: MealKind | string;
};

export function mealKindLabel(kind: MealKind | string) {
  return mealKindLabels[(kind as MealKind) in mealKindLabels ? (kind as MealKind) : "UNSPECIFIED"];
}

export function groupMealPlansByDay<T extends MealPlanLike>(plans: T[], weekStart: Date) {
  return Array.from({ length: 7 }).map((_, index) => {
    const date = new Date(weekStart);
    date.setUTCDate(weekStart.getUTCDate() + index);
    const key = dayKey(date);

    return {
      date,
      key,
      label: formatDayLabel(date),
      plans: plans
        .filter((plan) => dayKey(plan.plannedDate) === key)
        .sort((a, b) => (mealKindOrder[a.mealKind as MealKind] ?? 99) - (mealKindOrder[b.mealKind as MealKind] ?? 99) || a.dishName.localeCompare(b.dishName, "de")),
    };
  });
}

export function buildNutritionDishSuggestions(plans: Array<{ dishName: string; plannedDate: Date; visibleInNutrition: boolean }>) {
  const byName = new Map<string, { dishName: string; lastPlannedDate: Date; sourceApp: "familyos" }>();

  for (const plan of plans) {
    if (!plan.visibleInNutrition) continue;
    const dishName = plan.dishName.trim();
    if (!dishName) continue;
    const key = dishName.toLocaleLowerCase("de-DE");
    const existing = byName.get(key);
    if (!existing || plan.plannedDate > existing.lastPlannedDate) {
      byName.set(key, { dishName: existing?.dishName ?? dishName, lastPlannedDate: plan.plannedDate, sourceApp: "familyos" });
    }
  }

  return Array.from(byName.values()).sort((a, b) => b.lastPlannedDate.getTime() - a.lastPlannedDate.getTime() || a.dishName.localeCompare(b.dishName, "de"));
}

export async function getMealPlannerPageData() {
  const context = await requireFamilyContext();
  const week = getWeekRange();

  const [members, plans] = await Promise.all([
    db.familyMember.findMany({ where: { familyId: context.family.id }, orderBy: [{ role: "asc" }, { createdAt: "asc" }] }),
    db.mealPlanEntry.findMany({
      where: { familyId: context.family.id, plannedDate: { gte: week.start, lt: week.end } },
      include: { member: true },
      orderBy: [{ plannedDate: "asc" }, { mealKind: "asc" }, { createdAt: "asc" }],
    }),
  ]);

  return { context, members, week, days: groupMealPlansByDay(plans, week.start) };
}

export async function createMealPlanEntry(formData: FormData) {
  const context = await requireFamilyAdmin();
  const parsed = parseMealPlanInput({
    dishName: formData.get("dishName")?.toString(),
    plannedDate: formData.get("plannedDate")?.toString(),
    mealKind: formData.get("mealKind")?.toString(),
    note: formData.get("note")?.toString(),
    familyMemberId: formData.get("familyMemberId")?.toString(),
    visibleInNutrition: formData.get("visibleInNutrition")?.toString() ?? "off",
  });

  if (isInvalidInput(parsed)) redirect("/app/meals?error=invalid-plan");

  if (parsed.familyMemberId) {
    const member = await db.familyMember.findFirst({ where: { id: parsed.familyMemberId, familyId: context.family.id } });
    if (!member) redirect("/app/meals?error=invalid-member");
  }

  await db.mealPlanEntry.create({
    data: {
      familyId: context.family.id,
      familyMemberId: parsed.familyMemberId,
      dishName: parsed.dishName,
      plannedDate: parsed.plannedDate,
      mealKind: parsed.mealKind,
      note: parsed.note || null,
      sourceApp: parsed.sourceApp,
      visibleInNutrition: parsed.visibleInNutrition,
      createdByUserId: context.user.id,
    },
  });
}

export async function getFamilyNutritionSuggestionsForUser(userEmail: string) {
  const familyUsers = await db.familyUser.findMany({
    where: { user: { email: userEmail } },
    include: { family: { include: { mealPlanEntries: true } } },
  });
  return buildNutritionDishSuggestions(familyUsers.flatMap((familyUser) => familyUser.family.mealPlanEntries));
}
