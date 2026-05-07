import assert from "node:assert/strict";
import test from "node:test";
import { parseFamilyMemberInput } from "../lib/family-members";

test("parseFamilyMemberInput trims child name and applies default child profile values", () => {
  const parsed = parseFamilyMemberInput({
    name: "  Mika  ",
    role: "child",
    color: "",
    icon: "",
  });

  assert.deepEqual(parsed, {
    name: "Mika",
    role: "child",
    color: "emerald",
    icon: "🧒",
  });
});

test("parseFamilyMemberInput accepts parent profile metadata", () => {
  const parsed = parseFamilyMemberInput({
    name: "Vera",
    role: "parent",
    color: "rose",
    icon: "👩",
  });

  assert.deepEqual(parsed, {
    name: "Vera",
    role: "parent",
    color: "rose",
    icon: "👩",
  });
});

test("parseFamilyMemberInput rejects empty names and unknown roles", () => {
  assert.equal(parseFamilyMemberInput({ name: " ", role: "child" }).success, false);
  assert.equal(parseFamilyMemberInput({ name: "Alex", role: "admin" }).success, false);
});
