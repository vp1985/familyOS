import assert from "node:assert/strict";
import test from "node:test";
import {
  buildDashboardSummary,
  formatActivityLine,
  sortPointLeaders,
} from "../lib/dashboard";

test("buildDashboardSummary counts today-important items and limits recent activity", () => {
  const summary = buildDashboardSummary({
    childCount: 2,
    familyMemberCount: 3,
    totalFinanceCents: 1250,
    activeConsequences: [
      { id: "c1", title: "Tablet-Pause", memberName: "Mia" },
      { id: "c2", title: "Früher schlafen", memberName: "Noah" },
    ],
    activeProjectCount: 4,
    activeRuleCount: 5,
    totalPoints: 42,
    recentMoneyTransactions: [
      { id: "m1", title: "Taschengeld", memberName: "Mia", amountCents: 500 },
      { id: "m2", title: "Buch", memberName: "Noah", amountCents: -300 },
      { id: "m3", title: "Korrektur", memberName: "Mia", amountCents: 100 },
    ],
    recentPointTransactions: [
      { id: "p1", reason: "Zimmer", memberName: "Mia", points: 10 },
      { id: "p2", reason: "Belohnung", memberName: "Noah", points: -5 },
      { id: "p3", reason: "Hilfe", memberName: "Mia", points: 3 },
    ],
  });

  assert.equal(summary.todayImportantCount, 11);
  assert.deepEqual(summary.stats, {
    children: 2,
    familyMembers: 3,
    totalFinanceCents: 1250,
    activeConsequences: 2,
    activeProjects: 4,
    activeRules: 5,
    totalPoints: 42,
  });
  assert.deepEqual(summary.recentActivity.map((activity) => activity.id), ["money-m1", "points-p1", "money-m2", "points-p2"]);
});

test("sortPointLeaders sorts by points descending and then by name", () => {
  const leaders = sortPointLeaders([
    { member: { id: "2", name: "Noah", icon: "🦊" }, points: 10 },
    { member: { id: "1", name: "Mia", icon: "🦁" }, points: 20 },
    { member: { id: "3", name: "Anna", icon: "🐼" }, points: 10 },
  ]);

  assert.deepEqual(leaders.map((leader) => `${leader.member.name}:${leader.points}`), ["Mia:20", "Anna:10", "Noah:10"]);
});

test("formatActivityLine renders German money and point activity labels", () => {
  assert.equal(formatActivityLine({ type: "money", title: "Taschengeld", memberName: "Mia", amountCents: 500 }), "Mia · Taschengeld · +5,00 €");
  assert.equal(formatActivityLine({ type: "points", title: "Belohnung", memberName: "Noah", points: -30 }), "Noah · Belohnung · -30 Punkte");
});
