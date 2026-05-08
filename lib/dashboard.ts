import { db } from "@/lib/db";
import { requireFamilyContext } from "@/lib/family-context";
import { formatCents } from "@/lib/money";

export type DashboardConsequence = {
  id: string;
  title: string;
  memberName: string;
};

export type DashboardMoneyActivity = {
  id?: string;
  type?: "money";
  title: string;
  memberName: string;
  amountCents: number;
};

export type DashboardPointActivity = {
  id?: string;
  type?: "points";
  reason?: string;
  title?: string;
  memberName: string;
  points: number;
};

export type DashboardActivity =
  | (DashboardMoneyActivity & { id: string; type: "money" })
  | (DashboardPointActivity & { id: string; type: "points"; title: string });

export type PointLeader = {
  member: { id: string; name: string; icon?: string | null };
  points: number;
};

export type DashboardTaskItem = {
  id: string;
  title: string;
  memberName: string;
  dueAt: Date | null;
};

export type DashboardConfirmationItem = {
  id: string;
  title: string;
  memberName: string;
  doneAt: Date | null;
};

export type DashboardCalendarItem = {
  id: string;
  title: string;
  memberName: string;
  startsAt: Date;
};

export function sortPointLeaders(leaders: PointLeader[]) {
  return [...leaders].sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    return a.member.name.localeCompare(b.member.name, "de");
  });
}

export function buildTodayAgenda(input: {
  now: Date;
  openTasks: DashboardTaskItem[];
  pendingConfirmations: DashboardConfirmationItem[];
  upcomingEvents: DashboardCalendarItem[];
}) {
  const todayKey = input.now.toISOString().slice(0, 10);
  const todayTasks = [...input.openTasks]
    .filter((task) => !task.dueAt || task.dueAt.toISOString().slice(0, 10) <= todayKey)
    .sort((a, b) => (a.dueAt?.getTime() ?? 0) - (b.dueAt?.getTime() ?? 0))
    .slice(0, 5);

  const pendingConfirmations = [...input.pendingConfirmations]
    .sort((a, b) => (b.doneAt?.getTime() ?? 0) - (a.doneAt?.getTime() ?? 0))
    .slice(0, 5);

  const upcomingEvents = [...input.upcomingEvents]
    .filter((event) => event.startsAt >= input.now)
    .sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime())
    .slice(0, 5);

  return {
    todayTasks,
    pendingConfirmations,
    upcomingEvents,
    nextEvent: upcomingEvents[0] ?? null,
    totalActionCount: todayTasks.length + pendingConfirmations.length,
  };
}

function signedPoints(points: number) {
  return `${points > 0 ? "+" : ""}${points} Punkte`;
}

export function formatActivityLine(activity: DashboardMoneyActivity | DashboardPointActivity) {
  if ("amountCents" in activity) {
    const amount = `${activity.amountCents > 0 ? "+" : ""}${formatCents(activity.amountCents)}`;
    return `${activity.memberName} · ${activity.title} · ${amount}`;
  }

  return `${activity.memberName} · ${activity.title ?? activity.reason ?? "Punkte"} · ${signedPoints(activity.points)}`;
}

function interleaveRecentActivities({
  money,
  points,
  limit,
}: {
  money: DashboardMoneyActivity[];
  points: DashboardPointActivity[];
  limit: number;
}) {
  const activities: DashboardActivity[] = [];
  const maxLength = Math.max(money.length, points.length);

  for (let index = 0; index < maxLength && activities.length < limit; index += 1) {
    const moneyItem = money[index];
    if (moneyItem && activities.length < limit) {
      activities.push({ ...moneyItem, id: `money-${moneyItem.id ?? index}`, type: "money" });
    }

    const pointItem = points[index];
    if (pointItem && activities.length < limit) {
      activities.push({
        ...pointItem,
        id: `points-${pointItem.id ?? index}`,
        type: "points",
        title: pointItem.title ?? pointItem.reason ?? "Punkte",
      });
    }
  }

  return activities;
}

export function buildDashboardSummary(input: {
  childCount: number;
  familyMemberCount: number;
  totalFinanceCents: number;
  activeConsequences: DashboardConsequence[];
  activeProjectCount: number;
  activeRuleCount: number;
  todayOpenTaskCount: number;
  totalPoints: number;
  recentMoneyTransactions: DashboardMoneyActivity[];
  recentPointTransactions: DashboardPointActivity[];
}) {
  const todayImportantCount = input.activeConsequences.length + input.activeProjectCount + input.activeRuleCount + (input.todayOpenTaskCount ?? 0);

  return {
    todayImportantCount,
    stats: {
      children: input.childCount,
      familyMembers: input.familyMemberCount,
      totalFinanceCents: input.totalFinanceCents,
      activeConsequences: input.activeConsequences.length,
      activeProjects: input.activeProjectCount,
      activeRules: input.activeRuleCount,
      ...(input.todayOpenTaskCount !== undefined ? { todayOpenTasks: input.todayOpenTaskCount } : {}),
      totalPoints: input.totalPoints,
    },
    recentActivity: interleaveRecentActivities({
      money: input.recentMoneyTransactions,
      points: input.recentPointTransactions,
      limit: 4,
    }),
  };
}

