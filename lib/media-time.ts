import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireFamilyAdmin, requireFamilyContext } from "@/lib/family-context";

export type MediaType = "PHONE" | "GAMING" | "WATCHING" | "TABLET" | "APP" | "OTHER";
export type MediaRestrictionType = "BLOCKED" | "REDUCED" | "PARENT_APPROVAL_REQUIRED" | "CONVERTED_TO_EDUCATION";
export type MediaRestrictionStatus = "ACTIVE" | "ENDED" | "RELEASED" | "CANCELLED";
export type EducationCategoryKey = "reading" | "learning" | "math" | "vocabulary";

export type MediaAllowanceRuleInput = {
  id: string;
  childId: string | null;
  mediaType: MediaType;
  minAgeYears: number | null;
  minutesPerDay: number | null;
  minutesPerWeek: number | null;
  active: boolean;
};

export type MediaRestrictionInput = {
  id: string;
  childId: string;
  mediaType: MediaType;
  status: MediaRestrictionStatus;
  startsAt: Date;
  endsAt: Date;
  restrictionType?: MediaRestrictionType;
  reducedMinutes?: number | null;
  convertedToEducationMinutes?: number | null;
  educationCategoryKey?: string | null;
  linkedTaskOccurrenceId?: string | null;
  childVisibleReasonLabel?: string | null;
};

export const MEDIA_TYPE_OPTIONS: Array<{ value: MediaType; label: string }> = [
  { value: "PHONE", label: "Handy" },
  { value: "GAMING", label: "Zocken" },
  { value: "WATCHING", label: "Gucken" },
  { value: "TABLET", label: "Tablet" },
  { value: "APP", label: "App" },
  { value: "OTHER", label: "Sonstiges" },
];

export const MEDIA_RESTRICTION_TYPE_OPTIONS: Array<{ value: MediaRestrictionType; label: string }> = [
  { value: "BLOCKED", label: "gesperrt" },
  { value: "REDUCED", label: "reduziert" },
  { value: "PARENT_APPROVAL_REQUIRED", label: "nur nach Freigabe" },
  { value: "CONVERTED_TO_EDUCATION", label: "in Fokuszeit umgebucht" },
];

export const EDUCATION_CATEGORY_OPTIONS: Array<{ value: EducationCategoryKey; label: string; taskNoun: string }> = [
  { value: "reading", label: "Lesen", taskNoun: "lesen" },
  { value: "learning", label: "Lernzeit", taskNoun: "Lernzeit" },
  { value: "math", label: "Mathe", taskNoun: "Mathe üben" },
  { value: "vocabulary", label: "Vokabeln", taskNoun: "Vokabeln üben" },
];

const mediaRuleSchema = z.object({
  childId: z.string().trim().optional(),
  mediaType: z.enum(["PHONE", "GAMING", "WATCHING", "TABLET", "APP", "OTHER"]),
  minAgeYears: z.coerce.number().int().min(0).max(18).optional().nullable(),
  minutesPerDay: z.coerce.number().int().min(0).max(1440).optional().nullable(),
  minutesPerWeek: z.coerce.number().int().min(0).max(10080).optional().nullable(),
  note: z.string().trim().optional(),
});

const mediaRestrictionSchema = z.object({
  childId: z.string().trim().min(1),
  mediaType: z.enum(["PHONE", "GAMING", "WATCHING", "TABLET", "APP", "OTHER"]),
  appOrDeviceLabel: z.string().trim().optional(),
  restrictionType: z.enum(["BLOCKED", "REDUCED", "PARENT_APPROVAL_REQUIRED", "CONVERTED_TO_EDUCATION"]),
  reducedMinutes: z.coerce.number().int().min(0).max(1440).optional().nullable(),
  convertedToEducationMinutes: z.coerce.number().int().min(0).max(1440).optional().nullable(),
  educationCategoryKey: z.enum(["reading", "learning", "math", "vocabulary"]).optional().nullable(),
  childVisibleReasonLabel: z.string().trim().max(60).optional(),
  startsAt: z.string().trim().min(1),
  endsAt: z.string().trim().min(1),
  reasonNote: z.string().trim().optional(),
  ruleEventId: z.string().trim().optional(),
  remindAt: z.string().trim().optional(),
});

