import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { createSession } from "@/lib/auth";
import { hashPassword, normalizeEmail, verifyPassword } from "@/lib/auth-utils";
import { requireFamilyAdmin } from "@/lib/family-context";

const childAccountInputSchema = z.object({
  familyMemberId: z.string().trim().min(1),
  loginName: z.string().trim().min(2),
  password: z.string().min(8),
  enabled: z.union([z.boolean(), z.string()]).optional(),
});

const childLoginInputSchema = z.object({
  familyIdentifier: z.string().trim().min(1),
  loginName: z.string().trim().min(2),
  password: z.string().min(1),
});

type InvalidInput = { success: false };

function invalid(): InvalidInput {
  return { success: false };
}

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function normalizeFamilyLoginIdentifier(value: string) {
  const trimmed = value.trim();
  if (trimmed.includes("@")) return normalizeEmail(trimmed);
  return slugify(trimmed);
}

export function normalizeChildLoginName(value: string) {
  return slugify(value);
}

export function buildChildAccountEmail(familyId: string, loginName: string) {
  return `${familyId}.${normalizeChildLoginName(loginName)}@kids.familyos.local`;
}

export function parseChildAccountInput(input: {
  familyMemberId?: string;
  loginName?: string;
  password?: string;
  enabled?: string | boolean;
}) {
  const parsed = childAccountInputSchema.safeParse(input);
  if (!parsed.success) return invalid();

  const loginName = normalizeChildLoginName(parsed.data.loginName);
  if (!loginName) return invalid();

  return {
    familyMemberId: parsed.data.familyMemberId,
    loginName,
    password: parsed.data.password,
    enabled: parsed.data.enabled === undefined ? true : parsed.data.enabled === true || parsed.data.enabled === "on" || parsed.data.enabled === "true",
  };
}

export function parseChildLoginInput(input: {
  familyIdentifier?: string;
  loginName?: string;
  password?: string;
}) {
  const parsed = childLoginInputSchema.safeParse(input);
  if (!parsed.success) return invalid();

  const familyIdentifier = normalizeFamilyLoginIdentifier(parsed.data.familyIdentifier);
  const loginName = normalizeChildLoginName(parsed.data.loginName);
  if (!familyIdentifier || !loginName) return invalid();

  return {
    familyIdentifier,
    loginName,
    password: parsed.data.password,
  };
}

export async function resolveFamilyForChildLogin(familyIdentifier: string) {
  const identifier = normalizeFamilyLoginIdentifier(familyIdentifier);
  if (!identifier) return null;

  if (identifier.includes("@")) {
    const parentLink = await db.familyUser.findFirst({
      where: {
        user: { email: identifier },
        role: { in: ["owner", "admin", "viewer"] },
      },
      include: { family: true },
      orderBy: { createdAt: "asc" },
    });
    return parentLink?.family ?? null;
  }

  return db.family.findFirst({
    where: {
      OR: [{ loginSlug: identifier }, { id: identifier }],
    },
  });
}

export async function createChildAccountAction(formData: FormData) {
  "use server";

  const context = await requireFamilyAdmin();
  const parsed = parseChildAccountInput({
    familyMemberId: formData.get("familyMemberId")?.toString(),
    loginName: formData.get("loginName")?.toString(),
    password: formData.get("password")?.toString(),
    enabled: formData.has("enabled") ? "on" : "false",
  });

  if ("success" in parsed) redirect("/app/family?error=invalid-child-account");

  const member = await db.familyMember.findFirst({
    where: { id: parsed.familyMemberId, familyId: context.family.id, role: "child" },
  });
  if (!member) redirect("/app/family?error=invalid-child-account");

  const passwordHash = await hashPassword(parsed.password);
  const childEmail = buildChildAccountEmail(context.family.id, parsed.loginName);
  const familyLoginSlug = context.family.loginSlug ?? normalizeFamilyLoginIdentifier(context.family.name);

  await db.$transaction(async (tx) => {
    if (!context.family.loginSlug) {
      await tx.family.update({ where: { id: context.family.id }, data: { loginSlug: familyLoginSlug } });
    }

    const existingLink = await tx.familyUser.findFirst({
      where: { familyId: context.family.id, familyMemberId: member.id, role: "child" },
      include: { user: true },
    });

    if (existingLink) {
      await tx.user.update({
        where: { id: existingLink.userId },
        data: { email: childEmail, name: member.name, passwordHash },
      });
      await tx.familyUser.update({
        where: { id: existingLink.id },
        data: {
          childLoginName: parsed.loginName,
          childAccountEnabled: parsed.enabled,
          familyMemberId: member.id,
          role: "child",
        },
      });
      return;
    }

    const user = await tx.user.create({
      data: {
        email: childEmail,
        name: member.name,
        passwordHash,
      },
    });

    await tx.familyUser.create({
      data: {
        familyId: context.family.id,
        userId: user.id,
        role: "child",
        familyMemberId: member.id,
        childLoginName: parsed.loginName,
        childAccountEnabled: parsed.enabled,
      },
    });
  });

  revalidatePath("/app/family");
  redirect("/app/family");
}

export async function childLoginAction(formData: FormData) {
  "use server";

  const parsed = parseChildLoginInput({
    familyIdentifier: formData.get("familyIdentifier")?.toString(),
    loginName: formData.get("loginName")?.toString(),
    password: formData.get("password")?.toString(),
  });

  if ("success" in parsed) {
    redirect("/login?error=invalid");
  }

  const family = await resolveFamilyForChildLogin(parsed.familyIdentifier);
  if (!family) {
    redirect("/login?error=invalid");
  }

  const childLink = await db.familyUser.findFirst({
    where: {
      familyId: family.id,
      role: "child",
      childLoginName: parsed.loginName,
      childAccountEnabled: true,
    },
    include: { user: true },
  });

  if (!childLink || !(await verifyPassword(parsed.password, childLink.user.passwordHash))) {
    redirect("/login?error=invalid");
  }

  await createSession(childLink.userId);
  redirect("/app/kids");
}

export async function updateFamilyBadgeVisibilityAction(formData: FormData) {
  "use server";

  const context = await requireFamilyAdmin();
  await db.family.update({
    where: { id: context.family.id },
    data: { showPositiveBadgesToFamily: formData.get("showPositiveBadgesToFamily")?.toString() === "on" },
  });

  revalidatePath("/app/settings");
  revalidatePath("/app/rewards");
  revalidatePath("/app/kids");
  redirect("/app/settings");
}

export async function updateRenovationModuleSettingAction(formData: FormData) {
  "use server";

  const context = await requireFamilyAdmin();
  const enabled = formData.get("renovationModuleEnabled")?.toString() === "on";
  await db.family.update({
    where: { id: context.family.id },
    data: { renovationModuleEnabled: enabled },
  });

  revalidatePath("/app");
  revalidatePath("/app/settings");
  revalidatePath("/app/renovation");
  redirect(enabled ? "/app/renovation" : "/app/settings");
}
