import assert from "node:assert/strict";
import test from "node:test";
import {
  getRuleTemplateAgeGroups,
  getRuleTemplateCategories,
  getRuleTemplatesForSelection,
  parseRuleTemplateSelection,
  ruleTemplates,
} from "../lib/rule-templates";

test("rule template catalog covers age groups and required categories", () => {
  assert.deepEqual(getRuleTemplateAgeGroups().map((group) => group.id), ["3-5", "6-8", "9-12", "13-15", "16-18"]);

  const categoryIds = getRuleTemplateCategories().map((category) => category.id);
  for (const required of ["medien", "ordnung", "schule", "umgang", "routine", "gesundheit", "sicherheit", "haushalt", "geld"]) {
    assert.ok(categoryIds.includes(required), `missing category ${required}`);
  }

  assert.ok(ruleTemplates.length >= 60, "catalog should contain enough useful starter rules");
  for (const template of ruleTemplates) {
    assert.ok(template.id);
    assert.ok(template.ageGroups.length > 0);
    assert.ok(template.category);
    assert.ok(template.title.length >= 6);
    assert.ok(template.description.length >= 10);
  }
});

test("rule templates can be filtered by age group and category", () => {
  const mediaRules = getRuleTemplatesForSelection({ ageGroup: "6-8", categories: ["medien"] });

  assert.ok(mediaRules.length >= 4);
  assert.ok(mediaRules.every((template) => template.ageGroups.includes("6-8")));
  assert.ok(mediaRules.every((template) => template.category === "medien"));
  assert.ok(mediaRules.some((template) => /Medienzeit|Gerät|YouTube/i.test(template.title + template.description)));
});

test("rule template selection accepts selected template ids and category groups", () => {
  const formData = new FormData();
  formData.append("templateId", "medien-6-8-hausaufgaben-zuerst");
  formData.append("category", "ordnung");
  formData.append("ageGroup", "6-8");

  const selected = parseRuleTemplateSelection(formData);

  assert.ok(!("success" in selected), "valid selection should parse");
  if ("success" in selected) return;
  assert.ok(selected.templateIds.includes("medien-6-8-hausaufgaben-zuerst"));
  assert.ok(selected.templateIds.some((id) => id.startsWith("ordnung-6-8")));
});

test("rule template selection rejects empty or unknown choices", () => {
  const empty = new FormData();
  empty.append("ageGroup", "6-8");
  assert.deepEqual(parseRuleTemplateSelection(empty), { success: false });

  const unknown = new FormData();
  unknown.append("ageGroup", "6-8");
  unknown.append("templateId", "does-not-exist");
  assert.deepEqual(parseRuleTemplateSelection(unknown), { success: false });
});