export function mediaTypeLabel(type: MediaType | string) {
  return MEDIA_TYPE_OPTIONS.find((option) => option.value === type)?.label ?? "Medienzeit";
}

export function mediaRestrictionTypeLabel(type: MediaRestrictionType | string) {
  return MEDIA_RESTRICTION_TYPE_OPTIONS.find((option) => option.value === type)?.label ?? "eingeschränkt";
}

export function educationCategoryLabel(categoryKey: string | null | undefined) {
  return EDUCATION_CATEGORY_OPTIONS.find((option) => option.value === categoryKey)?.label ?? "Fokuszeit";
}

export function buildEducationOptionsForMediaConversion(minutes: number) {
  const safeMinutes = Math.max(0, Math.trunc(minutes));
  return EDUCATION_CATEGORY_OPTIONS.map((option) => ({
    key: option.value,
    minutes: safeMinutes,
    label: `${safeMinutes} Minuten ${option.taskNoun}`,
  }));
}

function educationTaskTitle(minutes: number, categoryKey: EducationCategoryKey) {
  return buildEducationOptionsForMediaConversion(minutes).find((option) => option.key === categoryKey)?.label ?? `${minutes} Minuten Fokuszeit`;
}

export function mediaRestrictionStatusLabel(status: MediaRestrictionStatus | string) {
  if (status === "RELEASED") return "wieder frei";
  if (status === "CANCELLED") return "aufgehoben";
  if (status === "ENDED") return "Freischaltung prüfen";
  return "Pause läuft";
}

export function calculateAgeYears(birthday: Date | null | undefined, now = new Date()) {
  if (!birthday) return null;
  let age = now.getFullYear() - birthday.getFullYear();
  const monthDiff = now.getMonth() - birthday.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birthday.getDate())) age -= 1;
  return age;
}

export function selectApplicableMediaRule(
  childAgeYears: number | null,
  mediaType: MediaType,
  rules: MediaAllowanceRuleInput[],
  childId?: string,
) {
  const activeRules = rules.filter((rule) => rule.active && rule.mediaType === mediaType);
  const childRules = childId ? activeRules.filter((rule) => rule.childId === childId) : [];
  if (childRules.length > 0) {
    return childRules.sort((a, b) => (b.minAgeYears ?? -1) - (a.minAgeYears ?? -1))[0];
  }

  return activeRules
    .filter((rule) => !rule.childId)
    .filter((rule) => {
      if (rule.minAgeYears === null || rule.minAgeYears === undefined) return true;
      return childAgeYears !== null && childAgeYears >= rule.minAgeYears;
    })
    .sort((a, b) => (b.minAgeYears ?? -1) - (a.minAgeYears ?? -1))[0] ?? null;
}

export function isMediaRestrictionActive(restriction: Pick<MediaRestrictionInput, "status" | "startsAt" | "endsAt">, now = new Date()) {
  return restriction.status === "ACTIVE" && restriction.startsAt <= now && restriction.endsAt >= now;
}

export function isMediaRestrictionExpired(restriction: Pick<MediaRestrictionInput, "status" | "endsAt">, now = new Date()) {
  return restriction.status === "ACTIVE" && restriction.endsAt < now;
}

export function buildMediaSummaryForChild(
  child: { id: string; birthday?: Date | null },
  rules: MediaAllowanceRuleInput[],
  restrictions: MediaRestrictionInput[],
  now = new Date(),
) {
  const ageYears = calculateAgeYears(child.birthday, now);
  const applicableRules = MEDIA_TYPE_OPTIONS
    .map((option) => selectApplicableMediaRule(ageYears, option.value, rules, child.id))
    .filter((rule): rule is MediaAllowanceRuleInput => Boolean(rule));
  const childRestrictions = restrictions.filter((restriction) => restriction.childId === child.id);

  return {
    childId: child.id,
    ageYears,
    rules: applicableRules,
    activeRestrictions: childRestrictions.filter((restriction) => isMediaRestrictionActive(restriction, now)),
    expiredRestrictions: childRestrictions.filter((restriction) => isMediaRestrictionExpired(restriction, now)),
  };
}

function formString(formData: FormData, key: string) {
  return formData.get(key)?.toString() ?? "";
}

function parseOptionalInt(value: number | null | undefined) {
  return value === undefined ? null : value;
}

