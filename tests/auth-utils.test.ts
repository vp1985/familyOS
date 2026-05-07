import assert from "node:assert/strict";
import test from "node:test";
import {
  hashPassword,
  normalizeEmail,
  verifyPassword,
  createSessionToken,
  hashSessionToken,
} from "../lib/auth-utils";

test("normalizeEmail trims and lowercases addresses", () => {
  assert.equal(normalizeEmail("  VALE@Example.DE "), "vale@example.de");
});

test("hashPassword creates a non-plain hash and verifyPassword validates it", async () => {
  const hash = await hashPassword("sicheres-passwort");

  assert.notEqual(hash, "sicheres-passwort");
  assert.equal(await verifyPassword("sicheres-passwort", hash), true);
  assert.equal(await verifyPassword("falsch", hash), false);
});

test("createSessionToken returns a long random token and hashSessionToken is stable", () => {
  const first = createSessionToken();
  const second = createSessionToken();

  assert.ok(first.length >= 40);
  assert.notEqual(first, second);
  assert.equal(hashSessionToken(first), hashSessionToken(first));
  assert.notEqual(hashSessionToken(first), first);
});
