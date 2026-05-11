import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  calculateProjectBalance,
  parseExpenseInput,
  parseProjectInput,
  splitEvenly,
} from "../lib/projects";

test("parseProjectInput trims title and requires at least one participant", () => {
  assert.deepEqual(parseProjectInput({ title: "  Freizeitpark  ", description: "  Tickets ", participantIds: ["m1", "m2", "m1"] }), {
    title: "Freizeitpark",
    description: "Tickets",
    participantIds: ["m1", "m2"],
  });

  assert.deepEqual(parseProjectInput({ title: "", participantIds: ["m1"] }), { success: false });
  assert.deepEqual(parseProjectInput({ title: "Urlaub", participantIds: [] }), { success: false });
});

test("parseExpenseInput normalizes equal split expense data", () => {
  assert.deepEqual(parseExpenseInput({ title: " Eintritt ", amount: "120,00", paidByMemberId: "papa", shareMemberIds: ["papa", "mia", "mia"] }), {
    title: "Eintritt",
    description: "",
    amountCents: 12000,
    paidByMemberId: "papa",
    shareMemberIds: ["papa", "mia"],
  });

  assert.deepEqual(parseExpenseInput({ title: "Eintritt", amount: "0", paidByMemberId: "papa", shareMemberIds: ["papa"] }), { success: false });
  assert.deepEqual(parseExpenseInput({ title: "Eintritt", amount: "10", paidByMemberId: "", shareMemberIds: ["papa"] }), { success: false });
  assert.deepEqual(parseExpenseInput({ title: "Eintritt", amount: "10", paidByMemberId: "papa", shareMemberIds: [] }), { success: false });
});

test("splitEvenly distributes rounding cents deterministically", () => {
  assert.deepEqual(splitEvenly(10000, ["a"]), [
    { familyMemberId: "a", shareCents: 10000 },
  ]);
  assert.deepEqual(splitEvenly(10000, ["a", "b"]), [
    { familyMemberId: "a", shareCents: 5000 },
    { familyMemberId: "b", shareCents: 5000 },
  ]);
  assert.deepEqual(splitEvenly(10000, ["a", "b", "c"]), [
    { familyMemberId: "a", shareCents: 3334 },
    { familyMemberId: "b", shareCents: 3333 },
    { familyMemberId: "c", shareCents: 3333 },
  ]);
  assert.deepEqual(splitEvenly(10001, ["a", "b", "c", "d"]), [
    { familyMemberId: "a", shareCents: 2501 },
    { familyMemberId: "b", shareCents: 2500 },
    { familyMemberId: "c", shareCents: 2500 },
    { familyMemberId: "d", shareCents: 2500 },
  ]);
});

test("project detail route exposes void and project status actions", () => {
  const detailPage = readFileSync("app/app/projects/[projectId]/page.tsx", "utf8");
  const actions = readFileSync("app/app/projects/actions.ts", "utf8");
  const listPage = readFileSync("app/app/projects/page.tsx", "utf8");

  assert.match(actions, /voidProjectExpenseAction/);
  assert.match(detailPage, /voidProjectExpenseAction/);
  assert.match(detailPage, /Stornieren/);
  assert.match(detailPage, /storniert/);

  assert.match(actions, /updateProjectStatusAction/);
  assert.match(detailPage, /updateProjectStatusAction/);
  assert.match(detailPage, /Abschließen/);
  assert.match(detailPage, /Archivieren/);
  assert.match(detailPage, /Abgeschlossen/);
  assert.match(listPage, /statusLabel/);
});

test("calculateProjectBalance ignores voided expenses and computes net per member", () => {
  const balance = calculateProjectBalance({
    members: [
      { id: "papa", name: "Papa" },
      { id: "mia", name: "Mia" },
      { id: "noah", name: "Noah" },
    ],
    expenses: [
      {
        id: "e1",
        status: "active",
        amountCents: 9000,
        paidByMemberId: "papa",
        shares: [
          { familyMemberId: "papa", shareCents: 3000 },
          { familyMemberId: "mia", shareCents: 3000 },
          { familyMemberId: "noah", shareCents: 3000 },
        ],
      },
      {
        id: "e2",
        status: "active",
        amountCents: 3000,
        paidByMemberId: "mia",
        shares: [
          { familyMemberId: "mia", shareCents: 1500 },
          { familyMemberId: "noah", shareCents: 1500 },
        ],
      },
      {
        id: "e3",
        status: "voided",
        amountCents: 6000,
        paidByMemberId: "noah",
        shares: [
          { familyMemberId: "papa", shareCents: 3000 },
          { familyMemberId: "noah", shareCents: 3000 },
        ],
      },
    ],
  });

  assert.equal(balance.totalCents, 12000);
  assert.deepEqual(balance.rows, [
    { familyMemberId: "papa", name: "Papa", paidCents: 9000, owedShareCents: 3000, netCents: 6000 },
    { familyMemberId: "mia", name: "Mia", paidCents: 3000, owedShareCents: 4500, netCents: -1500 },
    { familyMemberId: "noah", name: "Noah", paidCents: 0, owedShareCents: 4500, netCents: -4500 },
  ]);
});
