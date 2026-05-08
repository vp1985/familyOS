import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireFamilyAdmin, requireFamilyContext } from "@/lib/family-context";

const pointTransactionInputSchema = z.object({
  familyMemberId: z.string().trim().min(1),
  reason: z.string().trim().min(2),
  points: z.coerce.number().int().refine((value) => value !== 0),
});

const rewardInputSchema = z.object({
  title: z.string().trim().min(2),
  description: z.string().trim().optional(),
  costPoints: z.coerce.number().int().positive(),
});

const rewardRedemptionInputSchema = z.object({
  rewardId: z.string().trim().min(1),
  familyMemberId: z.string().trim().min(1),
});

const badgeAssignmentInputSchema = z.object({
  familyMemberId: z.string().trim().min(1),
  title: z.string().trim().min(2),
  icon: z.string().trim().optional(),
  description: z.string().trim().optional(),
});

type InvalidInput = { success: false };

type PointLike = { points: number };

function invalid(): InvalidInput {
  return { success: false };
}

export function isInvalidInput<T>(input: T | InvalidInput): input is InvalidInput {
  return typeof input === "object" && input !== null && "success" in input && input.success === false;
}

export function calculatePointBalance(transactions: PointLike[]) {
  return transactions.reduce((sum, transaction) => sum + transaction.points, 0);
}

export function parsePointTransactionInput(input: {
  familyMemberId?: string;
  reason?: string;
  points?: string | number;
}) {
  const parsed = pointTransactionInputSchema.safeParse(input);
  if (!parsed.success) return invalid();
  return parsed.data;
}

export function parseRewardInput(input: { title?: string; description?: string; costPoints?: string | number }) {
  const parsed = rewardInputSchema.safeParse(input);
  if (!parsed.success) return invalid();
  return {
    title: parsed.data.title,
    description: parsed.data.description ?? "",
    costPoints: parsed.data.costPoints,
  };
}

export function parseRewardRedemptionInput(input: { rewardId?: string; familyMemberId?: string }) {
  const parsed = rewardRedemptionInputSchema.safeParse(input);
  if (!parsed.success) return invalid();
  return parsed.data;
}

export function parseBadgeAssignmentInput(input: {
  familyMemberId?: string;
  title?: string;
  icon?: string;
  description?: string;
}) {
  const parsed = badgeAssignmentInputSchema.safeParse(input);
  if (!parsed.success) return invalid();
  return {
    familyMemberId: parsed.data.familyMemberId,
    title: parsed.data.title,
    icon: parsed.data.icon || "🏅",
    description: parsed.data.description ?? "",
  };
}

export async function getGamificationDashboardData() {
  const context = await requireFamilyContext();
  const [members, pointTransactions, badges] = await Promise.all([
    db.familyMember.findMany({ where: { familyId: context.family.id }, orderBy: [{ role: "asc" }, { createdAt: "asc" }] }),
    db.pointTransaction.findMany({ where: { familyId: context.family.id } }),
    db.badgeAssignment.findMany({ where: { familyId: context.family.id }, orderBy: { createdAt: "desc" }, take: 6 }),
  ]);
  return {
    context,
    totalPoints: calculatePointBalance(pointTransactions),
    badgeCount: badges.length,
    topMembers: members.map((member) => ({
      member,
      points: calculatePointBalance(pointTransactions.filter((transaction) => transaction.familyMemberId === member.id)),
    })).slice(0, 4),
  };
}

export async function getGamificationPageData() {
  const context = await requireFamilyContext();
  const [members, pointTransactions, rewards, redemptions, badges] = await Promise.all([
    db.familyMember.findMany({ where: { familyId: context.family.id }, orderBy: [{ role: "asc" }, { createdAt: "asc" }] }),
    db.pointTransaction.findMany({ where: { familyId: context.family.id }, include: { member: true }, orderBy: { createdAt: "desc" }, take: 30 }),
    db.reward.findMany({ where: { familyId: context.family.id, isActive: true }, orderBy: { createdAt: "desc" } }),
    db.rewardRedemption.findMany({ where: { familyId: context.family.id }, include: { member: true, reward: true }, orderBy: { createdAt: "desc" }, take: 20 }),
    db.badgeAssignment.findMany({ where: { familyId: context.family.id }, include: { member: true }, orderBy: { createdAt: "desc" }, take: 30 }),
  ]);

  const balances = members.map((member) => ({
    member,
    points: calculatePointBalance(pointTransactions.filter((transaction) => transaction.familyMemberId === member.id)),
    badges: badges.filter((badge) => badge.familyMemberId === member.id),
  }));

  return { context, members, balances, pointTransactions, rewards, redemptions, badges };
}

