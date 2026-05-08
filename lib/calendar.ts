import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireFamilyAdmin, requireFamilyContext } from "@/lib/family-context";

const calendarEventInputSchema = z.object({
  title: z.string().trim().min(2),
  description: z.string().trim().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time: z.string().regex(/^\d{2}:\d{2}$/).optional().or(z.literal("")),
  familyMemberId: z.string().trim().optional(),
});

const calendarSourceInputSchema = z.object({
  name: z.string().trim().min(2),
  url: z.string().trim().url(),
  familyMemberId: z.string().trim().optional(),
});

type InvalidInput = { success: false };

export type CalendarEventLike = {
  id: string;
  title: string;
  startsAt: Date;
};

export type ImportedCalendarEvent = {
  externalEventId: string;
  title: string;
  description: string;
  location: string;
  startsAt: Date;
  endsAt: Date | null;
  allDay: boolean;
};

function invalid(): InvalidInput {
  return { success: false };
}

export function isInvalidInput<T>(input: T | InvalidInput): input is InvalidInput {
  return typeof input === "object" && input !== null && "success" in input && input.success === false;
}

function parseUtcDateTime(date: string, time?: string) {
  const [year, month, day] = date.split("-").map(Number);
  const [hours, minutes] = (time && time.length > 0 ? time : "00:00").split(":").map(Number);

  if (month < 1 || month > 12 || day < 1 || day > 31 || hours > 23 || minutes > 59) return null;

  const value = new Date(Date.UTC(year, month - 1, day, hours, minutes, 0, 0));
  if (value.getUTCFullYear() !== year || value.getUTCMonth() !== month - 1 || value.getUTCDate() !== day) return null;

  return value;
}

export function parseCalendarEventInput(input: {
  title?: string;
  description?: string;
  date?: string;
  time?: string;
  familyMemberId?: string;
}) {
  const parsed = calendarEventInputSchema.safeParse(input);
  if (!parsed.success) return invalid();

  const startsAt = parseUtcDateTime(parsed.data.date, parsed.data.time);
  if (!startsAt) return invalid();

  const familyMemberId = parsed.data.familyMemberId?.trim() || null;

  return {
    title: parsed.data.title,
    description: parsed.data.description ?? "",
    startsAt,
    familyMemberId,
  };
}


export function parseCalendarSourceInput(input: { name?: string; url?: string; familyMemberId?: string }) {
  const parsed = calendarSourceInputSchema.safeParse(input);
  if (!parsed.success) return invalid();

  const url = parsed.data.url;
  if (!url.startsWith("https://") && !url.startsWith("http://")) return invalid();

  return {
    name: parsed.data.name,
    url,
    familyMemberId: parsed.data.familyMemberId?.trim() || null,
  };
}

export function buildCalendarSyncPlan<T extends { syncEnabled: boolean; lastSyncedAt: Date | null }>(input: {
  sources: T[];
  now: Date;
  intervalMinutes: number;
}) {
  const staleBefore = input.now.getTime() - input.intervalMinutes * 60 * 1000;
  return input.sources.filter((source) => source.syncEnabled && (!source.lastSyncedAt || source.lastSyncedAt.getTime() <= staleBefore));
}

function unfoldIcsLines(ics: string) {
  return ics
    .replace(/\r\n/g, "\n")
    .split("\n")
    .reduce<string[]>((lines, line) => {
      if ((line.startsWith(" ") || line.startsWith("\t")) && lines.length > 0) {
        lines[lines.length - 1] += line.slice(1);
      } else {
        lines.push(line);
      }
      return lines;
    }, []);
}

function unescapeIcsText(value = "") {
  return value.replace(/\\n/g, "\n").replace(/\\,/g, ",").replace(/\\;/g, ";").replace(/\\\\/g, "\\").trim();
}

function parseIcsDate(value: string, allDay: boolean) {
  if (allDay) {
    const year = Number(value.slice(0, 4));
    const month = Number(value.slice(4, 6));
    const day = Number(value.slice(6, 8));
    return new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
  }

  const match = value.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z?$/);
  if (!match) return null;
  const [, year, month, day, hours, minutes, seconds] = match;
  return new Date(Date.UTC(Number(year), Number(month) - 1, Number(day), Number(hours), Number(minutes), Number(seconds), 0));
}

