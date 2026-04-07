"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  canCreateWorkOrder,
  canAssignWorkOrder,
  isManagerOrAbove,
} from "@/lib/rbac";
import type { Priority, WorkOrderStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { createNotification } from "@/actions/notifications";

/**
 * <input type="date"> manda YYYY-MM-DD.
 * Lo “anclamos” a medio día para evitar shift por timezone.
 */
function parseDateOnly(value: string): Date | null {
  const v = String(value ?? "").trim();
  if (!v) return null;
  const d = new Date(`${v}T12:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

const STATUS_GROUP_TODO: WorkOrderStatus[] = ["OPEN"];
const STATUS_GROUP_IN_PROGRESS: WorkOrderStatus[] = ["IN_PROGRESS", "WAITING_PARTS"];
const STATUS_GROUP_DONE: WorkOrderStatus[] = ["DONE", "CLOSED"];

export async function listWorkOrders(filters?: {
  status?: WorkOrderStatus;
  statusGroup?: "todo" | "in_progress" | "done";
  priority?: Priority;
  yachtId?: string;
  assignedToUserId?: string;
  dueFilter?: "overdue" | "upcoming";
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return { error: "Unauthorized", data: null };

  const baseWhere: Record<string, unknown> = {};
  if (!isManagerOrAbove(session.user.role)) {
    baseWhere.assignedToUserId = session.user.id;
  }
  if (filters?.statusGroup) {
    const groups = {
      todo: STATUS_GROUP_TODO,
      in_progress: STATUS_GROUP_IN_PROGRESS,
      done: STATUS_GROUP_DONE,
    };
    baseWhere.status = { in: groups[filters.statusGroup] };
  } else if (filters?.status) {
    baseWhere.status = filters.status;
  }
  if (filters?.priority) baseWhere.priority = filters.priority;
  if (filters?.yachtId) baseWhere.yachtId = filters.yachtId;
  if (filters?.assignedToUserId) baseWhere.assignedToUserId = filters.assignedToUserId;

  if (filters?.dueFilter === "overdue") {
    baseWhere.dueDate = { lt: new Date() };
    if (!baseWhere.status) baseWhere.status = { notIn: ["DONE", "CLOSED"] };
  }

  if (filters?.dueFilter === "upcoming") {
    baseWhere.dueDate = {
      gte: new Date(),
      lte: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    };
    if (!baseWhere.status) baseWhere.status = { notIn: ["CLOSED"] };
  }

  const orders = await prisma.workOrder.findMany({
    where: baseWhere,
    orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
    include: {
      yacht: { select: { id: true, name: true } },
      createdBy: { select: { id: true, name: true } },
      assignedTo: { select: { id: true, name: true, profileImage: true } },
      _count: { select: { comments: true, attachments: true } },
    },
  });

  return { error: null, data: orders };
}

export async function getWorkOrdersByYacht(yachtId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return { error: "Unauthorized", data: null };

  const baseWhere = { yachtId };
  if (!isManagerOrAbove(session.user.role)) {
    (baseWhere as Record<string, unknown>).assignedToUserId = session.user.id;
  }

  const orders = await prisma.workOrder.findMany({
    where: baseWhere,
    orderBy: { createdAt: "desc" },
    include: {
      yacht: { select: { id: true, name: true } },
      createdBy: { select: { id: true, name: true } },
      assignedTo: { select: { id: true, name: true, profileImage: true } },
      _count: { select: { comments: true, attachments: true } },
    },
  });

  return { error: null, data: orders };
}

/**
 * ✅ IMPORTANTE:
 * - Regresa { id } para poder subir attachments después.
 * - Si viene dueDate, crea un CalendarEvent all-day (startAt=endAt).
 */
export async function createWorkOrder(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return { error: "Unauthorized" };
  if (!canCreateWorkOrder(session.user.role)) return { error: "Forbidden" };

  const yachtId = String(formData.get("yachtId") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const descriptionRaw = String(formData.get("description") ?? "");
  const equipmentNameRaw = String(formData.get("equipmentName") ?? "");
  const priorityRaw = String(formData.get("priority") ?? "MEDIUM");
  const assignedToUserIdRaw = String(formData.get("assignedToUserId") ?? "").trim();
  const startDateRaw = String(formData.get("startDate") ?? "").trim();
  const dueDateRaw = String(formData.get("dueDate") ?? "").trim();

  if (!yachtId || !title) return { error: "Yacht and title required" };

  const allowedPriorities: Priority[] = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
  const priority: Priority = allowedPriorities.includes(priorityRaw as Priority)
    ? (priorityRaw as Priority)
    : "MEDIUM";

  const startDate = startDateRaw ? parseDateOnly(startDateRaw) : null;
  if (startDateRaw && !startDate) return { error: "Invalid start date" };

  const dueDate = dueDateRaw ? parseDateOnly(dueDateRaw) : null;
  if (dueDateRaw && !dueDate) return { error: "Invalid due date" };

  const created = await prisma.workOrder.create({
    data: {
      yachtId,
      title,
      description: descriptionRaw.trim() || null,
      equipmentName: equipmentNameRaw.trim() || null,
      priority,
      createdByUserId: session.user.id,
      assignedToUserId: assignedToUserIdRaw || null,
      startDate,
      dueDate,
    },
    select: { id: true, title: true, startDate: true, dueDate: true, yachtId: true, assignedToUserId: true },
  });

  if (created.assignedToUserId && created.assignedToUserId !== session.user.id) {
    await createNotification(
      created.assignedToUserId,
      "TASK_ASSIGNED",
      "Task assigned to you",
      created.title,
      { link: `/tasks/${created.id}`, workOrderId: created.id }
    );
  }

  revalidatePath("/tasks");
  revalidatePath("/yachts");
  if (created.startDate || created.dueDate) revalidatePath("/calendar");

  // ✅ regresamos el ID para attachments / redirect / etc.
  return { error: null, id: created.id };
}

export async function updateWorkOrderStatus(workOrderId: string, status: WorkOrderStatus) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return { error: "Unauthorized" };

  const order = await prisma.workOrder.findUnique({
    where: { id: workOrderId },
    select: { id: true, title: true, createdByUserId: true, assignedToUserId: true },
  });
  if (!order) return { error: "Not found" };

  if (!isManagerOrAbove(session.user.role)) {
    if (order.assignedToUserId !== session.user.id)
      return { error: "You can only update status of assigned work orders" };
  }

  await prisma.workOrder.update({
    where: { id: workOrderId },
    data: { status },
  });

  const statusLabel = status.replace(/_/g, " ").toLowerCase();
  const link = `/tasks/${workOrderId}`;
  const userIds = [order.createdByUserId, order.assignedToUserId].filter(
    (id): id is string => !!id && id !== session.user.id
  );
  const uniqueIds = [...new Set(userIds)];
  for (const uid of uniqueIds) {
    await createNotification(
      uid,
      "TASK_UPDATED",
      "Task status updated",
      `${order.title} → ${statusLabel}`,
      { link, workOrderId }
    );
  }

  revalidatePath("/tasks");
  revalidatePath(`/tasks/${workOrderId}`);
  revalidatePath("/dashboard");
  return { error: null };
}

export async function assignWorkOrder(workOrderId: string, userId: string | null) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return { error: "Unauthorized" };
  if (!canAssignWorkOrder(session.user.role)) return { error: "Forbidden" };

  await prisma.workOrder.update({
    where: { id: workOrderId },
    data: { assignedToUserId: userId || null },
  });

  if (userId) {
    const order = await prisma.workOrder.findUnique({
      where: { id: workOrderId },
      select: { title: true },
    });
    if (order) {
      await createNotification(
        userId,
        "TASK_ASSIGNED",
        "Task assigned to you",
        order.title,
        { link: `/tasks/${workOrderId}`, workOrderId }
      );
    }
  }

  revalidatePath("/tasks");
  revalidatePath(`/tasks/${workOrderId}`);
  return { error: null };
}

export async function deleteWorkOrder(workOrderId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return { error: "Unauthorized" };

  if (!isManagerOrAbove(session.user.role)) return { error: "Forbidden" };

  const existing = await prisma.workOrder.findUnique({
    where: { id: workOrderId },
    select: { id: true },
  });
  if (!existing) return { error: "Not found" };

  await prisma.workOrder.delete({ where: { id: workOrderId } });

  revalidatePath("/tasks");
  revalidatePath("/yachts");
  return { error: null };
}

export async function updateWorkOrderDetails(workOrderId: string, formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return { error: "Unauthorized" };

  const order = await prisma.workOrder.findUnique({
    where: { id: workOrderId },
    select: { id: true, title: true, createdByUserId: true, assignedToUserId: true },
  });
  if (!order) return { error: "Not found" };

  const role = session.user.role;
  const userId = session.user.id;

  const canManage = isManagerOrAbove(role);
  const isAssignee = order.assignedToUserId === userId;

  if (!canManage && !isAssignee) return { error: "Forbidden" };

  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const equipmentName = String(formData.get("equipmentName") ?? "").trim();
  const priorityRaw = String(formData.get("priority") ?? "").trim();
  const startDateRaw = String(formData.get("startDate") ?? "").trim();
  const dueDateRaw = String(formData.get("dueDate") ?? "").trim();

  if (!title) return { error: "Title is required" };

  const allowedPriorities: Priority[] = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
  const priority: Priority = allowedPriorities.includes(priorityRaw as Priority)
    ? (priorityRaw as Priority)
    : "MEDIUM";

  const startDate = startDateRaw ? parseDateOnly(startDateRaw) : null;
  if (startDateRaw && !startDate) return { error: "Invalid start date" };

  const dueDate = dueDateRaw ? parseDateOnly(dueDateRaw) : null;
  if (dueDateRaw && !dueDate) return { error: "Invalid due date" };

  await prisma.workOrder.update({
    where: { id: workOrderId },
    data: {
      title,
      description: description || null,
      equipmentName: equipmentName || null,
      priority,
      startDate,
      dueDate,
    },
  });

  const link = `/tasks/${workOrderId}`;
  const userIds = [order.createdByUserId, order.assignedToUserId].filter(
    (id): id is string => !!id && id !== session.user.id
  );
  const uniqueIds = [...new Set(userIds)];
  for (const uid of uniqueIds) {
    await createNotification(uid, "TASK_UPDATED", "Task updated", order.title, { link, workOrderId });
  }

  revalidatePath("/tasks");
  revalidatePath(`/tasks/${workOrderId}`);
  revalidatePath("/calendar");
  return { error: null };
}