export async function getDashboardData() {
  const context = await requireFamilyContext();

  const today = new Date();
  today.setUTCHours(23, 59, 59, 999);

  const tomorrow = new Date(today);
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  tomorrow.setUTCHours(0, 0, 0, 0);

  const [
    members,
    financeAccounts,
    activeConsequences,
    activeProjectCount,
    activeRuleCount,
    todayOpenTaskCount,
    openTasks,
    pendingConfirmations,
    upcomingEvents,
    pointTransactions,
    recentMoneyTransactions,
    recentPointTransactions,
    badges,
  ] = await Promise.all([
    db.familyMember.findMany({ where: { familyId: context.family.id }, orderBy: [{ role: "asc" }, { createdAt: "asc" }] }),
    db.financeAccount.findMany({ where: { familyId: context.family.id } }),
    db.consequence.findMany({
      where: { familyId: context.family.id, status: "active" },
      include: { member: true },
      orderBy: { createdAt: "desc" },
      take: 3,
    }),
    db.project.count({ where: { familyId: context.family.id, status: "active" } }),
    db.rule.count({ where: { familyId: context.family.id, isActive: true } }),
    db.taskOccurrence.count({ where: { familyId: context.family.id, status: { in: ["open", "in_progress"] }, dueAt: { lte: today } } }),
    db.taskOccurrence.findMany({
      where: { familyId: context.family.id, status: { in: ["open", "in_progress"] }, dueAt: { lte: today } },
      include: { member: true },
      orderBy: [{ dueAt: "asc" }, { createdAt: "asc" }],
      take: 5,
    }),
    db.taskOccurrence.findMany({
      where: { familyId: context.family.id, status: "done", confirmedAt: null },
      include: { member: true },
      orderBy: [{ doneAt: "desc" }, { updatedAt: "desc" }],
      take: 5,
    }),
    db.calendarEvent.findMany({
      where: { familyId: context.family.id, startsAt: { gte: new Date(), lt: tomorrow } },
      include: { member: true },
      orderBy: { startsAt: "asc" },
      take: 5,
    }),
    db.pointTransaction.findMany({ where: { familyId: context.family.id } }),
    db.moneyTransaction.findMany({
      where: { familyId: context.family.id },
      include: { member: true },
      orderBy: { createdAt: "desc" },
      take: 4,
    }),
    db.pointTransaction.findMany({
      where: { familyId: context.family.id },
      include: { member: true },
      orderBy: { createdAt: "desc" },
      take: 4,
    }),
    db.badgeAssignment.findMany({
      where: { familyId: context.family.id },
      include: { member: true },
      orderBy: { createdAt: "desc" },
      take: 4,
    }),
  ]);

  const totalPoints = pointTransactions.reduce((sum, transaction) => sum + transaction.points, 0);
  const pointLeaders = sortPointLeaders(
    members
      .filter((member) => member.role === "child")
      .map((member) => ({
        member,
        points: pointTransactions
          .filter((transaction) => transaction.familyMemberId === member.id)
          .reduce((sum, transaction) => sum + transaction.points, 0),
      })),
  ).slice(0, 3);

  const summary = buildDashboardSummary({
    childCount: members.filter((member) => member.role === "child").length,
    familyMemberCount: members.length,
    totalFinanceCents: financeAccounts.reduce((sum, account) => sum + account.balanceCents, 0),
    activeConsequences: activeConsequences.map((consequence) => ({ id: consequence.id, title: consequence.title, memberName: consequence.member.name })),
    activeProjectCount,
    activeRuleCount,
    todayOpenTaskCount,
    totalPoints,
    recentMoneyTransactions: recentMoneyTransactions.map((transaction) => ({
      id: transaction.id,
      title: transaction.title,
      memberName: transaction.member.name,
      amountCents: transaction.amountCents,
    })),
    recentPointTransactions: recentPointTransactions.map((transaction) => ({
      id: transaction.id,
      title: transaction.reason,
      memberName: transaction.member.name,
      points: transaction.points,
    })),
  });

  const agenda = buildTodayAgenda({
    now: new Date(),
    openTasks: openTasks.map((task) => ({ id: task.id, title: task.titleSnapshot, memberName: task.member.name, dueAt: task.dueAt })),
    pendingConfirmations: pendingConfirmations.map((task) => ({ id: task.id, title: task.titleSnapshot, memberName: task.member.name, doneAt: task.doneAt })),
    upcomingEvents: upcomingEvents.map((event) => ({ id: event.id, title: event.title, memberName: event.member?.name ?? "Familie", startsAt: event.startsAt })),
  });

  return {
    context,
    members,
    activeConsequences,
    badges,
    pointLeaders,
    summary,
    agenda,
  };
}
