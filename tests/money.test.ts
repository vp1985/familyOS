import assert from "node:assert/strict";
import test from "node:test";
import { applyMoneyTransaction, formatCents, parseEuroToCents } from "../lib/money";
import { canChildCreateCashAccount, canReverseMoneyTransaction, childCashAccountNameSuggestions, reversalAmountCents } from "../lib/finances";

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
  assert.equal(applyMoneyTransaction(1000, "reversal", -500), 500);
});

test("reversal policies create an offsetting entry only once for manual transactions", () => {
  assert.equal(reversalAmountCents(500), -500);
  assert.equal(reversalAmountCents(-500), 500);
  assert.equal(canReverseMoneyTransaction({ type: "allowance", reversalTransactionId: null, bookedOccurrenceCount: 0 }), true);
  assert.equal(canReverseMoneyTransaction({ type: "loan", reversalTransactionId: "reversal-1", bookedOccurrenceCount: 0 }), false);
  assert.equal(canReverseMoneyTransaction({ type: "reversal", reversalTransactionId: null, bookedOccurrenceCount: 0 }), false);
  assert.equal(canReverseMoneyTransaction({ type: "allowance", reversalTransactionId: null, bookedOccurrenceCount: 1 }), false);
});

test("canChildCreateCashAccount respects parent flag and limit", () => {
  assert.equal(canChildCreateCashAccount({ childCanCreateCashAccounts: true, childCashAccountLimit: 5, existingChildManagedCashAccounts: 4 }), true);
  assert.equal(canChildCreateCashAccount({ childCanCreateCashAccounts: true, childCashAccountLimit: 5, existingChildManagedCashAccounts: 5 }), false);
  assert.equal(canChildCreateCashAccount({ childCanCreateCashAccounts: false, childCashAccountLimit: 5, existingChildManagedCashAccounts: 0 }), false);
});

test("child cash account suggestions include long-term saving goals", () => {
  assert.ok(childCashAccountNameSuggestions.includes("Führerschein"));
  assert.ok(childCashAccountNameSuggestions.includes("Notgroschen"));
});
