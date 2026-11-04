import assert from "node:assert/strict";
import test from "node:test";
import {
  canReverseMoneyOccurrence,
  moneyOccurrenceStatusLabel,
  monthKey,
  prepareMoneyOccurrencesForMonth,
  sumChildMoneyRules,
  visibleChildMoneyRules,
  type ChildMoneyRuleInput,
} from "../lib/child-money";

const rules: ChildMoneyRuleInput[] = [
  {
    id: "rule-food",
    childId: "child-1",
    title: "Essen gehen",
    amountCents: 1000,
    direction: "INCOME",
    destinationLabel: "bar",
    visibleToChild: true,
    active: true,
  },
  {
    id: "rule-shoes",
    childId: "child-1",
    title: "Schuhe sparen",
    amountCents: 500,
    direction: "INCOME",
    destinationLabel: "Sparkonto",
    visibleToChild: true,
    active: true,
  },
  {
    id: "rule-hidden",
    childId: "child-1",
    title: "Elternkorrektur",
    amountCents: 200,
    direction: "EXPENSE",
    destinationLabel: null,
    visibleToChild: false,
    active: true,
  },
];

test("monthKey returns stable yyyy-mm key", () => {
  assert.equal(monthKey(new Date("2026-05-09T10:00:00Z")), "2026-05");
});

test("visibleChildMoneyRules returns only active child-visible rules", () => {
  const visible = visibleChildMoneyRules([
    ...rules,
    { ...rules[0], id: "inactive", active: false },
  ]);

  assert.deepEqual(visible.map((rule) => rule.id), ["rule-food", "rule-shoes"]);
});

test("sumChildMoneyRules adds income and subtracts expenses", () => {
  assert.equal(sumChildMoneyRules(rules), 1300);
});

test("prepareMoneyOccurrencesForMonth snapshots active rule fields without account math", () => {
  const occurrences = prepareMoneyOccurrencesForMonth(rules, "2026-05");

  assert.deepEqual(occurrences[0], {
    ruleId: "rule-food",
    childId: "child-1",
    dueMonth: "2026-05",
    amountCentsSnapshot: 1000,
    titleSnapshot: "Essen gehen",
    destinationSnapshot: "bar",
    financeAccountIdSnapshot: null,
    autoConfirmSnapshot: false,
  });
  assert.equal(occurrences[1].destinationSnapshot, "Sparkonto");
});

test("a booked monthly position can only be reversed once", () => {
  assert.equal(canReverseMoneyOccurrence({ status: "TRANSFERRED", bookedTransactionId: "booking-1", reversalTransactionId: null }), true);
  assert.equal(canReverseMoneyOccurrence({ status: "OPEN", bookedTransactionId: null, reversalTransactionId: null }), false);
  assert.equal(canReverseMoneyOccurrence({ status: "REVERSED", bookedTransactionId: "booking-1", reversalTransactionId: "reversal-1" }), false);
  assert.equal(canReverseMoneyOccurrence({ status: "TRANSFERRED", bookedTransactionId: "booking-1", reversalTransactionId: "reversal-1" }), false);
});

test("moneyOccurrenceStatusLabel renders child-friendly German labels", () => {
  assert.equal(moneyOccurrenceStatusLabel("OPEN"), "Noch offen");
  assert.equal(moneyOccurrenceStatusLabel("TRANSFERRED"), "Überwiesen");
  assert.equal(moneyOccurrenceStatusLabel("SAVED"), "Gespart / zurückgelegt");
});
