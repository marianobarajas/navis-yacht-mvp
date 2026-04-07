"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isManagerOrAbove } from "@/lib/rbac";
import { requireOrganizationId } from "@/lib/organization";

export async function getDashboardStats() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return { error: "Unauthorized", data: null };

  const organizationId = requireOrganizationId(session);
  if (!organizationId) return { error: "Unauthorized", data: null };

  const baseWoWhere = {
    yacht: { organizationId },
    ...(isManagerOrAbove(session.user.role)
      ? {}
      : { assignedToUserId: session.user.id }),
  };

  const yachtIds = isManagerOrAbove(session.user.role)
    ? (await prisma.yacht.findMany({ where: { organizationId }, select: { id: true } })).map((y) => y.id)
    : (
        await prisma.assignment.findMany({
          where: { userId: session.user.id, yacht: { organizationId } },
          select: { yachtId: true },
        })
      ).map((a) => a.yachtId);

  const [criticalOpenCount, crewOnDutyCount, alertsCount, totalAssigned, totalCompleted, expenseTotal] = await Promise.all([
    prisma.workOrder.count({
      where: {
        ...baseWoWhere,
        priority: "CRITICAL",
        status: { notIn: ["DONE", "CLOSED"] },
      },
    }),
    prisma.user.count({
      where: { isActive: true, shiftStatus: "ON_SHIFT", organizationId },
    }),
    prisma.workOrder.count({
      where: {
        ...baseWoWhere,
        status: { notIn: ["CLOSED"] },
        dueDate: {
          gte: new Date(),
          lte: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        },
      },
    }),
    prisma.workOrder.count({
      where: {
        yacht: { organizationId },
        assignedToUserId: session.user.id,
      },
    }),
    prisma.workOrder.count({
      where: {
        yacht: { organizationId },
        assignedToUserId: session.user.id,
        status: { in: ["DONE", "CLOSED"] },
      },
    }),
    yachtIds.length > 0
      ? prisma.expenseLog.aggregate({
          where: { yachtId: { in: yachtIds } },
          _sum: { cost: true },
        }).then((r) => (r._sum.cost != null ? Number(String(r._sum.cost)) : 0))
      : Promise.resolve(0),
  ]);

  const totalCompletionPercent =
    totalAssigned === 0
      ? 0
      : Math.round((totalCompleted / totalAssigned) * 100);

  return {
    error: null,
    data: {
      criticalOpenCount,
      crewOnDutyCount,
      alertsCount,
      compliancePercent: 94,
      totalAssigned,
      totalCompleted,
      totalCompletionPercent,
      expenseTotal,
    },
  };
}
