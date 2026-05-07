import assert from "node:assert/strict";
import test from "node:test";
import { applyMoneyTransaction, formatCents, parseEuroToCents } from "../lib/money";

test("parseEuroToCents accepts German comma and dot formats", () => {
  assert.equal(parseEuroToCents("10"), 1000);
  assert.equal(parseEuroToCents("10,50"), 1050);
  assert.equal(parseEuroToCents("10.50"), 1050);
  assert.equal(parseEuroToCents("  0,99 € "), 99);
});

test("parseEuroToCents rejects empty, negative and over-precise amounts", () => {
  assert.equal(parseEuroToCents(""), null);
  assert.equal(parseEuroToCents("-1"), null);
  assert.equal(parseEuroToCents("1,234"), null);
  assert.equal(parseEuroToCents("abc"), null);
});

test("formatCents renders German Euro values", () => {
  assert.equal(formatCents(0), "0,00 €");
  assert.equal(formatCents(1050), "10,50 €");
  assert.equal(formatCents(-250), "-2,50 €");
});

test("applyMoneyTransaction updates child balance by transaction type", () => {
  assert.equal(applyMoneyTransaction(1000, "allowance", 500), 1500);
  assert.equal(applyMoneyTransaction(1000, "loan", 250), 750);
  assert.equal(applyMoneyTransaction(1000, "repayment", 250), 1250);
  assert.equal(applyMoneyTransaction(1000, "adjustment", 250), 250);
});
