import assert from "node:assert/strict";
import test from "node:test";
import { parseRuleEventInput, parseRuleInput } from "../lib/rules";

test("parseRuleInput trims required fields and normalizes active flag", () => {
  assert.deepEqual(parseRuleInput({
    title: "  Handyzeit  ",
    description: "  Nach 19 Uhr kein Handy  ",
    category: "medien",
    isActive: "on",
  }), {
    title: "Handyzeit",
    description: "Nach 19 Uhr kein Handy",
    category: "medien",
    isActive: true,
  });

  assert.deepEqual(parseRuleInput({ title: "Zimmer", category: "ordnung" }), {
    title: "Zimmer",
    description: "",
    category: "ordnung",
    isActive: true,
  });

  assert.deepEqual(parseRuleInput({ title: "", category: "ordnung" }), { success: false });
  assert.deepEqual(parseRuleInput({ title: "Ok", category: "" }), { success: false });
});

test("parseRuleEventInput requires rule, member and note", () => {
  assert.deepEqual(parseRuleEventInput({
    ruleId: "rule-1",
    familyMemberId: "mia",
    note: "  Tablet länger genutzt  ",
  }), {
    ruleId: "rule-1",
    familyMemberId: "mia",
    note: "Tablet länger genutzt",
  });

  assert.deepEqual(parseRuleEventInput({ ruleId: "", familyMemberId: "mia", note: "Text" }), { success: false });
  assert.deepEqual(parseRuleEventInput({ ruleId: "rule-1", familyMemberId: "", note: "Text" }), { success: false });
  assert.deepEqual(parseRuleEventInput({ ruleId: "rule-1", familyMemberId: "mia", note: "" }), { success: false });
});
