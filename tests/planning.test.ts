import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import type { Prisma } from "@prisma/client";
import { getChecklistCatalogTemplate } from "../lib/checklists";
import {
  buildPlanningProgress,
  parsePlanningDocumentInput,
  parsePlanningInput,
  parsePlanningTaskInput,
  persistPlanningCostProjectWithTransaction,
  persistPlanningWithTransaction,
  planningLinksBelongToFamily,
  planningProjectStatus,
  planningTypeLabel,
} from "../lib/planning";

test("parsePlanningInput normalisiert eine Urlaubsplanung mit verknüpften Modulen", () => {
  const parsed = parsePlanningInput({
    type: "VACATION",
    title: "  Sommerurlaub  ",
    description: "  Nordsee  ",
    location: "  Büsum  ",
    startDate: "2026-08-01",
    endDate: "2026-08-12",
    participantIds: [" m1 ", "m2", "m1"],
    guestContactIds: ["c1", "c1"],
    giftListIds: ["g1", "g1"],
    checklistTemplateIds: ["l1", "l2", "l1"],
    createCostProject: true,
    addStarterChecklist: true,
  });

  assert.deepEqual(parsed, {
    type: "VACATION",
    title: "Sommerurlaub",
    description: "Nordsee",
    location: "Büsum",
    startsAt: new Date("2026-08-01T00:00:00.000Z"),
    endsAt: new Date("2026-08-12T00:00:00.000Z"),
    participantIds: ["m1", "m2"],
    guestContactIds: ["c1"],
    giftListIds: ["g1"],
    checklistTemplateIds: ["l1", "l2"],
    createCostProject: true,
    addStarterChecklist: true,
  });
});

test("parsePlanningInput unterstützt Geburtstage, Besuche und Ausflüge und prüft Zeiträume", () => {
  const birthday = parsePlanningInput({
    type: "BIRTHDAY",
    title: "Mias Geburtstag",
    startDate: "2026-09-03",
    participantIds: ["m1"],
  });

  assert.equal("success" in birthday, false);
  if (!("success" in birthday)) {
    assert.equal(birthday.endsAt.toISOString(), "2026-09-03T00:00:00.000Z");
  }
  assert.equal(planningTypeLabel("BIRTHDAY"), "Geburtstag");
  assert.equal(planningTypeLabel("VACATION"), "Urlaub");
  assert.equal(planningTypeLabel("VISIT"), "Besuch");
  assert.equal(planningTypeLabel("OUTING"), "Ausflug");

  assert.deepEqual(parsePlanningInput({ type: "VACATION", title: "Urlaub", startDate: "2026-08-02", participantIds: ["m1"] }), { success: false });
  assert.deepEqual(parsePlanningInput({ type: "VACATION", title: "Urlaub", startDate: "2026-08-12", endDate: "2026-08-02", participantIds: ["m1"] }), { success: false });
  assert.deepEqual(parsePlanningInput({ type: "OTHER", title: "Termin", startDate: "2026-08-02", participantIds: ["m1"] }), { success: false });
  assert.deepEqual(parsePlanningInput({ type: "OUTING", title: "Zoo", startDate: "kaputt", participantIds: ["m1"] }), { success: false });
  assert.deepEqual(parsePlanningInput({ type: "OUTING", title: "Zoo", startDate: "2026-08-02", participantIds: [] }), { success: false });
});

test("jeder Planungstyp besitzt eine konkrete Starterliste", () => {
  for (const id of ["geburtstag-vorbereitung", "urlaub-kinderkoffer", "besuch-vorbereitung", "ausflug-tagesrucksack"]) {
    const template = getChecklistCatalogTemplate(id);
    assert.ok(template, `${id} fehlt im Checklistenkatalog`);
    assert.ok(template.items.length >= 5, `${id} enthält zu wenige konkrete Punkte`);
  }
});

test("Planungsaufgaben und Dokumente validieren Zuständigkeiten", () => {
  assert.deepEqual(parsePlanningTaskInput({ title: " Tickets buchen ", familyMemberId: " m1 ", dueDate: "2026-07-20" }), {
    title: "Tickets buchen",
    familyMemberId: "m1",
    dueAt: new Date("2026-07-20T00:00:00.000Z"),
  });
  assert.deepEqual(parsePlanningTaskInput({ title: "", familyMemberId: "m1", dueDate: "2026-07-20" }), { success: false });
  assert.deepEqual(parsePlanningTaskInput({ title: "Tickets", familyMemberId: "", dueDate: "2026-07-20" }), { success: false });

  assert.deepEqual(parsePlanningDocumentInput({ title: " Reisepässe ", familyMemberId: " m2 ", note: " gültig prüfen " }), {
    title: "Reisepässe",
    familyMemberId: "m2",
    note: "gültig prüfen",
  });
  assert.deepEqual(parsePlanningDocumentInput({ title: "", familyMemberId: "m2" }), { success: false });
});

