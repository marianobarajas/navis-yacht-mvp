"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isManagerOrAbove, canCreateWorkOrder } from "@/lib/rbac";
import { revalidatePath } from "next/cache";
import type { ExpenseLogStatus } from "@prisma/client";
import { requireOrganizationId } from "@/lib/organization";

function parseDateOnly(value: string): Date | null {
  const v = String(value ?? "").trim();
  if (!v) return null;
  const d = new Date(`${v}T12:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

async function canAccessYacht(
  organizationId: string,
  userId: string,
  role: string,
  yachtId: string
): Promise<boolean> {
  const yacht = await prisma.yacht.findFirst({
    where: { id: yachtId, organizationId },
    select: { id: true },
  });
  if (!yacht) return false;
  if (isManagerOrAbove(role)) return true;
  const assigned = await prisma.assignment.findFirst({
    where: { yachtId, userId },
  });
  return !!assigned;
}

export async function listExpenseLogsByYacht(yachtId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return { error: "Unauthorized", data: null };

  const organizationId = requireOrganizationId(session);
  if (!organizationId) return { error: "Unauthorized", data: null };

  const userId = (session.user as any).id as string;
  const role = (session.user as any).role as string;

  if (!(await canAccessYacht(organizationId, userId, role, yachtId))) {
    return { error: "Forbidden", data: null };
  }

  const logs = await prisma.expenseLog.findMany({
    where: { yachtId },
    orderBy: { date: "desc" },
  });

  return { error: null, data: logs };
}

export async function createExpenseLog(yachtId: string, formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return { error: "Unauthorized" };

  const organizationId = requireOrganizationId(session);
  if (!organizationId) return { error: "Unauthorized" };

  const userId = (session.user as any).id as string;
  const role = (session.user as any).role as string;

  if (!(await canAccessYacht(organizationId, userId, role, yachtId))) {
    return { error: "Forbidden" };
  }

  const service = String(formData.get("service") ?? "").trim();
  const costRaw = String(formData.get("cost") ?? "0").trim();
  const dateRaw = String(formData.get("date") ?? "").trim();
  const comments = String(formData.get("comments") ?? "").trim() || null;
  const createTask = formData.get("createTask") === "true" || formData.get("createTask") === "on";
  const priorityRaw = String(formData.get("priority") ?? "MEDIUM").trim();
  const assignedToUserIdRaw = String(formData.get("assignedToUserId") ?? "").trim();

  if (!service) return { error: "Service is required" };

  const cost = costRaw === "" ? 0 : parseFloat(costRaw);
  if (Number.isNaN(cost) || cost < 0) return { error: "Invalid cost" };

  const date = parseDateOnly(dateRaw);
  if (!date) return { error: "Date is required" };

  if (createTask && !canCreateWorkOrder(role)) {
    return { error: "Cannot create tasks" };
  }

  const allowedPriorities = ["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const;
  const priority = allowedPriorities.includes(priorityRaw as (typeof allowedPriorities)[number])
    ? (priorityRaw as (typeof allowedPriorities)[number])
    : "MEDIUM";

  await prisma.expenseLog.create({
    data: { yachtId, service, cost, date, comments, status: "PENDING_APPROVAL" },
  });

  if (createTask) {
    if (assignedToUserIdRaw) {
      const assignee = await prisma.user.findFirst({
        where: { id: assignedToUserIdRaw, organizationId },
        select: { id: true },
      });
      if (!assignee) return { error: "Assignee not found in your organization" };
    }
    await prisma.workOrder.create({
      data: {
        yachtId,
        title: service,
        description: comments,
        priority,
        status: "OPEN",
        createdByUserId: userId,
        assignedToUserId: assignedToUserIdRaw || null,
        startDate: date,
        dueDate: date,
      },
    });
    revalidatePath("/tasks");
  }

  revalidatePath("/logs");
  return { error: null };
}

export async function updateExpenseLog(id: string, formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return { error: "Unauthorized" };

  const organizationId = requireOrganizationId(session);
  if (!organizationId) return { error: "Unauthorized" };

  const userId = (session.user as any).id as string;
  const role = (session.user as any).role as string;

  const existing = await prisma.expenseLog.findFirst({
    where: { id, yacht: { organizationId } },
    select: { yachtId: true },
  });
  if (!existing) return { error: "Not found" };

  if (!(await canAccessYacht(organizationId, userId, role, existing.yachtId))) {
    return { error: "Forbidden" };
  }

  const service = String(formData.get("service") ?? "").trim();
  const costRaw = String(formData.get("cost") ?? "0").trim();
  const dateRaw = String(formData.get("date") ?? "").trim();
  const comments = String(formData.get("comments") ?? "").trim() || null;
  const createTask = formData.get("createTask") === "true" || formData.get("createTask") === "on";
  const priorityRaw = String(formData.get("priority") ?? "MEDIUM").trim();
  const assignedToUserIdRaw = String(formData.get("assignedToUserId") ?? "").trim();

  if (!service) return { error: "Service is required" };

  const cost = costRaw === "" ? 0 : parseFloat(costRaw);
  if (Number.isNaN(cost) || cost < 0) return { error: "Invalid cost" };

  const date = parseDateOnly(dateRaw);
  if (!date) return { error: "Date is required" };

  if (createTask && !canCreateWorkOrder(role)) {
    return { error: "Cannot create tasks" };
  }

  const allowedPriorities = ["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const;
  const priority = allowedPriorities.includes(priorityRaw as (typeof allowedPriorities)[number])
    ? (priorityRaw as (typeof allowedPriorities)[number])
    : "MEDIUM";

  await prisma.expenseLog.update({
    where: { id },
    data: { service, cost, date, comments },
  });

  if (createTask) {
    if (assignedToUserIdRaw) {
      const assignee = await prisma.user.findFirst({
        where: { id: assignedToUserIdRaw, organizationId },
        select: { id: true },
      });
      if (!assignee) return { error: "Assignee not found in your organization" };
    }
    await prisma.workOrder.create({
      data: {
        yachtId: existing.yachtId,
        title: service,
        description: comments,
        priority,
        status: "OPEN",
        createdByUserId: userId,
        assignedToUserId: assignedToUserIdRaw || null,
        startDate: date,
        dueDate: date,
      },
    });
    revalidatePath("/tasks");
  }

  revalidatePath("/logs");
  return { error: null };
}

export async function updateExpenseLogStatus(id: string, status: ExpenseLogStatus) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return { error: "Unauthorized" };

  const organizationId = requireOrganizationId(session);
  if (!organizationId) return { error: "Unauthorized" };

  const userId = (session.user as any).id as string;
  const role = (session.user as any).role as string;

  const existing = await prisma.expenseLog.findFirst({
    where: { id, yacht: { organizationId } },
    select: { yachtId: true },
  });
  if (!existing) return { error: "Not found" };

  if (!(await canAccessYacht(organizationId, userId, role, existing.yachtId))) {
    return { error: "Forbidden" };
  }

  const valid: ExpenseLogStatus[] = ["PENDING_APPROVAL", "APPROVED", "PAID"];
  if (!valid.includes(status)) return { error: "Invalid status" };

  await prisma.expenseLog.update({
    where: { id },
    data: { status },
  });

  revalidatePath("/logs");
  return { error: null };
}

export async function deleteExpenseLog(id: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return { error: "Unauthorized" };

  const organizationId = requireOrganizationId(session);
  if (!organizationId) return { error: "Unauthorized" };

  const userId = (session.user as any).id as string;
  const role = (session.user as any).role as string;

  const existing = await prisma.expenseLog.findFirst({
    where: { id, yacht: { organizationId } },
    select: { yachtId: true },
  });
  if (!existing) return { error: "Not found" };

  if (!(await canAccessYacht(organizationId, userId, role, existing.yachtId))) {
    return { error: "Forbidden" };
  }

  await prisma.expenseLog.delete({ where: { id } });

  revalidatePath("/logs");
  return { error: null };
}
