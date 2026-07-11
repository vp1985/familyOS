import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  buildRenovationProgress,
  groupRenovationTasksByStatus,
  parseRenovationTaskInput,
  parseRenovationWorkPackageInput,
  renovationTaskStatusLabel,
} from "../lib/renovation";

test("parseRenovationWorkPackageInput normalisiert Arbeitspakete", () => {
  assert.deepEqual(parseRenovationWorkPackageInput({ title: "  Wände vorbereiten ", description: "  Spachteln ", roomId: "room-1" }), {
    title: "Wände vorbereiten",
    description: "Spachteln",
    roomId: "room-1",
  });

  assert.deepEqual(parseRenovationWorkPackageInput({ title: "" }), { success: false });
});

test("parseRenovationTaskInput akzeptiert Status, Blocker und optionale Zuordnungen", () => {
  assert.deepEqual(
    parseRenovationTaskInput({
      title: "  Farbe kaufen ",
      status: "BLOCKED",
      blockerNote: "  Farbton fehlt ",
      roomId: "room-1",
      workPackageId: "wp-1",
    }),
    {
      title: "Farbe kaufen",
      description: "",
      status: "BLOCKED",
      blockerNote: "Farbton fehlt",
      roomId: "room-1",
      workPackageId: "wp-1",
    },
  );

  assert.deepEqual(parseRenovationTaskInput({ title: "x", status: "INVALID" }), { success: false });
});

test("buildRenovationProgress berechnet Projektfortschritt und Blocker", () => {
  const progress = buildRenovationProgress([
    { status: "DONE" },
    { status: "IN_PROGRESS" },
    { status: "BLOCKED" },
    { status: "ARCHIVED" },
  ]);

  assert.deepEqual(progress, {
    total: 3,
    done: 1,
    open: 1,
    blocked: 1,
    percent: 33,
    complete: false,
  });
});

test("groupRenovationTasksByStatus liefert stabile Renovierungs-Kanban-Gruppen", () => {
  const groups = groupRenovationTasksByStatus([
    { id: "2", status: "DONE", title: "Streichen" },
    { id: "1", status: "OPEN", title: "Abkleben" },
    { id: "3", status: "BLOCKED", title: "Boden" },
  ]);

  assert.deepEqual(groups.map((group) => group.status), ["OPEN", "PLANNED", "IN_PROGRESS", "BLOCKED", "DONE"]);
  assert.deepEqual(groups.map((group) => group.tasks.length), [1, 0, 0, 1, 1]);
  assert.equal(renovationTaskStatusLabel("BLOCKED"), "Blockiert");
});

test("Renovierungsseite enthält Arbeitspaket- und Aufgaben-Actions", () => {
  const schema = readFileSync("prisma/schema.prisma", "utf8");
  const actions = readFileSync("app/app/renovation/actions.ts", "utf8");
  const detailPage = readFileSync("app/app/renovation/[renovationId]/page.tsx", "utf8");

  assert.match(schema, /model RenovationWorkPackage/);
  assert.match(schema, /model RenovationTask/);
  assert.match(actions, /createRenovationWorkPackageAction/);
  assert.match(actions, /createRenovationTaskAction/);
  assert.match(detailPage, /Arbeitspaket anlegen/);
  assert.match(detailPage, /Aufgabe anlegen/);
});