test("buildPlanningProgress bündelt Aufgaben, Listen und Dokumente", () => {
  assert.deepEqual(buildPlanningProgress({
    tasks: [{ status: "open" }, { status: "done" }, { status: "confirmed" }, { status: "skipped" }],
    checklists: [{ items: [{ checked: true }, { checked: false }, { checked: false, requiredSnapshot: false }] }, { items: [{ checked: true }] }],
    documents: [{ status: "OPEN" }, { status: "READY" }],
  }), {
    tasks: { done: 3, total: 4 },
    checklistItems: { done: 2, total: 3 },
    documents: { done: 1, total: 2 },
    done: 6,
    total: 9,
  });
});

test("Planung schreibt Kalender, Kosten, Beteiligte und Starterliste in denselben Transaktionsablauf", async () => {
  const parsed = parsePlanningInput({
    type: "VACATION",
    title: "Nordsee",
    description: "Familienurlaub",
    location: "Büsum",
    startDate: "2026-08-10",
    endDate: "2026-08-17",
    participantIds: ["member-1", "member-2"],
    guestContactIds: ["contact-1"],
    giftListIds: ["gift-1"],
    checklistTemplateIds: [],
    createCostProject: true,
    addStarterChecklist: true,
  });
  if ("success" in parsed) throw new Error("Testplanung wurde nicht validiert");

  const writes: Record<string, Array<Record<string, unknown>>> = {
    calendar: [], project: [], planning: [], checklist: [],
  };
  const transaction = {
    calendarEvent: { create: async ({ data }: { data: Record<string, unknown> }) => { writes.calendar.push(data); return { id: "calendar-1" }; } },
    project: { create: async ({ data }: { data: Record<string, unknown> }) => { writes.project.push(data); return { id: "project-1" }; } },
    planningEvent: { create: async ({ data }: { data: Record<string, unknown> }) => { writes.planning.push(data); return { id: "planning-1" }; } },
    checklistInstance: { create: async ({ data }: { data: Record<string, unknown> }) => { writes.checklist.push(data); return { id: `checklist-${writes.checklist.length}` }; } },
  } as unknown as Prisma.TransactionClient;

  const planningId = await persistPlanningWithTransaction(transaction, {
    familyId: "family-1",
    userId: "user-1",
    parsed,
    templates: [],
  });

  assert.equal(planningId, "planning-1");
  assert.equal(writes.calendar.length, 1);
  assert.equal(writes.project.length, 1);
  assert.equal(writes.planning.length, 1);
  assert.equal(writes.checklist.length, 1);
  assert.equal(writes.calendar[0].title, "Nordsee");
  assert.equal(writes.calendar[0].familyId, "family-1");
  assert.equal(writes.planning[0].calendarEventId, "calendar-1");
  assert.equal(writes.planning[0].costProjectId, "project-1");
  assert.equal("title" in writes.planning[0], false, "Der Kalender muss einzige Terminquelle bleiben");
  assert.deepEqual(writes.planning[0].members, { create: [
    { familyId: "family-1", familyMemberId: "member-1" },
    { familyId: "family-1", familyMemberId: "member-2" },
  ] });
  assert.equal(writes.checklist[0].planningEventId, "planning-1");
});

test("Kostenprojekte übernehmen den Planungsstatus", () => {
  assert.equal(planningProjectStatus("ACTIVE"), "active");
  assert.equal(planningProjectStatus("DONE"), "done");
  assert.equal(planningProjectStatus("ARCHIVED"), "archived");
});

test("Kostenprojekt-Claim gleicht einen gleichzeitig geänderten Planungsstatus ab", async () => {
  const projectStatuses: string[] = [];
  const transaction = {
    project: {
      create: async ({ data }: { data: { status: string } }) => {
        projectStatuses.push(data.status);
        return { id: "project-new" };
      },
      update: async ({ data }: { data: { status: string } }) => {
        projectStatuses.push(data.status);
        return { id: "project-new" };
      },
    },
    planningEvent: {
      updateMany: async () => ({ count: 1 }),
      findUnique: async () => ({ status: "DONE" }),
    },
  } as unknown as Prisma.TransactionClient;

  const projectId = await persistPlanningCostProjectWithTransaction(transaction, {
    planningId: "planning-1",
    familyId: "family-1",
    userId: "user-1",
    type: "BIRTHDAY",
    status: "ACTIVE",
    title: "Geburtstag",
    description: null,
    members: [{ familyMemberId: "member-1" }],
    guests: [],
  });

  assert.equal(projectId, "project-new");
  assert.deepEqual(projectStatuses, ["active", "done"]);
});

