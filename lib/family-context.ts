import { redirect } from "next/navigation";
import type { FamilyUserRole } from "@prisma/client";
import { requireCurrentUser } from "@/lib/auth";

export async function requireFamilyContext() {
  const user = await requireCurrentUser();
  const familyUser = user.familyUsers[0];

  if (!familyUser) {
    redirect("/register");
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

  if (context.role === "owner" || context.role === "admin") {
    return { ...context, childMemberId: null };
  }

  if (context.role === "child" && context.familyMemberId) {
    return { ...context, childMemberId: context.familyMemberId };
  }

  throw new Error("Keine Berechtigung für diese Familienaktion.");
}
