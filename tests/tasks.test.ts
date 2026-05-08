import assert from "node:assert/strict";
import test from "node:test";
import {
  buildTaskRewardOperations,
  generateTaskOccurrences,
  groupTaskOccurrencesByStatus,
  parseTaskTemplateInput,
  parseTaskStatusInput,
} from "@/lib/tasks";

function fd(entries: Record<string, string | string[]>) {
  const formData = new FormData();
  for (const [key, value] of Object.entries(entries)) {
    if (Array.isArray(value)) {
      value.forEach((item) => formData.append(key, item));
    } else {
      formData.set(key, value);
    }
  }
  return formData;
}

test("parseTaskTemplateInput normalizes assignments, recurrence, subtasks and optional rewards", () => {
  const result = parseTaskTemplateInput(
    fd({
      title: "  Zimmer aufräumen  ",
      description: "  Freitag gründlich  ",
      category: "haushalt",
      priority: "high",
      familyMemberId: ["member-1", "member-2"],
      subtask: [" Bett machen ", "", " Wäsche in den Korb "],
      recurrenceType: "weekdays",
      weekday: ["1", "5"],
      startsAt: "2026-05-11",
      endsAt: "2026-05-31",
      dueTime: "17:30",
      drachmenReward: "25",
      xpReward: "10",
      moneyRewardEuro: "1,50",
      badgeRewardTitle: " Gartenhelfer ",
      badgeRewardIcon: "🌱",
      requiresConfirmation: "on",
    }),
  );

  assert.deepEqual(result, {
    title: "Zimmer aufräumen",
    description: "Freitag gründlich",
    category: "haushalt",
    priority: "high",
    familyMemberIds: ["member-1", "member-2"],
    subtasks: ["Bett machen", "Wäsche in den Korb"],
    recurrenceType: "weekdays",
    weekdays: [1, 5],
    startsAt: new Date("2026-05-11T00:00:00.000Z"),
    endsAt: new Date("2026-05-31T00:00:00.000Z"),
    dueTime: "17:30",
    drachmenReward: 25,
    xpReward: 10,
    moneyRewardCents: 150,
    badgeRewardTitle: "Gartenhelfer",
    badgeRewardIcon: "🌱",
    requiresConfirmation: true,
  });
});

test("parseTaskTemplateInput rejects missing assignees, bad dates and negative rewards", () => {
  assert.deepEqual(parseTaskTemplateInput(fd({ title: "Abwasch", category: "haushalt", startsAt: "2026-05-11" })), { success: false });
  assert.deepEqual(parseTaskTemplateInput(fd({ title: "Abwasch", category: "haushalt", familyMemberId: "m1", startsAt: "falsch" })), { success: false });
  assert.deepEqual(parseTaskTemplateInput(fd({ title: "Abwasch", category: "haushalt", familyMemberId: "m1", startsAt: "2026-05-11", drachmenReward: "-1" })), { success: false });
});

test("generateTaskOccurrences creates per-member occurrences and respects weekday recurrence end date", () => {
  const occurrences = generateTaskOccurrences({
    taskTemplateId: "task-1",
    title: "Müll rausbringen",
    familyMemberIds: ["m1", "m2"],
    recurrenceType: "weekdays",
    weekdays: [1, 3],
    startsAt: new Date("2026-05-11T00:00:00.000Z"),
    endsAt: new Date("2026-05-17T00:00:00.000Z"),
    dueTime: "18:15",
    horizonDays: 30,
    rewards: { drachmenReward: 20, xpReward: 5, moneyRewardCents: 0, badgeRewardTitle: "Müllmeister", badgeRewardIcon: "🗑️" },
  });

  assert.equal(occurrences.length, 4);
  assert.deepEqual(occurrences.map((item) => item.dueAt.toISOString()), [
    "2026-05-11T18:15:00.000Z",
    "2026-05-11T18:15:00.000Z",
    "2026-05-13T18:15:00.000Z",
    "2026-05-13T18:15:00.000Z",
  ]);
  assert.deepEqual(occurrences.map((item) => item.familyMemberId), ["m1", "m2", "m1", "m2"]);
  assert.equal(occurrences[0].drachmenReward, 20);
  assert.equal(occurrences[0].badgeRewardTitle, "Müllmeister");
});

test("groupTaskOccurrencesByStatus returns kanban buckets in stable order", () => {
  const groups = groupTaskOccurrencesByStatus([
    { id: "1", status: "done", titleSnapshot: "A" },
    { id: "2", status: "open", titleSnapshot: "B" },
    { id: "3", status: "confirmed", titleSnapshot: "C" },
    { id: "4", status: "in_progress", titleSnapshot: "D" },
  ]);

  assert.deepEqual(groups.map((group) => group.status), ["open", "in_progress", "done", "confirmed"]);
  assert.deepEqual(groups.map((group) => group.items.map((item) => item.id)), [["2"], ["4"], ["1"], ["3"]]);
});

test("buildTaskRewardOperations creates idempotent reward descriptors for confirmed tasks", () => {
  assert.deepEqual(
    buildTaskRewardOperations({
      occurrenceId: "occ-1",
      familyMemberId: "m1",
      title: "Zimmer aufräumen",
      drachmenReward: 15,
      xpReward: 5,
      moneyRewardCents: 100,
      badgeRewardTitle: "Ordnungsheld",
      badgeRewardIcon: "🧹",
      alreadyBooked: false,
    }),
    {
      pointTransaction: { familyMemberId: "m1", points: 15, reason: "Aufgabe bestätigt: Zimmer aufräumen" },
      moneyTransaction: { familyMemberId: "m1", amountCents: 100, title: "Aufgabenbonus: Zimmer aufräumen" },
      badgeAssignment: { familyMemberId: "m1", title: "Ordnungsheld", icon: "🧹", description: "Erhalten durch Aufgabe: Zimmer aufräumen" },
      xpEvent: { familyMemberId: "m1", xp: 5, reason: "Aufgabe bestätigt: Zimmer aufräumen" },
    },
  );

  assert.deepEqual(buildTaskRewardOperations({ occurrenceId: "occ-1", familyMemberId: "m1", title: "Zimmer", alreadyBooked: true }), {});
});

test("parseTaskStatusInput accepts only known task status transitions", () => {
  assert.deepEqual(parseTaskStatusInput("done"), { status: "done" });
  assert.deepEqual(parseTaskStatusInput("confirmed"), { status: "confirmed" });
  assert.deepEqual(parseTaskStatusInput("deleted"), { success: false });
});
