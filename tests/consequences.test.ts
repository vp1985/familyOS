import assert from "node:assert/strict";
import test from "node:test";
import { parseConsequenceInput, parseConsequenceStatusInput } from "../lib/consequences";

test("parseConsequenceInput trims fields and accepts optional rule event and end date", () => {
  assert.deepEqual(parseConsequenceInput({
    title: "  Kein Tablet  ",
    description: "  Ein Tag Pause  ",
    familyMemberId: "mia",
    ruleEventId: "event-1",
    startDate: "2026-05-08",
    endDate: "2026-05-09",
  }), {
    title: "Kein Tablet",
    description: "Ein Tag Pause",
    familyMemberId: "mia",
    ruleEventId: "event-1",
    startDate: "2026-05-08",
    endDate: "2026-05-09",
  });

  assert.deepEqual(parseConsequenceInput({
    title: "Früher ins Bett",
    familyMemberId: "noah",
  }), {
    title: "Früher ins Bett",
    description: "",
    familyMemberId: "noah",
    ruleEventId: "",
    startDate: "",
    endDate: "",
  });

  assert.deepEqual(parseConsequenceInput({ title: "", familyMemberId: "mia" }), { success: false });
  assert.deepEqual(parseConsequenceInput({ title: "Kein Tablet", familyMemberId: "" }), { success: false });
});

test("parseConsequenceStatusInput accepts only known status values", () => {
  assert.deepEqual(parseConsequenceStatusInput("active"), { status: "active" });
  assert.deepEqual(parseConsequenceStatusInput("done"), { status: "done" });
  assert.deepEqual(parseConsequenceStatusInput("cancelled"), { status: "cancelled" });
  assert.deepEqual(parseConsequenceStatusInput("unknown"), { success: false });
  assert.deepEqual(parseConsequenceStatusInput(undefined), { success: false });
});
