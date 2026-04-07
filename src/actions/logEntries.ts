"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import type { LogEntryType, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { isManagerOrAbove } from "@/lib/rbac";
import { revalidatePath } from "next/cache";
import { requireOrganizationId } from "@/lib/organization";

export async function listRecentLogs(
  limit = 50,
  filters?: { yachtId?: string; authorUserId?: string; entryType?: LogEntryType }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return { error: "Unauthorized", data: null };

  const organizationId = requireOrganizationId(session);
  if (!organizationId) return { error: "Unauthorized", data: null };

  const where: Prisma.LogEntryWhereInput = {
    yacht: { organizationId },
  };
  if (filters?.authorUserId) where.authorUserId = filters.authorUserId;
  if (filters?.entryType) where.entryType = filters.entryType;

  if (!isManagerOrAbove(session.user.role)) {
    const assignedYachtIds = await prisma.assignment
      .findMany({
        where: { userId: session.user.id, yacht: { organizationId } },
        select: { yachtId: true },
      })
      .then((a) => a.map((x) => x.yachtId));
    if (assignedYachtIds.length === 0) return { error: null, data: [] };
    if (filters?.yachtId) {
      if (!assignedYachtIds.includes(filters.yachtId)) return { error: null, data: [] };
      where.yachtId = filters.yachtId;
    } else {
      where.yachtId = { in: assignedYachtIds };
    }
  } else {
    if (filters?.yachtId) where.yachtId = filters.yachtId;
  }

  const logs = await prisma.logEntry.findMany({
    where,
    take: limit,
    orderBy: { createdAt: "desc" },
    include: {
      yacht: { select: { id: true, name: true } },
      workOrder: { select: { id: true, title: true } },
      author: { select: { id: true, name: true } },
    },
  });
  return { error: null, data: logs };
}

export async function listLogsByYacht(yachtId: string, limit = 50) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return { error: "Unauthorized", data: null };

  const organizationId = requireOrganizationId(session);
  if (!organizationId) return { error: "Unauthorized", data: null };

  const yachtOk = await prisma.yacht.findFirst({
    where: { id: yachtId, organizationId },
    select: { id: true },
  });
  if (!yachtOk) return { error: "Not found", data: null };

  if (!isManagerOrAbove(session.user.role)) {
    const assigned = await prisma.assignment.findFirst({
      where: { yachtId, userId: session.user.id },
    });
    if (!assigned) return { error: "Forbidden", data: null };
  }

  const logs = await prisma.logEntry.findMany({
    where: { yachtId, yacht: { organizationId } },
    take: limit,
    orderBy: { createdAt: "desc" },
    include: {
      yacht: { select: { id: true, name: true } },
      workOrder: { select: { id: true, title: true } },
      author: { select: { id: true, name: true } },
    },
  });
  return { error: null, data: logs };
}

export async function createLogEntry(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return { error: "Unauthorized" };

  const organizationId = requireOrganizationId(session);
  if (!organizationId) return { error: "Unauthorized" };

  const yachtId = formData.get("yachtId") as string;
  const workOrderId = (formData.get("workOrderId") as string) || null;
  const entryType = (formData.get("entryType") as LogEntryType) || "NOTE";
  const text = (formData.get("text") as string) || null;
  const statusSnapshot = (formData.get("statusSnapshot") as string) || null;

  if (!yachtId?.trim()) return { error: "Yacht required" };

  const yachtOk = await prisma.yacht.findFirst({
    where: { id: yachtId.trim(), organizationId },
    select: { id: true },
  });
  if (!yachtOk) return { error: "Yacht not found in your organization" };

  if (!isManagerOrAbove(session.user.role)) {
    const assigned = await prisma.assignment.findFirst({
      where: { yachtId: yachtId.trim(), userId: session.user.id },
    });
    if (!assigned) return { error: "You can only add logs for assigned yachts" };
    if (workOrderId) {
      const wo = await prisma.workOrder.findFirst({
        where: { id: workOrderId.trim(), yacht: { organizationId } },
      });
      if (!wo || wo.assignedToUserId !== session.user.id)
        return { error: "Work order not assigned to you" };
    }
  }

  await prisma.logEntry.create({
    data: {
      yachtId: yachtId.trim(),
      workOrderId: workOrderId?.trim() || null,
      authorUserId: session.user.id,
      entryType,
      text: text?.trim() || null,
      statusSnapshot: statusSnapshot?.trim() || null,
    },
  });
  revalidatePath("/logs");
  return { error: null };
}

export async function updateLogEntry(logId: string, formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return { error: "Unauthorized" };

  const organizationId = requireOrganizationId(session);
  if (!organizationId) return { error: "Unauthorized" };

  const userId = (session.user as any).id as string;
  const role = (session.user as any).role as string;

  const existing = await prisma.logEntry.findFirst({
    where: { id: logId, yacht: { organizationId } },
    select: { id: true, authorUserId: true },
  });
  if (!existing) return { error: "Not found" };

  const canManage = isManagerOrAbove(role);
  if (!canManage && existing.authorUserId !== userId) return { error: "Forbidden" };

  const entryType = String(formData.get("entryType") ?? "NOTE") as LogEntryType;
  const text = String(formData.get("text") ?? "").trim();
  const workOrderIdRaw = String(formData.get("workOrderId") ?? "").trim();

  if (!text) return { error: "Text is required" };

  if (workOrderIdRaw) {
    const wo = await prisma.workOrder.findFirst({
      where: { id: workOrderIdRaw, yacht: { organizationId } },
      select: { id: true },
    });
    if (!wo) return { error: "Work order not found" };
  }

  await prisma.logEntry.update({
    where: { id: logId },
    data: {
      entryType,
      text,
      workOrderId: workOrderIdRaw ? workOrderIdRaw : null,
    },
  });

  revalidatePath("/logs");
  return { error: null };
}

export async function deleteLogEntry(logId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return { error: "Unauthorized" };

  const organizationId = requireOrganizationId(session);
  if (!organizationId) return { error: "Unauthorized" };

  const userId = (session.user as any).id as string;
  const role = (session.user as any).role as string;

  const existing = await prisma.logEntry.findFirst({
    where: { id: logId, yacht: { organizationId } },
    select: { id: true, authorUserId: true },
  });
  if (!existing) return { error: "Not found" };

  const canManage = isManagerOrAbove(role);
  if (!canManage && existing.authorUserId !== userId) return { error: "Forbidden" };

  await prisma.logEntry.delete({ where: { id: logId } });

  revalidatePath("/logs");
  return { error: null };
}
