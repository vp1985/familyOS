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

type InvalidInput = { success: false };

export type CalendarEventLike = {
  id: string;
  title: string;
  startsAt: Date;
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

  const [members, events] = await Promise.all([
    db.familyMember.findMany({ where: { familyId: context.family.id }, orderBy: [{ role: "asc" }, { createdAt: "asc" }] }),
    db.calendarEvent.findMany({
      where: {
        familyId: context.family.id,
        startsAt: { gte: week.start, lt: week.end },
      },
      include: { member: true },
      orderBy: { startsAt: "asc" },
    }),
  ]);

  return {
    context,
    members,
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