async function requireMember(familyId: string, familyMemberId: string) {
  return db.familyMember.findFirst({ where: { id: familyMemberId, familyId } });
}

export async function createPointTransaction(formData: FormData) {
  const context = await requireFamilyAdmin();
  const parsed = parsePointTransactionInput({
    familyMemberId: formData.get("familyMemberId")?.toString(),
    reason: formData.get("reason")?.toString(),
    points: formData.get("points")?.toString(),
  });
  if (isInvalidInput(parsed)) redirect("/app/rewards?error=invalid-points");
  const member = await requireMember(context.family.id, parsed.familyMemberId);
  if (!member) redirect("/app/rewards?error=invalid-member");

  await db.pointTransaction.create({
    data: { familyId: context.family.id, familyMemberId: parsed.familyMemberId, points: parsed.points, reason: parsed.reason, createdByUserId: context.user.id },
  });
}

export async function createReward(formData: FormData) {
  const context = await requireFamilyAdmin();
  const parsed = parseRewardInput({
    title: formData.get("title")?.toString(),
    description: formData.get("description")?.toString(),
    costPoints: formData.get("costPoints")?.toString(),
  });
  if (isInvalidInput(parsed)) redirect("/app/rewards?error=invalid-reward");

  await db.reward.create({
    data: { familyId: context.family.id, title: parsed.title, description: parsed.description || null, costPoints: parsed.costPoints, createdByUserId: context.user.id },
  });
}

export async function redeemReward(formData: FormData) {
  const context = await requireFamilyAdmin();
  const parsed = parseRewardRedemptionInput({
    rewardId: formData.get("rewardId")?.toString(),
    familyMemberId: formData.get("familyMemberId")?.toString(),
  });
  if (isInvalidInput(parsed)) redirect("/app/rewards?error=invalid-redemption");

  const [member, reward, transactions] = await Promise.all([
    requireMember(context.family.id, parsed.familyMemberId),
    db.reward.findFirst({ where: { id: parsed.rewardId, familyId: context.family.id, isActive: true } }),
    db.pointTransaction.findMany({ where: { familyId: context.family.id, familyMemberId: parsed.familyMemberId } }),
  ]);
  if (!member || !reward) redirect("/app/rewards?error=invalid-redemption-context");
  if (calculatePointBalance(transactions) < reward.costPoints) redirect("/app/rewards?error=not-enough-points");

  await db.$transaction([
    db.rewardRedemption.create({ data: { familyId: context.family.id, rewardId: parsed.rewardId, familyMemberId: parsed.familyMemberId, costPoints: reward.costPoints, createdByUserId: context.user.id } }),
    db.pointTransaction.create({ data: { familyId: context.family.id, familyMemberId: parsed.familyMemberId, points: -reward.costPoints, reason: `Belohnung eingelöst: ${reward.title}`, createdByUserId: context.user.id } }),
  ]);
}

export async function assignBadge(formData: FormData) {
  const context = await requireFamilyAdmin();
  const parsed = parseBadgeAssignmentInput({
    familyMemberId: formData.get("familyMemberId")?.toString(),
    title: formData.get("badgeTitle")?.toString(),
    icon: formData.get("icon")?.toString(),
    description: formData.get("badgeDescription")?.toString(),
  });
  if (isInvalidInput(parsed)) redirect("/app/rewards?error=invalid-badge");
  const member = await requireMember(context.family.id, parsed.familyMemberId);
  if (!member) redirect("/app/rewards?error=invalid-member");

  await db.badgeAssignment.create({
    data: { familyId: context.family.id, familyMemberId: parsed.familyMemberId, title: parsed.title, icon: parsed.icon, description: parsed.description || null, createdByUserId: context.user.id },
  });
}
