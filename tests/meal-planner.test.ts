import assert from "node:assert/strict";
import test from "node:test";
import {
  buildNutritionDishSuggestions,
  getWeekRange,
  groupMealPlansByDay,
  parseMealPlanInput,
} from "../lib/meal-planner";

test("parseMealPlanInput normalizes dish, day, meal kind and VeraVital visibility", () => {
  assert.deepEqual(
    parseMealPlanInput({
      dishName: "  Nudeln mit Tomatensauce  ",
      plannedDate: "2026-05-11",
      mealKind: "DINNER",
      note: "  vegetarisch  ",
      familyMemberId: " mia ",
      visibleInNutrition: "on",
    }),
    {
      dishName: "Nudeln mit Tomatensauce",
      plannedDate: new Date("2026-05-11T00:00:00.000Z"),
      mealKind: "DINNER",
      note: "vegetarisch",
      familyMemberId: "mia",
      visibleInNutrition: true,
      sourceApp: "familyos",
    },
  );

  assert.deepEqual(parseMealPlanInput({ dishName: " Pfannkuchen ", plannedDate: "2026-05-12", mealKind: "" }), {
    dishName: "Pfannkuchen",
    plannedDate: new Date("2026-05-12T00:00:00.000Z"),
    mealKind: "UNSPECIFIED",
    note: "",
    familyMemberId: null,
    visibleInNutrition: true,
    sourceApp: "familyos",
  });
});

test("parseMealPlanInput rejects incomplete or unsupported meal plans", () => {
  assert.deepEqual(parseMealPlanInput({ dishName: "", plannedDate: "2026-05-11", mealKind: "DINNER" }), { success: false });
  assert.deepEqual(parseMealPlanInput({ dishName: "Suppe", plannedDate: "not-a-date", mealKind: "DINNER" }), { success: false });
  assert.deepEqual(parseMealPlanInput({ dishName: "Suppe", plannedDate: "2026-05-11", mealKind: "SNACK" }), { success: false });
});

test("groupMealPlansByDay creates seven German day buckets with meal-kind order", () => {
  const week = getWeekRange(new Date("2026-05-13T12:00:00.000Z"));
  const days = groupMealPlansByDay(
    [
      { id: "2", dishName: "Abendbrot", plannedDate: new Date("2026-05-13T00:00:00.000Z"), mealKind: "DINNER" },
      { id: "1", dishName: "Müsli", plannedDate: new Date("2026-05-13T00:00:00.000Z"), mealKind: "BREAKFAST" },
      { id: "3", dishName: "Montagssuppe", plannedDate: new Date("2026-05-11T00:00:00.000Z"), mealKind: "LUNCH" },
    ],
    week.start,
  );

  assert.equal(days.length, 7);
  assert.equal(days[0].label, "Mo. 11.05.");
  assert.deepEqual(days[2].plans.map((plan) => plan.dishName), ["Müsli", "Abendbrot"]);
});

test("buildNutritionDishSuggestions deduplicates FamilyOS dishes for later VeraVital suggestions", () => {
  const suggestions = buildNutritionDishSuggestions([
    { dishName: "Nudeln", plannedDate: new Date("2026-05-11T00:00:00.000Z"), visibleInNutrition: true },
    { dishName: " nudeln ", plannedDate: new Date("2026-05-12T00:00:00.000Z"), visibleInNutrition: true },
    { dishName: "Geheimes Gericht", plannedDate: new Date("2026-05-13T00:00:00.000Z"), visibleInNutrition: false },
    { dishName: "Pfannkuchen", plannedDate: new Date("2026-05-10T00:00:00.000Z"), visibleInNutrition: true },
  ]);

  assert.deepEqual(suggestions, [
    { dishName: "Nudeln", lastPlannedDate: new Date("2026-05-12T00:00:00.000Z"), sourceApp: "familyos" },
    { dishName: "Pfannkuchen", lastPlannedDate: new Date("2026-05-10T00:00:00.000Z"), sourceApp: "familyos" },
  ]);
});
