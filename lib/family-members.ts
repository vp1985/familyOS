import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireFamilyAdmin, requireFamilyContext } from "@/lib/family-context";

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
  input: ParsedFamilyMemberInput | InvalidFamilyMemberInput,
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

export async function getFamilyMembers() {
  const context = await requireFamilyContext();

  const members = await db.familyMember.findMany({
    where: { familyId: context.family.id },
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
        },
      });
    }
  });

  revalidatePath("/app");
  revalidatePath("/app/family");
  redirect("/app/family");
}
