import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireFamilyAdmin } from "@/lib/family-context";
import {
  getRuleTemplateById,
  parseRuleTemplateSelection,
} from "@/lib/rule-templates";

const ruleInputSchema = z.object({
  title: z.string().trim().min(2),
  description: z.string().trim().optional(),
  category: z.string().trim().min(2),
  isActive: z.union([z.literal("on"), z.literal("true"), z.literal("false"), z.boolean()]).optional(),
});

const ruleEventInputSchema = z.object({
  ruleId: z.string().trim().min(1),
  familyMemberId: z.string().trim().min(1),
  note: z.string().trim().min(2),
});

type InvalidInput = { success: false };

export type ParsedRuleInput = {
  title: string;
  description: string;
  category: string;
  isActive: boolean;
};

export type ParsedRuleEventInput = {
  ruleId: string;
  familyMemberId: string;
  note: string;
};

function invalid(): InvalidInput {
  return { success: false };
}

export function isInvalidInput<T>(input: T | InvalidInput): input is InvalidInput {
  return typeof input === "object" && input !== null && "success" in input && input.success === false;
}

export function parseRuleInput(input: {
  title?: string;
  description?: string;
  category?: string;
  isActive?: string | boolean;
}): ParsedRuleInput | InvalidInput {
  const parsed = ruleInputSchema.safeParse(input);
  if (!parsed.success) return invalid();

  return {
    title: parsed.data.title,
    description: parsed.data.description ?? "",
    category: parsed.data.category,
    isActive: parsed.data.isActive !== "false",
  };
}

export function parseRuleEventInput(input: {
  ruleId?: string;
  familyMemberId?: string;
  note?: string;
}): ParsedRuleEventInput | InvalidInput {
  const parsed = ruleEventInputSchema.safeParse(input);
  if (!parsed.success) return invalid();

  return {
    ruleId: parsed.data.ruleId,
    familyMemberId: parsed.data.familyMemberId,
    note: parsed.data.note,
  };
}

export async function getRulesPageData() {
  const context = await requireFamilyAdmin();
  const [rules, members] = await Promise.all([
    db.rule.findMany({
      where: { familyId: context.family.id },
      include: {
        events: {
          include: { member: true },
          orderBy: { occurredAt: "desc" },
          take: 5,
        },
      },
      orderBy: [{ isActive: "desc" }, { createdAt: "desc" }],
    }),
    db.familyMember.findMany({
      where: { familyId: context.family.id },
      orderBy: [{ role: "asc" }, { createdAt: "asc" }],
    }),
  ]);

  return { context, rules, members };
}

export async function getRuleFormData() {
  const context = await requireFamilyAdmin();
  return { context };
}

export async function getRuleEventFormData(ruleId: string) {
  const context = await requireFamilyAdmin();
  const [rule, members] = await Promise.all([
    db.rule.findFirst({ where: { id: ruleId, familyId: context.family.id } }),
    db.familyMember.findMany({
      where: { familyId: context.family.id },
      orderBy: [{ role: "asc" }, { createdAt: "asc" }],
    }),
  ]);

  if (!rule) redirect("/app/rules?error=not-found");

  return { context, rule, members };
}

export async function createRule(formData: FormData) {
  const context = await requireFamilyAdmin();
  const parsed = parseRuleInput({
    title: formData.get("title")?.toString(),
    description: formData.get("description")?.toString(),
    category: formData.get("category")?.toString(),
    isActive: formData.get("isActive")?.toString() ?? true,
  });

  if (isInvalidInput(parsed)) redirect("/app/rules/new?error=invalid-rule");

  const rule = await db.rule.create({
    data: {
      familyId: context.family.id,
      title: parsed.title,
      description: parsed.description || null,
      category: parsed.category,
      isActive: parsed.isActive,
      createdByUserId: context.user.id,
    },
  });

  return rule.id;
}

export async function createRuleTemplates(formData: FormData) {
  const context = await requireFamilyAdmin();
  const selection = parseRuleTemplateSelection(formData);
  if (isInvalidInput(selection)) redirect("/app/rules?error=invalid-rule-set");

  const templates = selection.templateIds
    .map((id) => getRuleTemplateById(id))
    .filter((template): template is NonNullable<typeof template> => Boolean(template));

  if (templates.length === 0) redirect("/app/rules?error=invalid-rule-set");

  const existingRules = await db.rule.findMany({
    where: {
      familyId: context.family.id,
      OR: templates.map((template) => ({ title: template.title, category: template.category })),
    },
    select: { title: true, category: true },
  });
  const existingKeys = new Set(existingRules.map((rule) => `${rule.category}:${rule.title}`));
  const rulesToCreate = templates.filter((template) => !existingKeys.has(`${template.category}:${template.title}`));

  if (rulesToCreate.length === 0) return 0;

  await db.rule.createMany({
    data: rulesToCreate.map((template) => ({
      familyId: context.family.id,
      title: template.title,
      description: template.description,
      category: template.category,
      isActive: true,
      createdByUserId: context.user.id,
    })),
  });

  return rulesToCreate.length;
}

export async function setRuleActive(ruleId: string, isActive: boolean) {
  const context = await requireFamilyAdmin();
  await db.rule.updateMany({
    where: { id: ruleId, familyId: context.family.id },
    data: { isActive },
  });
}

export async function createRuleEvent(ruleId: string, formData: FormData) {
  const context = await requireFamilyAdmin();
  const parsed = parseRuleEventInput({
    ruleId,
    familyMemberId: formData.get("familyMemberId")?.toString(),
    note: formData.get("note")?.toString(),
  });

  if (isInvalidInput(parsed)) redirect(`/app/rules/${ruleId}/events/new?error=invalid-event`);

  const [rule, member] = await Promise.all([
    db.rule.findFirst({ where: { id: parsed.ruleId, familyId: context.family.id } }),
    db.familyMember.findFirst({ where: { id: parsed.familyMemberId, familyId: context.family.id } }),
  ]);

  if (!rule || !member) redirect(`/app/rules/${ruleId}/events/new?error=invalid-context`);

  await db.ruleEvent.create({
    data: {
      familyId: context.family.id,
      ruleId: parsed.ruleId,
      familyMemberId: parsed.familyMemberId,
      note: parsed.note,
      createdByUserId: context.user.id,
    },
  });
}