export function parseIcsCalendarEvents(ics: string): ImportedCalendarEvent[] {
  const lines = unfoldIcsLines(ics);
  const events: Record<string, string>[] = [];
  let current: Record<string, string> | null = null;

  for (const line of lines) {
    if (line === "BEGIN:VEVENT") {
      current = {};
      continue;
    }
    if (line === "END:VEVENT") {
      if (current) events.push(current);
      current = null;
      continue;
    }
    if (!current) continue;

    const separator = line.indexOf(":");
    if (separator === -1) continue;
    const rawKey = line.slice(0, separator);
    const value = line.slice(separator + 1);
    current[rawKey] = value;
  }

  return events.flatMap((event) => {
    const startKey = Object.keys(event).find((key) => key.startsWith("DTSTART"));
    if (!startKey) return [];
    const endKey = Object.keys(event).find((key) => key.startsWith("DTEND"));
    const allDay = startKey.includes("VALUE=DATE");
    const startsAt = parseIcsDate(event[startKey], allDay);
    if (!startsAt) return [];
    const endsAt = endKey ? parseIcsDate(event[endKey], allDay) : null;

    return [{
      externalEventId: event.UID || `${event[startKey]}-${event.SUMMARY || "event"}`,
      title: unescapeIcsText(event.SUMMARY || "Ohne Titel"),
      description: unescapeIcsText(event.DESCRIPTION || ""),
      location: unescapeIcsText(event.LOCATION || ""),
      startsAt,
      endsAt,
      allDay,
    }];
  });
}

export function buildCalendarEventUpserts(input: {
  familyId: string;
  sourceId: string;
  familyMemberId: string | null;
  createdByUserId: string;
  importedEvents: ImportedCalendarEvent[];
}) {
  return input.importedEvents.map((event) => ({
    where: { sourceId_externalEventId: { sourceId: input.sourceId, externalEventId: event.externalEventId } },
    create: {
      familyId: input.familyId,
      familyMemberId: input.familyMemberId,
      sourceId: input.sourceId,
      externalEventId: event.externalEventId,
      title: event.title,
      description: event.description || null,
      location: event.location || null,
      startsAt: event.startsAt,
      endsAt: event.endsAt,
      allDay: event.allDay,
      createdByUserId: input.createdByUserId,
    },
    update: {
      familyMemberId: input.familyMemberId,
      title: event.title,
      description: event.description || null,
      location: event.location || null,
      startsAt: event.startsAt,
      endsAt: event.endsAt,
      allDay: event.allDay,
    },
  }));
}

export function getWeekRange(referenceDate = new Date()) {
  const start = new Date(Date.UTC(referenceDate.getUTCFullYear(), referenceDate.getUTCMonth(), referenceDate.getUTCDate(), 0, 0, 0, 0));
  const day = start.getUTCDay();
  const offsetToMonday = day === 0 ? -6 : 1 - day;
  start.setUTCDate(start.getUTCDate() + offsetToMonday);

  const end = new Date(start);
  end.setUTCDate(start.getUTCDate() + 7);

  return { start, end };
}

export function formatDayLabel(date: Date) {
  const weekdays = ["So.", "Mo.", "Di.", "Mi.", "Do.", "Fr.", "Sa."];
  const day = String(date.getUTCDate()).padStart(2, "0");
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `${weekdays[date.getUTCDay()]} ${day}.${month}.`;
}

function dayKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function formatTime(date: Date) {
  return `${String(date.getUTCHours()).padStart(2, "0")}:${String(date.getUTCMinutes()).padStart(2, "0")}`;
}

export function groupEventsByDay<T extends CalendarEventLike>(events: T[], weekStart: Date) {
  return Array.from({ length: 7 }).map((_, index) => {
    const date = new Date(weekStart);
    date.setUTCDate(weekStart.getUTCDate() + index);
    const key = dayKey(date);

    return {
      date,
      key,
      label: formatDayLabel(date),
      events: events
        .filter((event) => dayKey(event.startsAt) === key)
        .sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime()),
    };
  });
}

