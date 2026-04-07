"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { isManagerOrAbove } from "@/lib/rbac";
import type { LogEntryType } from "@prisma/client";

export async function listRecentLogs(limit = 50) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return { error: "Unauthorized", data: null };

  const logs = await prisma.logEntry.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      yacht: { select: { id: true, name: true } },
      workOrder: { select: { id: true, title: true } },
      author: { select: { id: true, name: true } },
    },
  });

  return { error: null, data: logs };
}

export async function updateLogEntry(logId: string, formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return { error: "Unauthorized" };

  const role = (session.user as any).role as string;
  const userId = (session.user as any).id as string;

  const existing = await prisma.logEntry.findUnique({
    where: { id: logId },
    select: { id: true, authorUserId: true },
  });
  if (!existing) return { error: "Not found" };

  if (!isManagerOrAbove(role) && existing.authorUserId !== userId) {
    return { error: "Forbidden" };
  }

  const entryType = String(formData.get("entryType") ?? "").trim();
  const text = String(formData.get("text") ?? "").trim();
  const workOrderIdRaw = String(formData.get("workOrderId") ?? "").trim();

  if (!entryType) return { error: "Entry type is required" };
  if (!text) return { error: "Text is required" };

  await prisma.logEntry.update({
    where: { id: logId },
    data: {
      entryType: entryType as any,
      text, // ✅ siempre string, nunca null
      workOrderId: workOrderIdRaw ? workOrderIdRaw : null, // ✅ nullable ok
    },
  });

  revalidatePath("/logs");
  revalidatePath("/dashboard");
  return { error: null };
}

export async function deleteLogEntry(logId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return { error: "Unauthorized" };

  const role = (session.user as any).role as string;
  const userId = (session.user as any).id as string;

  const existing = await prisma.logEntry.findUnique({
    where: { id: logId },
    select: { id: true, authorUserId: true },
  });
  if (!existing) return { error: "Not found" };

  // regla: autor puede borrar lo suyo, manager/admin puede borrar todo
  if (!isManagerOrAbove(role) && existing.authorUserId !== userId) {
    return { error: "Forbidden" };
  }

  await prisma.logEntry.delete({ where: { id: logId } });

  revalidatePath("/logs");
  revalidatePath("/dashboard");
  return { error: null };
}