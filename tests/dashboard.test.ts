import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  buildDashboardSummary,
  buildKidsTaskView,
  buildTodayAgenda,
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

test("buildTodayAgenda groups urgent tasks, confirmations and next calendar events", () => {
  const agenda = buildTodayAgenda({
    now: new Date("2026-05-08T09:00:00.000Z"),
    openTasks: [
      { id: "t2", title: "Müll raus", memberName: "Noah", dueAt: new Date("2026-05-08T18:00:00.000Z") },
      { id: "t1", title: "Schultasche", memberName: "Mia", dueAt: new Date("2026-05-08T07:00:00.000Z") },
    ],
    pendingConfirmations: [
      { id: "c1", title: "Zimmer aufgeräumt", memberName: "Mia", doneAt: new Date("2026-05-08T08:30:00.000Z") },
    ],
    upcomingEvents: [
      { id: "e1", title: "Mathe", memberName: "Mia", startsAt: new Date("2026-05-08T10:00:00.000Z") },
      { id: "e2", title: "Training", memberName: "Noah", startsAt: new Date("2026-05-09T16:00:00.000Z") },
    ],
  });

  assert.deepEqual(agenda.todayTasks.map((item) => item.title), ["Schultasche", "Müll raus"]);
  assert.deepEqual(agenda.pendingConfirmations.map((item) => item.title), ["Zimmer aufgeräumt"]);
  assert.equal(agenda.nextEvent?.title, "Mathe");
  assert.equal(agenda.totalActionCount, 3);
});

test("buildKidsTaskView groups child tasks and shows possible rewards without admin items", () => {
  const view = buildKidsTaskView({
    members: [
      { id: "m1", name: "Mia", icon: "🦁" },
      { id: "m2", name: "Noah", icon: null },
    ],
    tasks: [
      { id: "t2", title: "Tisch decken", familyMemberId: "m1", dueAt: new Date("2026-05-08T18:00:00.000Z"), status: "open", drachmenReward: 10, xpReward: 5, moneyRewardCents: null, badgeRewardTitle: null },
      { id: "t1", title: "Schultasche", familyMemberId: "m1", dueAt: new Date("2026-05-08T07:00:00.000Z"), status: "in_progress", drachmenReward: null, xpReward: null, moneyRewardCents: 150, badgeRewardTitle: "Super" },
      { id: "done", title: "Schon erledigt", familyMemberId: "m1", dueAt: new Date("2026-05-08T08:00:00.000Z"), status: "done", drachmenReward: 1, xpReward: null, moneyRewardCents: null, badgeRewardTitle: null },
      { id: "later", title: "Morgen", familyMemberId: "m2", dueAt: new Date("2026-05-09T08:00:00.000Z"), status: "open", drachmenReward: null, xpReward: null, moneyRewardCents: null, badgeRewardTitle: null },
    ],
    now: new Date("2026-05-08T09:00:00.000Z"),
  });

  assert.equal(view.totalOpenTasks, 2);
  assert.deepEqual(view.children.map((child) => child.name), ["Mia", "Noah"]);
  assert.deepEqual(view.children[0].tasks.map((task) => task.title), ["Schultasche", "Tisch decken"]);
  assert.deepEqual(view.children[0].tasks[0].rewardLabels, ["1,50 €", "Badge Super"]);
  assert.deepEqual(view.children[0].tasks[1].rewardLabels, ["10 Drachmen", "5 XP"]);
  assert.deepEqual(view.children[1].tasks, []);
});

test("kids route exposes a child-only action surface", () => {
  const source = readFileSync("app/app/kids/page.tsx", "utf8");

  assert.match(source, /Meine Aufgaben heute|Kinder-Modus/);
  assert.match(source, /Ich hab/);
  assert.doesNotMatch(source, /Regeln|Setup|Admin/);
});

test("dashboard and bottom nav link to kids mode", () => {
  const dashboardSource = readFileSync("app/app/page.tsx", "utf8");
  const navSource = readFileSync("components/layout/bottom-nav.tsx", "utf8");

  assert.match(dashboardSource, /\/app\/kids/);
  assert.match(navSource, /\/app\/kids/);
});

test("formatActivityLine renders German money and point activity labels", () => {
  assert.equal(formatActivityLine({ type: "money", title: "Taschengeld", memberName: "Mia", amountCents: 500 }), "Mia · Taschengeld · +5,00 €");
  assert.equal(formatActivityLine({ type: "points", title: "Belohnung", memberName: "Noah", points: -30 }), "Noah · Belohnung · -30 Punkte");
});