export async function getCalendarPageData() {
  const context = await requireFamilyContext();
  const week = getWeekRange();

  const [members, events, sources] = await Promise.all([
    db.familyMember.findMany({ where: { familyId: context.family.id }, orderBy: [{ role: "asc" }, { createdAt: "asc" }] }),
    db.calendarEvent.findMany({
      where: {
        familyId: context.family.id,
        startsAt: { gte: week.start, lt: week.end },
      },
      include: { member: true, source: true },
      orderBy: { startsAt: "asc" },
    }),
    db.calendarSource.findMany({
      where: { familyId: context.family.id },
      include: { member: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return {
    context,
    members,
    sources,
    week,
    days: groupEventsByDay(events, week.start),
  };
}

export async function createCalendarEvent(formData: FormData) {
  const context = await requireFamilyAdmin();
  const parsed = parseCalendarEventInput({
    title: formData.get("title")?.toString(),
    description: formData.get("description")?.toString(),
    date: formData.get("date")?.toString(),
    time: formData.get("time")?.toString(),
    familyMemberId: formData.get("familyMemberId")?.toString(),
  });

  if (isInvalidInput(parsed)) redirect("/app/calendar?error=invalid-event");

  if (parsed.familyMemberId) {
    const member = await db.familyMember.findFirst({ where: { id: parsed.familyMemberId, familyId: context.family.id } });
    if (!member) redirect("/app/calendar?error=invalid-member");
  }

  await db.calendarEvent.create({
    data: {
      familyId: context.family.id,
      familyMemberId: parsed.familyMemberId,
      title: parsed.title,
      description: parsed.description || null,
      startsAt: parsed.startsAt,
      createdByUserId: context.user.id,
    },
  });
}

export async function syncCalendarSource(source: { id: string; familyId: string; familyMemberId: string | null; url: string; createdByUserId: string }) {
  const response = await fetch(source.url, { cache: "no-store", headers: { "User-Agent": "FamilyOS Calendar Import" } });
  if (!response.ok) throw new Error(`Kalender konnte nicht geladen werden (${response.status})`);

  const ics = await response.text();
  const importedEvents = parseIcsCalendarEvents(ics);
  const upserts = buildCalendarEventUpserts({
    familyId: source.familyId,
    sourceId: source.id,
    familyMemberId: source.familyMemberId,
    createdByUserId: source.createdByUserId,
    importedEvents,
  });

  await db.$transaction([
    ...upserts.map((upsert) => db.calendarEvent.upsert(upsert)),
    db.calendarSource.update({ where: { id: source.id }, data: { lastSyncedAt: new Date(), lastSyncError: null } }),
  ]);

  return importedEvents.length;
}

export async function syncDueCalendarSources(intervalMinutes = 60) {
  const sources = await db.calendarSource.findMany({ where: { syncEnabled: true } });
  const dueSources = buildCalendarSyncPlan({ sources, now: new Date(), intervalMinutes }) as unknown as Array<{ id: string; familyId: string; familyMemberId: string | null; url: string; createdByUserId: string }>;
  const results = [];

  for (const source of dueSources) {
    try {
      const importedCount = await syncCalendarSource(source);
      results.push({ sourceId: source.id, ok: true, importedCount });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Import fehlgeschlagen";
      await db.calendarSource.update({ where: { id: source.id }, data: { lastSyncError: message } });
      results.push({ sourceId: source.id, ok: false, error: message });
    }
  }

  return results;
}

export async function createCalendarSource(formData: FormData) {
  const context = await requireFamilyAdmin();
  const parsed = parseCalendarSourceInput({
    name: formData.get("name")?.toString(),
    url: formData.get("url")?.toString(),
    familyMemberId: formData.get("familyMemberId")?.toString(),
  });

  if (isInvalidInput(parsed)) redirect("/app/calendar?error=invalid-source");

  if (parsed.familyMemberId) {
    const member = await db.familyMember.findFirst({ where: { id: parsed.familyMemberId, familyId: context.family.id } });
    if (!member) redirect("/app/calendar?error=invalid-member");
  }

  const source = await db.calendarSource.create({
    data: {
      familyId: context.family.id,
      familyMemberId: parsed.familyMemberId,
      provider: "google_ical",
      name: parsed.name,
      url: parsed.url,
      createdByUserId: context.user.id,
    },
  });

  try {
    await syncCalendarSource(source);
  } catch (error) {
    await db.calendarSource.update({
      where: { id: source.id },
      data: { lastSyncError: error instanceof Error ? error.message : "Import fehlgeschlagen" },
    });
    redirect("/app/calendar?error=sync-failed");
  }
}

export async function syncCalendarSourceById(sourceId: string) {
  const context = await requireFamilyAdmin();
  const source = await db.calendarSource.findFirst({ where: { id: sourceId, familyId: context.family.id } });
  if (!source) redirect("/app/calendar?error=invalid-source");

  try {
    await syncCalendarSource(source);
  } catch (error) {
    await db.calendarSource.update({
      where: { id: source.id },
      data: { lastSyncError: error instanceof Error ? error.message : "Import fehlgeschlagen" },
    });
    redirect("/app/calendar?error=sync-failed");
  }
}
