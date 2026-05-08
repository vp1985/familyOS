import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("bottom nav remains usable with many mobile items", () => {
  const source = readFileSync("components/layout/bottom-nav.tsx", "utf8");

  assert.match(source, /overflow-x-auto/);
  assert.match(source, /min-w-\[4\.25rem\]/);
  assert.match(source, /aria-label=\{item\.label\}/);
  assert.doesNotMatch(source, /grid-cols-8/);
});
