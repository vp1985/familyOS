import assert from "node:assert/strict";
import test from "node:test";
import {
  canAccessChecklist,
  canAccessChildMember,
  resolveFamilyAdminOrChildScope,
} from "../lib/family-access-policy";

test("owner and admin receive an unrestricted family scope", () => {
  assert.deepEqual(resolveFamilyAdminOrChildScope("owner", null), { childMemberId: null });
  assert.deepEqual(resolveFamilyAdminOrChildScope("admin", "child-1"), { childMemberId: null });
});

test("a child receives only their own family-member scope", () => {
  assert.deepEqual(resolveFamilyAdminOrChildScope("child", "child-1"), { childMemberId: "child-1" });
  assert.throws(() => resolveFamilyAdminOrChildScope("child", null), /Kinderkonto ist keinem Familienprofil zugeordnet/);
});

test("a viewer cannot use admin-or-child family surfaces", () => {
  assert.throws(() => resolveFamilyAdminOrChildScope("viewer", null), /Keine Berechtigung/);
});

test("a child cannot access another child's records", () => {
  const childScope = resolveFamilyAdminOrChildScope("child", "child-1");
  assert.equal(canAccessChildMember(childScope, "child-1"), true);
  assert.equal(canAccessChildMember(childScope, "child-2"), false);
  assert.equal(canAccessChecklist(childScope, "child-1", null), true);
  assert.equal(canAccessChecklist(childScope, null, "child-1"), true);
  assert.equal(canAccessChecklist(childScope, "child-2", "child-2"), false);
});

test("admins can access every child record", () => {
  const adminScope = resolveFamilyAdminOrChildScope("admin", null);
  assert.equal(canAccessChildMember(adminScope, "child-2"), true);
  assert.equal(canAccessChecklist(adminScope, "child-2", null), true);
});
