import { redirect } from "next/navigation";
import type { FamilyUserRole } from "@prisma/client";
import { requireCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { resolveFamilyAdminOrChildScope } from "@/lib/family-access-policy";

export async function requireFamilyContext() {
  const user = await requireCurrentUser();
  const familyUser = user.familyUsers[0];

  if (!familyUser) {
    redirect("/register");
  }

  if (familyUser.role === "child") {
    const member = familyUser.familyMemberId
      ? await db.familyMember.findFirst({
        where: { id: familyUser.familyMemberId, familyId: familyUser.familyId, archivedAt: null },
        select: { id: true },
      })
      : null;
    if (!member || !familyUser.childAccountEnabled) redirect("/login");
  }

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
    },
    family: familyUser.family,
    role: familyUser.role,
    familyUserId: familyUser.id,
    familyMemberId: familyUser.familyMemberId,
  };
}

export async function requireFamilyRole(allowedRoles: FamilyUserRole[]) {
  const context = await requireFamilyContext();

  if (!allowedRoles.includes(context.role)) {
    throw new Error("Keine Berechtigung für diese Familienaktion.");
  }

  return context;
}

export async function requireFamilyAdmin() {
  return requireFamilyRole(["owner", "admin"]);
}

export async function requireChildContext() {
  const context = await requireFamilyRole(["child"]);

  if (!context.familyMemberId) {
    throw new Error("Kinderkonto ist keinem Familienprofil zugeordnet.");
  }

  return { ...context, childMemberId: context.familyMemberId };
}

export async function requireFamilyAdminOrChild() {
  const context = await requireFamilyContext();
  return { ...context, ...resolveFamilyAdminOrChildScope(context.role, context.familyMemberId) };
}
