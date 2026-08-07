import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireFamilyAdmin } from "@/lib/family-context";

const consequenceInputSchema = z.object({
  title: z.string().trim().min(2),
  description: z.string().trim().optional(),
  familyMemberId: z.string().trim().min(1),
  ruleEventId: z.string().trim().optional(),
  startDate: z.string().trim().optional(),
  endDate: z.string().trim().optional(),
});

const consequenceStatusSchema = z.enum(["active", "done", "cancelled"]);

type InvalidInput = { success: false };

export type ParsedConsequenceInput = {
  title: string;
  description: string;
  familyMemberId: string;
  ruleEventId: string;
  startDate: string;
  endDate: string;
};

export type ParsedConsequenceStatusInput = {
  status: "active" | "done" | "cancelled";
};

function invalid(): InvalidInput {
  return { success: false };
}

export function isInvalidInput<T>(input: T | InvalidInput): input is InvalidInput {
  return typeof input === "object" && input !== null && "success" in input && input.success === false;
}

export function parseConsequenceInput(input: {
  title?: string;
  description?: string;
  familyMemberId?: string;
  ruleEventId?: string;
  startDate?: string;
  endDate?: string;
}): ParsedConsequenceInput | InvalidInput {
  const parsed = consequenceInputSchema.safeParse(input);
  if (!parsed.success) return invalid();

  return {
    title: parsed.data.title,
    description: parsed.data.description ?? "",
    familyMemberId: parsed.data.familyMemberId,
    ruleEventId: parsed.data.ruleEventId ?? "",
    startDate: parsed.data.startDate ?? "",
    endDate: parsed.data.endDate ?? "",
  };
}

export function parseConsequenceStatusInput(status?: string): ParsedConsequenceStatusInput | InvalidInput {
  const parsed = consequenceStatusSchema.safeParse(status);
  if (!parsed.success) return invalid();
  return { status: parsed.data };
}

function parseOptionalDate(value: string) {
  if (!value) return null;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

export async function getActiveConsequencesOverview() {
  const context = await requireFamilyAdmin();
  const consequences = await db.consequence.findMany({
    where: { familyId: context.family.id, status: "active" },
    include: { member: true },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  return { context, consequences };
}

export async function getConsequencesPageData() {
  const context = await requireFamilyAdmin();
  const consequences = await db.consequence.findMany({
    where: { familyId: context.family.id },
    include: { member: true, ruleEvent: { include: { rule: true } } },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
  });

  return { context, consequences };
}

export async function getConsequenceFormData() {
  const context = await requireFamilyAdmin();
  const [members, ruleEvents] = await Promise.all([
    db.familyMember.findMany({
      where: { familyId: context.family.id },
      orderBy: [{ role: "asc" }, { createdAt: "asc" }],
    }),
    db.ruleEvent.findMany({
      where: { familyId: context.family.id },
      include: { rule: true, member: true },
      orderBy: { occurredAt: "desc" },
      take: 20,
    }),
  ]);

  return { context, members, ruleEvents };
}

export async function createConsequence(formData: FormData) {
  const context = await requireFamilyAdmin();
  const parsed = parseConsequenceInput({
    title: formData.get("title")?.toString(),
    description: formData.get("description")?.toString(),
    familyMemberId: formData.get("familyMemberId")?.toString(),
    ruleEventId: formData.get("ruleEventId")?.toString(),
    startDate: formData.get("startDate")?.toString(),
    endDate: formData.get("endDate")?.toString(),
  });

  if (isInvalidInput(parsed)) redirect("/app/consequences/new?error=invalid-consequence");

  const [member, ruleEvent] = await Promise.all([
    db.familyMember.findFirst({ where: { id: parsed.familyMemberId, familyId: context.family.id } }),
    parsed.ruleEventId
      ? db.ruleEvent.findFirst({ where: { id: parsed.ruleEventId, familyId: context.family.id } })
      : Promise.resolve(null),
  ]);

  if (!member || (parsed.ruleEventId && !ruleEvent)) redirect("/app/consequences/new?error=invalid-context");

  const startDate = parseOptionalDate(parsed.startDate) ?? new Date();
  const endDate = parseOptionalDate(parsed.endDate);

  const consequence = await db.consequence.create({
    data: {
      familyId: context.family.id,
      familyMemberId: parsed.familyMemberId,
      ruleEventId: parsed.ruleEventId || null,
      title: parsed.title,
      description: parsed.description || null,
      startDate,
      endDate,
      createdByUserId: context.user.id,
    },
  });

  return consequence.id;
}

export async function updateConsequenceStatus(consequenceId: string, status: string) {
  const context = await requireFamilyAdmin();
  const parsed = parseConsequenceStatusInput(status);
  if (isInvalidInput(parsed)) redirect("/app/consequences?error=invalid-status");

  await db.consequence.updateMany({
    where: { id: consequenceId, familyId: context.family.id },
    data: { status: parsed.status },
  });
}
