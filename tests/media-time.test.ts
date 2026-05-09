import assert from "node:assert/strict";
import test from "node:test";
import {
  buildMediaSummaryForChild,
  isMediaRestrictionActive,
  mediaRestrictionStatusLabel,
  selectApplicableMediaRule,
} from "../lib/media-time";

test("selectApplicableMediaRule picks highest fitting age rule", () => {
  const rule = selectApplicableMediaRule(9, "PHONE", [
    { id: "r1", mediaType: "PHONE", minAgeYears: 8, minutesPerDay: 30, minutesPerWeek: null, childId: null, active: true },
    { id: "r2", mediaType: "PHONE", minAgeYears: 10, minutesPerDay: 45, minutesPerWeek: null, childId: null, active: true },
    { id: "r3", mediaType: "GAMING", minAgeYears: 8, minutesPerDay: 20, minutesPerWeek: null, childId: null, active: true },
  ]);

  assert.equal(rule?.id, "r1");
});

test("selectApplicableMediaRule prefers child-specific rule over age default", () => {
  const rule = selectApplicableMediaRule(11, "PHONE", [
    { id: "age", mediaType: "PHONE", minAgeYears: 10, minutesPerDay: 45, minutesPerWeek: null, childId: null, active: true },
    { id: "child", mediaType: "PHONE", minAgeYears: null, minutesPerDay: 20, minutesPerWeek: null, childId: "child-1", active: true },
  ], "child-1");

  assert.equal(rule?.id, "child");
});

test("isMediaRestrictionActive only treats active restrictions inside the time window as active", () => {
  const now = new Date("2026-05-09T12:00:00.000Z");

  assert.equal(isMediaRestrictionActive({ status: "ACTIVE", startsAt: new Date("2026-05-09T08:00:00.000Z"), endsAt: new Date("2026-05-09T18:00:00.000Z") }, now), true);
  assert.equal(isMediaRestrictionActive({ status: "ACTIVE", startsAt: new Date("2026-05-08T08:00:00.000Z"), endsAt: new Date("2026-05-09T10:00:00.000Z") }, now), false);
  assert.equal(isMediaRestrictionActive({ status: "RELEASED", startsAt: new Date("2026-05-09T08:00:00.000Z"), endsAt: new Date("2026-05-09T18:00:00.000Z") }, now), false);
});

test("buildMediaSummaryForChild shows applicable rules and active restrictions", () => {
  const now = new Date("2026-05-09T12:00:00.000Z");
  const summary = buildMediaSummaryForChild(
    { id: "child-1", birthday: new Date("2016-05-09T00:00:00.000Z") },
    [
      { id: "phone", mediaType: "PHONE", minAgeYears: 8, minutesPerDay: 30, minutesPerWeek: null, childId: null, active: true },
      { id: "game", mediaType: "GAMING", minAgeYears: 12, minutesPerDay: 60, minutesPerWeek: null, childId: null, active: true },
    ],
    [
      { id: "block", mediaType: "APP", status: "ACTIVE", startsAt: new Date("2026-05-09T08:00:00.000Z"), endsAt: new Date("2026-05-09T18:00:00.000Z"), childId: "child-1" },
      { id: "old", mediaType: "PHONE", status: "RELEASED", startsAt: new Date("2026-05-09T08:00:00.000Z"), endsAt: new Date("2026-05-09T18:00:00.000Z"), childId: "child-1" },
    ],
    now,
  );

  assert.equal(summary.ageYears, 10);
  assert.deepEqual(summary.rules.map((rule) => rule.id), ["phone"]);
  assert.deepEqual(summary.activeRestrictions.map((restriction) => restriction.id), ["block"]);
});

test("mediaRestrictionStatusLabel uses friendly German labels", () => {
  assert.equal(mediaRestrictionStatusLabel("ACTIVE"), "Pause läuft");
  assert.equal(mediaRestrictionStatusLabel("ENDED"), "Freischaltung prüfen");
  assert.equal(mediaRestrictionStatusLabel("RELEASED"), "wieder frei");
});