test("gleichzeitige Kostenprojekt-Erstellung entfernt den Verlierer und liefert den bestehenden Link", async () => {
  let projectData: Record<string, unknown> | undefined;
  let claimWhere: Record<string, unknown> | undefined;
  const deletedProjectIds: string[] = [];
  const transaction = {
    project: {
      create: async ({ data }: { data: Record<string, unknown> }) => {
        projectData = data;
        return { id: "project-new" };
      },
      delete: async ({ where }: { where: { id: string } }) => {
        deletedProjectIds.push(where.id);
        return { id: where.id };
      },
    },
    planningEvent: {
      updateMany: async ({ where }: { where: Record<string, unknown> }) => {
        claimWhere = where;
        return { count: 0 };
      },
      findUnique: async () => ({ costProjectId: "project-existing" }),
    },
  } as unknown as Prisma.TransactionClient;

  const projectId = await persistPlanningCostProjectWithTransaction(transaction, {
    planningId: "planning-1",
    familyId: "family-1",
    userId: "user-1",
    type: "BIRTHDAY",
    status: "ARCHIVED",
    title: "Geburtstag",
    description: null,
    members: [{ familyMemberId: "member-1" }],
    guests: [],
  });

  assert.equal(projectId, "project-existing");
  assert.equal(projectData?.status, "archived");
  assert.deepEqual(claimWhere, { id: "planning-1", familyId: "family-1", costProjectId: null });
  assert.deepEqual(deletedProjectIds, ["project-new"]);
});

test("familienfremde Verknüpfungen werden vor dem Persistieren abgelehnt", () => {
  const links = {
    participantIds: ["m1", "m2"],
    guestContactIds: ["c1"],
    giftListIds: ["g1"],
    checklistTemplateIds: ["t1"],
  };
  const validCounts = { members: 2, contacts: 1, giftLists: 1, templates: 1 };
  assert.equal(planningLinksBelongToFamily(links, validCounts), true);
  for (const key of Object.keys(validCounts) as Array<keyof typeof validCounts>) {
    assert.equal(planningLinksBelongToFamily(links, { ...validCounts, [key]: validCounts[key] - 1 }), false, `${key} darf nicht familienfremd sein`);
  }
});

test("Planung ist als integrierter App-Bereich mit allen Klammerpunkten verdrahtet", () => {
  const schema = readFileSync("prisma/schema.prisma", "utf8");
  const nav = readFileSync("components/layout/bottom-nav.tsx", "utf8");
  const dashboard = readFileSync("app/app/page.tsx", "utf8");
  const overview = readFileSync("app/app/planning/page.tsx", "utf8");
  const detail = readFileSync("app/app/planning/[planningId]/page.tsx", "utf8");
  const calendar = readFileSync("app/app/calendar/page.tsx", "utf8");
  const actions = readFileSync("app/app/planning/actions.ts", "utf8");
  const planningModel = schema.slice(schema.indexOf("model PlanningEvent"), schema.indexOf("model PlanningMember"));

  assert.match(schema, /model PlanningEvent/);
  assert.match(schema, /model PlanningGuest/);
  assert.match(schema, /model PlanningGiftList/);
  assert.match(schema, /model PlanningDocument/);
  assert.match(schema, /planningEventId\s+String\?/);
  assert.match(planningModel, /calendarEventId\s+String\s+@unique/);
  assert.doesNotMatch(planningModel, /\n\s+title\s+String/);
  assert.doesNotMatch(planningModel, /\n\s+startsAt\s+DateTime/);
  assert.match(nav, /href: "\/app\/planning", label: "Planung"/);
  assert.match(dashboard, /href="\/app\/planning"/);
  assert.match(overview, /Geburtstage, Urlaube, Besuche & Ausflüge/);
  assert.match(detail, /Gäste & Einkaufshinweise/);
  assert.match(detail, /Aufgaben & Zuständigkeiten/);
  assert.match(detail, /Checklisten & Packlisten/);
  assert.match(detail, /Dokumente/);
  assert.match(detail, /Kostenprojekt/);
  assert.match(detail, /Geschenklisten/);
  assert.match(detail, /giftList\.giftIdeas\.map/);
  assert.match(detail, /\/app\/calendar\?week=/);
  assert.match(calendar, /Zugehörige Planung öffnen/);
  assert.match(actions, /createPlanningAction/);
  assert.match(actions, /createPlanningTaskAction/);
  assert.match(actions, /createPlanningChecklistAction/);
  assert.match(actions, /createPlanningCostProjectAction/);
  assert.match(actions, /createPlanningDocumentAction/);
});
