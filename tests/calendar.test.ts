import assert from "node:assert/strict";
import test from "node:test";
import {
  formatDayLabel,
  getWeekRange,
  groupEventsByDay,
  parseCalendarEventInput,
} from "../lib/calendar";

test("parseCalendarEventInput normalizes event fields and optional member", () => {
  assert.deepEqual(
    parseCalendarEventInput({
      title: "  Fußballtraining  ",
      description: "  Turnhalle  ",
      date: "2026-05-11",
      time: "16:30",
      familyMemberId: " mia ",
    }),
    {
      title: "Fußballtraining",
      description: "Turnhalle",
      startsAt: new Date("2026-05-11T16:30:00.000Z"),
      familyMemberId: "mia",
    },
  );

  assert.deepEqual(parseCalendarEventInput({ title: "  Müll raus ", date: "2026-05-12", time: "" }), {
    title: "Müll raus",
    description: "",
    startsAt: new Date("2026-05-12T00:00:00.000Z"),
    familyMemberId: null,
  });
});

test("parseCalendarEventInput rejects invalid or incomplete event data", () => {
  assert.deepEqual(parseCalendarEventInput({ title: "", date: "2026-05-11", time: "12:00" }), { success: false });
  assert.deepEqual(parseCalendarEventInput({ title: "ok", date: "", time: "12:00" }), { success: false });
  assert.deepEqual(parseCalendarEventInput({ title: "ok", date: "2026-05-11", time: "99:99" }), { success: false });
  assert.deepEqual(parseCalendarEventInput({ title: "ok", date: "not-a-date", time: "12:00" }), { success: false });
});

test("getWeekRange starts on Monday and ends on the following Monday", () => {
  assert.deepEqual(getWeekRange(new Date("2026-05-13T12:00:00.000Z")), {
    start: new Date("2026-05-11T00:00:00.000Z"),
    end: new Date("2026-05-18T00:00:00.000Z"),
  });

  assert.deepEqual(getWeekRange(new Date("2026-05-17T12:00:00.000Z")), {
    start: new Date("2026-05-11T00:00:00.000Z"),
    end: new Date("2026-05-18T00:00:00.000Z"),
  });
});

test("groupEventsByDay creates seven ordered German day buckets", () => {
  const week = getWeekRange(new Date("2026-05-13T12:00:00.000Z"));
  const groups = groupEventsByDay(
    [
      { id: "2", title: "Mittag", startsAt: new Date("2026-05-13T12:00:00.000Z") },
      { id: "1", title: "Morgen", startsAt: new Date("2026-05-13T08:00:00.000Z") },
      { id: "3", title: "Montag", startsAt: new Date("2026-05-11T09:00:00.000Z") },
    ],
    week.start,
  );

  assert.equal(groups.length, 7);
  assert.equal(groups[0].label, "Mo. 11.05.");
  assert.deepEqual(groups[2].events.map((event) => event.title), ["Morgen", "Mittag"]);
});

test("formatDayLabel renders compact German weekday labels", () => {
  assert.equal(formatDayLabel(new Date("2026-05-11T00:00:00.000Z")), "Mo. 11.05.");
});
