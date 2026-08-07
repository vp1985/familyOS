export type FamilyAccessRole = "owner" | "admin" | "viewer" | "child";

export type FamilyAdminOrChildScope = {
  childMemberId: string | null;
};

export function resolveFamilyAdminOrChildScope(
  role: FamilyAccessRole,
  familyMemberId: string | null,
): FamilyAdminOrChildScope {
  if (role === "owner" || role === "admin") {
    return { childMemberId: null };
  }

  if (role === "child") {
    if (!familyMemberId) {
      throw new Error("Kinderkonto ist keinem Familienprofil zugeordnet.");
    }
    return { childMemberId: familyMemberId };
  }

  throw new Error("Keine Berechtigung für diese Familienaktion.");
}

export function canAccessChildMember(
  scope: FamilyAdminOrChildScope,
  childMemberId: string,
): boolean {
  return scope.childMemberId === null || scope.childMemberId === childMemberId;
}

export function canAccessChecklist(
  scope: FamilyAdminOrChildScope,
  assignedFamilyMemberId: string | null,
  taskFamilyMemberId: string | null,
): boolean {
  return scope.childMemberId === null
    || assignedFamilyMemberId === scope.childMemberId
    || taskFamilyMemberId === scope.childMemberId;
}