function parseDateTimeLocal(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export async function getMediaPageData() {
  const context = await requireFamilyAdmin();
  const [children, rules, restrictions, ruleEvents] = await Promise.all([
    db.familyMember.findMany({ where: { familyId: context.family.id, role: "child" }, orderBy: { createdAt: "asc" } }),
    db.mediaAllowanceRule.findMany({ where: { familyId: context.family.id }, include: { child: true }, orderBy: [{ active: "desc" }, { mediaType: "asc" }, { minAgeYears: "asc" }] }),
    db.mediaRestriction.findMany({ where: { familyId: context.family.id }, include: { child: true, linkedTaskOccurrence: true, ruleEvent: { include: { rule: true } } }, orderBy: [{ status: "asc" }, { endsAt: "asc" }] }),
    db.ruleEvent.findMany({ where: { familyId: context.family.id }, include: { rule: true, member: true }, orderBy: { occurredAt: "desc" }, take: 20 }),
  ]);

  return { context, children, rules, restrictions, ruleEvents };
}

export async function getKidsMediaData() {
  const context = await requireFamilyContext();
  const [children, rules, restrictions] = await Promise.all([
    db.familyMember.findMany({ where: { familyId: context.family.id, role: "child" }, orderBy: { createdAt: "asc" } }),
    db.mediaAllowanceRule.findMany({ where: { familyId: context.family.id, active: true }, orderBy: [{ mediaType: "asc" }, { minAgeYears: "asc" }] }),
    db.mediaRestriction.findMany({ where: { familyId: context.family.id, status: { in: ["ACTIVE", "ENDED"] } }, include: { linkedTaskOccurrence: true }, orderBy: { endsAt: "asc" } }),
  ]);
  const now = new Date();
  const summaries = children.map((child) => buildMediaSummaryForChild(child, rules, restrictions, now));

  return { summaries, rules, restrictions };
}

export async function createMediaAllowanceRule(formData: FormData) {
  const context = await requireFamilyAdmin();
  const parsed = mediaRuleSchema.safeParse({
    childId: formString(formData, "childId") || undefined,
    mediaType: formString(formData, "mediaType"),
    minAgeYears: formString(formData, "minAgeYears") || null,
    minutesPerDay: formString(formData, "minutesPerDay") || null,
    minutesPerWeek: formString(formData, "minutesPerWeek") || null,
    note: formString(formData, "note"),
  });
  if (!parsed.success) redirect("/app/media?error=invalid-rule");

  if (parsed.data.childId) {
    const child = await db.familyMember.findFirst({ where: { id: parsed.data.childId, familyId: context.family.id, role: "child" } });
    if (!child) redirect("/app/media?error=invalid-child");
  }

  await db.mediaAllowanceRule.create({
    data: {
      familyId: context.family.id,
      childId: parsed.data.childId || null,
      mediaType: parsed.data.mediaType,
      minAgeYears: parseOptionalInt(parsed.data.minAgeYears),
      minutesPerDay: parseOptionalInt(parsed.data.minutesPerDay),
      minutesPerWeek: parseOptionalInt(parsed.data.minutesPerWeek),
      note: parsed.data.note || null,
      createdByUserId: context.user.id,
    },
  });
}

export async function deactivateMediaAllowanceRule(ruleId: string) {
  const context = await requireFamilyAdmin();
  await db.mediaAllowanceRule.updateMany({ where: { id: ruleId, familyId: context.family.id }, data: { active: false } });
}

export async function createMediaRestriction(formData: FormData) {
  const context = await requireFamilyAdmin();
  const parsed = mediaRestrictionSchema.safeParse({
    childId: formString(formData, "childId"),
    mediaType: formString(formData, "mediaType"),
    appOrDeviceLabel: formString(formData, "appOrDeviceLabel"),
    restrictionType: formString(formData, "restrictionType"),
    reducedMinutes: formString(formData, "reducedMinutes") || null,
    convertedToEducationMinutes: formString(formData, "convertedToEducationMinutes") || null,
    educationCategoryKey: formString(formData, "educationCategoryKey") || null,
    childVisibleReasonLabel: formString(formData, "childVisibleReasonLabel"),
    startsAt: formString(formData, "startsAt"),
    endsAt: formString(formData, "endsAt"),
    reasonNote: formString(formData, "reasonNote"),
    ruleEventId: formString(formData, "ruleEventId") || undefined,
    remindAt: formString(formData, "remindAt") || undefined,
  });
  if (!parsed.success) redirect("/app/media?error=invalid-restriction");

  const startsAt = parseDateTimeLocal(parsed.data.startsAt);
  const endsAt = parseDateTimeLocal(parsed.data.endsAt);
  const remindAt = parsed.data.remindAt ? parseDateTimeLocal(parsed.data.remindAt) : null;
  if (!startsAt || !endsAt || endsAt <= startsAt) redirect("/app/media?error=invalid-dates");

  const [child, ruleEvent] = await Promise.all([
    db.familyMember.findFirst({ where: { id: parsed.data.childId, familyId: context.family.id, role: "child" } }),
    parsed.data.ruleEventId ? db.ruleEvent.findFirst({ where: { id: parsed.data.ruleEventId, familyId: context.family.id } }) : Promise.resolve(null),
  ]);
  if (!child || (parsed.data.ruleEventId && !ruleEvent)) redirect("/app/media?error=invalid-context");

  const baseRestrictionData = {
    familyId: context.family.id,
    childId: parsed.data.childId,
    mediaType: parsed.data.mediaType,
    appOrDeviceLabel: parsed.data.appOrDeviceLabel || null,
    restrictionType: parsed.data.restrictionType,
    reducedMinutes: parseOptionalInt(parsed.data.reducedMinutes),
    startsAt,
    endsAt,
    reasonNote: parsed.data.reasonNote || null,
    ruleEventId: parsed.data.ruleEventId || null,
    remindAt,
    createdByUserId: context.user.id,
  };

  if (parsed.data.restrictionType !== "CONVERTED_TO_EDUCATION") {
    await db.mediaRestriction.create({ data: baseRestrictionData });
    return;
  }

  const educationMinutes = parseOptionalInt(parsed.data.convertedToEducationMinutes) ?? parseOptionalInt(parsed.data.reducedMinutes);
  if (!educationMinutes || educationMinutes <= 0) redirect("/app/media?error=invalid-education-minutes");

  const educationCategoryKey = parsed.data.educationCategoryKey ?? "learning";
  const childVisibleReasonLabel = parsed.data.childVisibleReasonLabel || "Fokuszeit";
  const title = educationTaskTitle(educationMinutes, educationCategoryKey);
  const neutralNote = `${childVisibleReasonLabel}: erst Fokuszeit, dann Medienzeit prüfen.`;

  await db.$transaction(async (tx) => {
    const taskTemplate = await tx.taskTemplate.create({
      data: {
        familyId: context.family.id,
        title,
        description: neutralNote,
        category: "Bildung/Fokuszeit",
        priority: "medium",
        requiresConfirmation: true,
        recurrenceType: "once",
        startsAt,
        endsAt,
        createdByUserId: context.user.id,
        assignments: { create: [{ familyMemberId: parsed.data.childId }] },
      },
    });

    const occurrence = await tx.taskOccurrence.create({
      data: {
        familyId: context.family.id,
        taskTemplateId: taskTemplate.id,
        familyMemberId: parsed.data.childId,
        titleSnapshot: title,
        dueAt: startsAt,
        requiresConfirmation: true,
        note: neutralNote,
      },
    });

    await tx.mediaRestriction.create({
      data: {
        ...baseRestrictionData,
        convertedToEducationMinutes: educationMinutes,
        educationCategoryKey,
        childVisibleReasonLabel,
        linkedTaskOccurrenceId: occurrence.id,
      },
    });
  });
}

export async function releaseMediaRestriction(restrictionId: string) {
  const context = await requireFamilyAdmin();
  await db.mediaRestriction.updateMany({
    where: { id: restrictionId, familyId: context.family.id },
    data: { status: "RELEASED", releasedAt: new Date(), releasedByUserId: context.user.id },
  });
}

export async function cancelMediaRestriction(restrictionId: string) {
  const context = await requireFamilyAdmin();
  await db.mediaRestriction.updateMany({ where: { id: restrictionId, familyId: context.family.id }, data: { status: "CANCELLED" } });
}

export async function createMediaAllowanceRuleAndRevalidate(formData: FormData) {
  await createMediaAllowanceRule(formData);
  revalidatePath("/app/media");
  revalidatePath("/app/kids");
}
