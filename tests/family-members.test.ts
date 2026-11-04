import assert from "node:assert/strict";
import test from "node:test";
import { isArchivableFamilyMember, parseFamilyMemberEditInput, parseFamilyMemberInput } from "../lib/family-members";

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

test("parseFamilyMemberEditInput preserves profile role and applies role defaults", () => {
  assert.deepEqual(parseFamilyMemberEditInput({ name: "  Mia ", color: "", icon: "" }, "child"), {
    name: "Mia",
    color: "emerald",
    icon: "🧒",
  });
  assert.equal(parseFamilyMemberEditInput({ name: " " }, "parent").success, false);
});

test("isArchivableFamilyMember allows child logins but protects parent and archived profiles", () => {
  assert.equal(isArchivableFamilyMember({ archivedAt: null, userRoles: [] }), true);
  assert.equal(isArchivableFamilyMember({ archivedAt: null, userRoles: ["child"] }), true);
  assert.equal(isArchivableFamilyMember({ archivedAt: null, userRoles: ["admin"] }), false);
  assert.equal(isArchivableFamilyMember({ archivedAt: new Date(), userRoles: [] }), false);
});
test("parseFamilyMemberInput rejects empty names and unknown roles", () => {
  assert.equal(parseFamilyMemberInput({ name: " ", role: "child" }).success, false);
  assert.equal(parseFamilyMemberInput({ name: "Alex", role: "admin" }).success, false);
});
