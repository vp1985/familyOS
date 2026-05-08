import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("family profile icon and color fields do not overflow on narrow mobile cards", () => {
  const familyPage = readFileSync("app/app/family/page.tsx", "utf8");
  const formField = readFileSync("components/ui/form-field.tsx", "utf8");

  assert.match(familyPage, /grid-cols-1[^\n"]*sm:grid-cols-2/);
  assert.match(formField, /min-w-0/);
  assert.match(formField, /w-full/);
});
