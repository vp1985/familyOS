import assert from "node:assert/strict";
import test from "node:test";
import { catalogTemplateToRows, checklistCatalog, checklistKindLabel, checklistProgress, checklistProgressLabel, getChecklistCatalogTemplate, prepareChecklistInstance } from "../lib/checklists";

test("checklistProgress counts done and required items", () => {
  const progress = checklistProgress([
    { checked: true, requiredSnapshot: true },
    { checked: false, requiredSnapshot: true },
    { checked: false, requiredSnapshot: false },
  ]);

  assert.deepEqual(progress, { total: 3, done: 1, required: 2, requiredDone: 1, complete: false });
  assert.equal(checklistProgressLabel([{ checked: true }, { checked: false }]), "1/2 erledigt");
});

test("checklistProgress is complete when all required items are checked", () => {
  const progress = checklistProgress([
    { checked: true, requiredSnapshot: true },
    { checked: false, requiredSnapshot: false },
  ]);

  assert.equal(progress.complete, true);
});

test("prepareChecklistInstance snapshots template fields and items", () => {
  const instance = prepareChecklistInstance({
    template: {
      id: "tpl-1",
      title: "Schwimmbad",
      category: "Ausflug",
      kind: "PACKING",
      items: [
        { title: "Handtuch", note: null, quantityLabel: "1x", required: true, sortOrder: 0 },
        { title: "Snack", note: "optional", quantityLabel: null, required: false, sortOrder: 1 },
      ],
    },
    assignedFamilyMemberId: "child-1",
    taskOccurrenceId: "task-1",
  });

  assert.equal(instance.titleSnapshot, "Schwimmbad");
  assert.equal(instance.kindSnapshot, "PACKING");
  assert.equal(instance.assignedFamilyMemberId, "child-1");
  assert.equal(instance.items[0].titleSnapshot, "Handtuch");
  assert.equal(instance.items[0].quantityLabelSnapshot, "1x");
});

test("checklistKindLabel renders German labels", () => {
  assert.equal(checklistKindLabel("PACKING"), "Rüstliste");
  assert.equal(checklistKindLabel("GENERAL"), "Checkliste");
});

test("checklist catalog contains reusable templates for outings, vacation and routines", () => {
  const ids = checklistCatalog.map((template) => template.id);
  assert.ok(ids.includes("ausflug-tagesrucksack"));
  assert.ok(ids.includes("urlaub-kinderkoffer"));
  assert.ok(ids.includes("morgenroutine"));
  assert.ok(ids.includes("kuechendienst"));
  assert.ok(checklistCatalog.every((template) => template.items.length >= 5));
});

test("catalog templates can be copied into family checklist templates", () => {
  const template = getChecklistCatalogTemplate("schwimmbad-badesee");
  assert.ok(template);
  const rows = catalogTemplateToRows(template);

  assert.equal(rows[0].title, "Badesachen");
  assert.equal(rows[0].required, true);
  assert.equal(rows[0].sortOrder, 0);
  assert.equal(rows.some((row) => row.required === false), true);
});
