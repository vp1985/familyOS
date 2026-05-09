import assert from "node:assert/strict";
import test from "node:test";
import {
  canDeleteChildLedgerEntry,
  entriesVisibleToParents,
  sumChildLedger,
  type ChildLedgerEntryInput,
} from "../lib/child-ledger";

const entries: ChildLedgerEntryInput[] = [
  {
    id: "entry-oma",
    childId: "child-1",
    amountCents: 2000,
    direction: "INCOME",
    title: "Von Oma bekommen",
    visibility: "PARENT_VISIBLE",
    createdByChildId: "child-1",
  },
  {
    id: "entry-eis",
    childId: "child-1",
    amountCents: 250,
    direction: "EXPENSE",
    title: "Eis gekauft",
    visibility: "CHILD_PRIVATE",
    createdByChildId: "child-1",
  },
];

test("sumChildLedger adds income and subtracts expenses", () => {
  assert.equal(sumChildLedger(entries), 1750);
});

test("entriesVisibleToParents hides private child ledger entries", () => {
  assert.deepEqual(entriesVisibleToParents(entries).map((entry) => entry.id), ["entry-oma"]);
});

test("canDeleteChildLedgerEntry only allows child to delete own entries", () => {
  assert.equal(canDeleteChildLedgerEntry(entries[0], "child-1"), true);
  assert.equal(canDeleteChildLedgerEntry(entries[0], "child-2"), false);
  assert.equal(canDeleteChildLedgerEntry({ ...entries[0], createdByChildId: "child-2" }, "child-1"), false);
});
