import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("tasks routes expose kanban, recurrence and reward fields", () => {
  const tasksPage = readFileSync("app/app/tasks/page.tsx", "utf8");
  const newPage = readFileSync("app/app/tasks/new/page.tsx", "utf8");
  const nav = readFileSync("components/layout/bottom-nav.tsx", "utf8");
  const dashboard = readFileSync("app/app/page.tsx", "utf8");

  assert.match(tasksPage, /Aufgaben/);
  assert.match(tasksPage, /Heute offen/);
  assert.match(tasksPage, /Offen/);
  assert.match(tasksPage, /In Arbeit/);
  assert.match(tasksPage, /Erledigt/);
  assert.match(tasksPage, /Bestätigt/);
  assert.match(tasksPage, /confirmTaskOccurrenceAction/);

  assert.match(newPage, /Unteraufgaben/);
  assert.match(newPage, /Wiederholung/);
  assert.match(newPage, /Enddatum/);
  assert.match(newPage, /Drachmen/);
  assert.match(newPage, /XP/);
  assert.match(newPage, /Geldbonus/);
  assert.match(newPage, /Badge/);

  assert.match(nav, /\/app\/tasks/);
  assert.match(nav, /Aufgaben/);
  assert.match(dashboard, /Heute offene Aufgaben/);
});
