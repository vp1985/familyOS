import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireFamilyAdmin } from "@/lib/family-context";

const familyMemberInputSchema = z.object({
  name: z.string().trim().min(2),
  role: z.enum(["parent", "child", "other"]).default("child"),
  color: z.string().trim().optional(),
  icon: z.string().trim().optional(),
});

export type FamilyMemberInput = {
  name?: string;
  role?: string;
  color?: string;
  icon?: string;
};

export type ParsedFamilyMemberInput = {
  name: string;
  role: "parent" | "child" | "other";
  color: string;
  icon: string;
};

const defaultColors: Record<ParsedFamilyMemberInput["role"], string> = {
  parent: "slate",
  child: "emerald",
  other: "amber",
};

const defaultIcons: Record<ParsedFamilyMemberInput["role"], string> = {
  parent: "👤",
  child: "🧒",
  other: "⭐",
};

type InvalidFamilyMemberInput = { success: false };

function isInvalidFamilyMemberInput(
  input: ParsedFamilyMemberInput | ParsedFamilyMemberEditInput | InvalidFamilyMemberInput,
): input is InvalidFamilyMemberInput {
  return "success" in input && input.success === false;
}

export function parseFamilyMemberInput(input: FamilyMemberInput): ParsedFamilyMemberInput | InvalidFamilyMemberInput {
  const parsed = familyMemberInputSchema.safeParse(input);

  if (!parsed.success) {
    return { success: false };
  }

  return {
    name: parsed.data.name,
    role: parsed.data.role,
    color: parsed.data.color || defaultColors[parsed.data.role],
    icon: parsed.data.icon || defaultIcons[parsed.data.role],
  };
}

export type FamilyMemberEditInput = {
  name?: string;
  color?: string;
  icon?: string;
};

export type ParsedFamilyMemberEditInput = {
  name: string;
  color: string;
  icon: string;
};

export function parseFamilyMemberEditInput(
  input: FamilyMemberEditInput,
  role: ParsedFamilyMemberInput["role"],
): ParsedFamilyMemberEditInput | InvalidFamilyMemberInput {
  const parsed = familyMemberInputSchema.pick({ name: true, color: true, icon: true }).safeParse(input);
  if (!parsed.success) return { success: false };

  return {
    name: parsed.data.name,
    color: parsed.data.color || defaultColors[role],
    icon: parsed.data.icon || defaultIcons[role],
  };
}

export function isArchivableFamilyMember(input: { archivedAt: Date | null; userRoles: string[] }) {
  return input.archivedAt === null && input.userRoles.every((role) => role === "child");
}

export async function getFamilyMembers() {
  const context = await requireFamilyAdmin();

  const members = await db.familyMember.findMany({
    where: { familyId: context.family.id, archivedAt: null },
    include: {
      userAccounts: {
        select: { id: true, role: true, childLoginName: true, childAccountEnabled: true },
      },
    },
    orderBy: [{ role: "asc" }, { createdAt: "asc" }],
  });

  return { context, members };
}

export async function createFamilyMemberAction(formData: FormData) {
  "use server";

  const context = await requireFamilyAdmin();
  const parsed = parseFamilyMemberInput({
    name: formData.get("name")?.toString(),
    role: formData.get("role")?.toString(),
    color: formData.get("color")?.toString(),
    icon: formData.get("icon")?.toString(),
  });

  if (isInvalidFamilyMemberInput(parsed)) {
    redirect("/app/family?error=invalid-member");
  }

  await db.$transaction(async (tx) => {
    const member = await tx.familyMember.create({
      data: {
        familyId: context.family.id,
        name: parsed.name,
        role: parsed.role,
        color: parsed.color,
        icon: parsed.icon,
      },
    });

    if (member.role === "child") {
      await tx.financeAccount.create({
        data: {
          familyId: context.family.id,
          familyMemberId: member.id,
          childCanBook: true,
          name: "Bargeld",
          kind: "CASH",
          isDefault: true,
        },
      });
    }
  });

  revalidatePath("/app");
  revalidatePath("/app/family");
  redirect("/app/family");
}

export async function updateFamilyMemberAction(formData: FormData) {
  "use server";

  const context = await requireFamilyAdmin();
  const memberId = formData.get("memberId")?.toString();
  if (!memberId) redirect("/app/family?error=invalid-member");

  const member = await db.familyMember.findFirst({
    where: { id: memberId, familyId: context.family.id, archivedAt: null },
    select: { role: true },
  });
  if (!member) redirect("/app/family?error=invalid-member");

  const parsed = parseFamilyMemberEditInput({
    name: formData.get("name")?.toString(),
    color: formData.get("color")?.toString(),
    icon: formData.get("icon")?.toString(),
  }, member.role);
  if (isInvalidFamilyMemberInput(parsed)) redirect("/app/family?error=invalid-member");

  await db.familyMember.update({
    where: { id: memberId },
    data: parsed,
  });

  revalidatePath("/app");
  revalidatePath("/app/family");
  redirect("/app/family");
}

export async function archiveFamilyMemberAction(formData: FormData) {
  "use server";

  const context = await requireFamilyAdmin();
  const memberId = formData.get("memberId")?.toString();
  if (!memberId) redirect("/app/family?error=invalid-archive");

  const member = await db.familyMember.findFirst({
    where: { id: memberId, familyId: context.family.id },
    select: { id: true, archivedAt: true, userAccounts: { select: { role: true } } },
  });
  if (!member || !isArchivableFamilyMember({
    archivedAt: member.archivedAt,
    userRoles: member.userAccounts.map((account) => account.role),
  })) {
    redirect("/app/family?error=invalid-archive");
  }

  await db.$transaction([
    db.familyMember.update({
      where: { id: member.id },
      data: { archivedAt: new Date() },
    }),
    db.familyUser.updateMany({
      where: { familyId: context.family.id, familyMemberId: member.id, role: "child" },
      data: { childAccountEnabled: false },
    }),
  ]);

  revalidatePath("/app");
  revalidatePath("/app/family");
  redirect("/app/family");
}
