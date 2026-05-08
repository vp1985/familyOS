import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("rules page exposes rule-set import entry and grouped selection controls", () => {
  const source = readFileSync("app/app/rules/page.tsx", "utf8");

  assert.match(source, /Regel-Set übernehmen/);
  assert.match(source, /Altersgruppe/);
  assert.match(source, /Ganze Kategorie übernehmen/);
  assert.match(source, /Ausgewählte Regeln übernehmen/);
  assert.match(source, /name="templateId"/);
  assert.match(source, /name="category"/);
});
