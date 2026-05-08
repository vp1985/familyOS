import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const requiredFeatures = [
  "Familienprofile",
  "Kinder-Finanzen",
  "gemeinsame Ausgaben",
  "Regeln",
  "Regel-Ereignisse",
  "Folgen",
  "Punkte",
  "Belohnungen",
  "Badges",
  "Start-Dashboard",
  "Wochenplan",
];

test("landing page describes FamilyOS beta and current feature set", () => {
  const source = readFileSync("app/page.tsx", "utf8");

  assert.match(source, /Beta-Variante/);
  assert.doesNotMatch(source, /Sprint 0/);
  assert.doesNotMatch(source, /FamilyOS MVP/);

  for (const feature of requiredFeatures) {
    assert.match(source, new RegExp(feature, "i"));
  }
});
