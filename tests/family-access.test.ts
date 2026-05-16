import assert from "node:assert/strict";
import test from "node:test";
import {
  buildChildAccountEmail,
  normalizeFamilyLoginIdentifier,
  parseChildAccountInput,
} from "../lib/family-access";

test("normalizeFamilyLoginIdentifier creates a lowercase family-safe login slug", () => {
  assert.equal(normalizeFamilyLoginIdentifier("  Familie Müller-Schön  "), "familie-mueller-schoen");
  assert.equal(normalizeFamilyLoginIdentifier("Papa@example.DE"), "papa@example.de");
});

test("parseChildAccountInput normalizes child login and requires separate child password", () => {
  assert.deepEqual(parseChildAccountInput({
    familyMemberId: "child-1",
    loginName: "  Mika Handy ",
    password: "kind-passwort",
    enabled: "on",
  }), {
    familyMemberId: "child-1",
    loginName: "mika-handy",
    password: "kind-passwort",
    enabled: true,
  });

  assert.deepEqual(parseChildAccountInput({ familyMemberId: "", loginName: "mika", password: "kind-passwort" }), { success: false });
  assert.deepEqual(parseChildAccountInput({ familyMemberId: "child-1", loginName: "", password: "kind-passwort" }), { success: false });
  assert.deepEqual(parseChildAccountInput({ familyMemberId: "child-1", loginName: "mika", password: "kurz" }), { success: false });
});

test("buildChildAccountEmail uses synthetic child-only email addresses", () => {
  assert.equal(buildChildAccountEmail("family-123", "mika"), "family-123.mika@kids.familyos.local");
});
