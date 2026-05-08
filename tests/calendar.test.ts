import assert from "node:assert/strict";
import test from "node:test";
import {
  buildCalendarEventUpserts,
  buildCalendarSyncPlan,
  formatDayLabel,
  getWeekRange,
  groupEventsByDay,
  parseCalendarEventInput,
  parseCalendarSourceInput,
  parseIcsCalendarEvents,
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

test("parseCalendarSourceInput accepts Google/iCal URLs and optional member", () => {
  assert.deepEqual(
    parseCalendarSourceInput({
      name: "  Schule  ",
      url: " https://calendar.google.com/calendar/ical/example/basic.ics ",
      familyMemberId: " kid-1 ",
    }),
    {
      name: "Schule",
      url: "https://calendar.google.com/calendar/ical/example/basic.ics",
      familyMemberId: "kid-1",
    },
  );

  assert.deepEqual(parseCalendarSourceInput({ name: "x", url: "ftp://example.com/feed.ics" }), { success: false });
});

test("buildCalendarSyncPlan selects enabled sources that were never synced or are stale", () => {
  const plan = buildCalendarSyncPlan({
    now: new Date("2026-05-08T12:00:00.000Z"),
    intervalMinutes: 60,
    sources: [
      { id: "never", syncEnabled: true, lastSyncedAt: null },
      { id: "fresh", syncEnabled: true, lastSyncedAt: new Date("2026-05-08T11:30:00.000Z") },
      { id: "stale", syncEnabled: true, lastSyncedAt: new Date("2026-05-08T10:30:00.000Z") },
      { id: "off", syncEnabled: false, lastSyncedAt: null },
    ],
  });

  assert.deepEqual(plan.map((source) => source.id), ["never", "stale"]);
});

test("parseIcsCalendarEvents reads timed and all-day Google calendar events", () => {
  const events = parseIcsCalendarEvents(`BEGIN:VCALENDAR\nBEGIN:VEVENT\nUID:math-1@example\nSUMMARY:Mathe\nDESCRIPTION:Raum 101\nLOCATION:Aula\nDTSTART:20260511T073000Z\nDTEND:20260511T081500Z\nEND:VEVENT\nBEGIN:VEVENT\nUID:holiday@example\nSUMMARY:Ferientag\nDTSTART;VALUE=DATE:20260512\nDTEND;VALUE=DATE:20260513\nEND:VEVENT\nEND:VCALENDAR`);

  assert.equal(events.length, 2);
  assert.deepEqual(events[0], {
    externalEventId: "math-1@example",
    title: "Mathe",
    description: "Raum 101",
    location: "Aula",
    startsAt: new Date("2026-05-11T07:30:00.000Z"),
    endsAt: new Date("2026-05-11T08:15:00.000Z"),
    allDay: false,
  });
  assert.equal(events[1].allDay, true);
  assert.deepEqual(events[1].startsAt, new Date("2026-05-12T00:00:00.000Z"));
});

test("buildCalendarEventUpserts maps imported events to idempotent source records", () => {
  const upserts = buildCalendarEventUpserts({
    familyId: "family-1",
    sourceId: "source-1",
    familyMemberId: "kid-1",
    createdByUserId: "user-1",
    importedEvents: [
      {
        externalEventId: "math-1@example",
        title: "Mathe",
        description: "Raum 101",
        location: "Aula",
        startsAt: new Date("2026-05-11T07:30:00.000Z"),
        endsAt: new Date("2026-05-11T08:15:00.000Z"),
        allDay: false,
      },
    ],
  });

  assert.equal(upserts.length, 1);
  assert.deepEqual(upserts[0].where, { sourceId_externalEventId: { sourceId: "source-1", externalEventId: "math-1@example" } });
  assert.equal(upserts[0].create.familyId, "family-1");
  assert.equal(upserts[0].create.familyMemberId, "kid-1");
  assert.equal(upserts[0].update.title, "Mathe");
});
