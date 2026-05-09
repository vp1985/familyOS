import assert from "node:assert/strict";
import test from "node:test";
import { budgetMonthKey, parseBudgetMonth, sumBudgetAmounts, summarizeHouseholdBudget } from "../lib/household-budget";

test("budgetMonthKey returns yyyy-mm in Berlin timezone", () => {
  assert.equal(budgetMonthKey(new Date("2026-05-09T19:00:00Z")), "2026-05");
});

test("parseBudgetMonth accepts valid month and falls back for invalid input", () => {
  assert.equal(parseBudgetMonth("2026-07"), "2026-07");
  assert.match(parseBudgetMonth("bad"), /^\d{4}-\d{2}$/);
});

test("sumBudgetAmounts treats income as plus and expenses as minus", () => {
  assert.equal(sumBudgetAmounts([
    { direction: "INCOME", amountCents: 300000 },
    { direction: "EXPENSE", amountCents: 120000 },
    { direction: "EXPENSE", amountCents: 50000 },
  ]), 130000);
});

test("summarizeHouseholdBudget compares planned and actual monthly household budget", () => {
  const summary = summarizeHouseholdBudget({
    planItems: [
      { direction: "INCOME", amountCents: 300000 },
      { direction: "EXPENSE", amountCents: 100000 },
      { direction: "EXPENSE", amountCents: 50000 },
    ],
    entries: [
      { direction: "INCOME", amountCents: 300000 },
      { direction: "EXPENSE", amountCents: 75000 },
    ],
  });

  assert.equal(summary.plannedIncomeCents, 300000);
  assert.equal(summary.plannedExpenseCents, 150000);
  assert.equal(summary.plannedBalanceCents, 150000);
  assert.equal(summary.actualBalanceCents, 225000);
  assert.equal(summary.remainingExpenseBudgetCents, 75000);
});
