"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isManagerOrAbove } from "@/lib/rbac";
import { revalidatePath } from "next/cache";
import { createNotification } from "@/actions/notifications";
import { requireOrganizationId } from "@/lib/organization";

export async function listWorkOrderComments(workOrderId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return { error: "Unauthorized", data: null };

  const organizationId = requireOrganizationId(session);
  if (!organizationId) return { error: "Unauthorized", data: null };

  const orderOk = await prisma.workOrder.findFirst({
    where: { id: workOrderId, yacht: { organizationId } },
    select: { id: true },
  });
  if (!orderOk) return { error: "Not found", data: null };

  const comments = await prisma.workOrderComment.findMany({
    where: { workOrderId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      text: true,
      createdAt: true,
      authorUserId: true,
      author: { select: { id: true, name: true } },
      attachments: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          fileName: true,
          mimeType: true,
          sizeBytes: true,
          url: true,
          createdAt: true,
          uploader: { select: { id: true, name: true } },
        },
      },
    },
  });

  return { error: null, data: comments };
}

// ✅ ahora acepta string (como tu TaskCommentsPanel ya lo usa)
export async function createWorkOrderComment(workOrderId: string, text: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return { error: "Unauthorized" };

  const organizationId = requireOrganizationId(session);
  if (!organizationId) return { error: "Unauthorized" };

  const value = String(text ?? "").trim();
  if (!value) return { error: "Comment cannot be empty" };
  if (value.length > 2000) return { error: "Comment too long (max 2000 chars)" };

  const order = await prisma.workOrder.findFirst({
    where: { id: workOrderId, yacht: { organizationId } },
    select: { id: true, title: true, createdByUserId: true, assignedToUserId: true },
  });
  if (!order) return { error: "Task not found" };

  const role = (session.user as any).role as string;
  const userId = (session.user as any).id as string;

  // Ajusta la regla si quieres:
  const canManage = isManagerOrAbove(role);
  const canComment = canManage || order.assignedToUserId === userId;
  if (!canComment) return { error: "Forbidden" };

  const comment = await prisma.workOrderComment.create({
    data: {
      workOrderId,
      authorUserId: userId,
      text: value,
    },
    select: { id: true },
  });

  const link = `/tasks/${workOrderId}`;
  const userIds = [order.createdByUserId, order.assignedToUserId].filter(
    (id): id is string => !!id && id !== userId
  );
  const uniqueIds = [...new Set(userIds)];
  for (const uid of uniqueIds) {
    await createNotification(
      uid,
      "TASK_UPDATED",
      "New comment on task",
      order.title,
      { link, workOrderId }
    );
  }

  revalidatePath(`/tasks/${workOrderId}`);
  return { error: null, data: { id: comment.id } };
}

// ✅ ahora solo necesita commentId (tu UI lo manda así)
export async function deleteWorkOrderComment(commentId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return { error: "Unauthorized" };

  const organizationId = requireOrganizationId(session);
  if (!organizationId) return { error: "Unauthorized" };

  const role = (session.user as any).role as string;
  const userId = (session.user as any).id as string;

  const comment = await prisma.workOrderComment.findFirst({
    where: { id: commentId, workOrder: { yacht: { organizationId } } },
    select: { id: true, authorUserId: true, workOrderId: true },
  });
  if (!comment) return { error: "Not found" };

  const canDelete = isManagerOrAbove(role) || comment.authorUserId === userId;
  if (!canDelete) return { error: "Forbidden" };

  await prisma.workOrderComment.delete({ where: { id: commentId } });

  revalidatePath(`/tasks/${comment.workOrderId}`);
  return { error: null };
}