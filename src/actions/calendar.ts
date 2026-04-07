// src/actions/calendar.ts
"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { calendarEventOrgWhere } from "@/lib/calendarScopes";
import { canCreateCalendarEvent, canCreateWorkOrder } from "@/lib/rbac";
import { revalidatePath } from "next/cache";
import { requireOrganizationId } from "@/lib/organization";

/**
 * Parses an <input type="date"> value (YYYY-MM-DD) into a stable Date.
 * We pin it to noon to avoid timezone shifting to previous/next day.
 */
function parseDateOnly(value: string): Date | null {
  const v = String(value ?? "").trim();
  if (!v) return null;
  const d = new Date(`${v}T12:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

export async function listEvents() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return { error: "Unauthorized", data: null };

  const organizationId = requireOrganizationId(session);
  if (!organizationId) return { error: "Unauthorized", data: null };

  const events = await prisma.calendarEvent.findMany({
    where: calendarEventOrgWhere(organizationId),
    orderBy: { startAt: "asc" },
    select: {
      id: true,
      title: true,
      startAt: true,
      endAt: true,
      yachtId: true,
      assignedUserId: true,
      createdByUserId: true,
      createdAt: true,
      yacht: { select: { id: true, name: true } },
      assignedTo: { select: { id: true, name: true } },
    },
  });

  return { error: null, data: events };
}

export async function createEvent(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return { error: "Unauthorized" };

  const organizationId = requireOrganizationId(session);
  if (!organizationId) return { error: "Unauthorized" };

  const role = (session.user as any).role;
  if (!canCreateCalendarEvent(role)) return { error: "Forbidden" };

  const title = String(formData.get("title") ?? "").trim();
  const yachtIdRaw = String(formData.get("yachtId") ?? "").trim();
  const assignedUserIdRaw = String(formData.get("assignedUserId") ?? "").trim();
  const startAtRaw = String(formData.get("startAt") ?? "").trim();
  const endAtRaw = String(formData.get("endAt") ?? "").trim();
  const createTask = formData.get("createTask") === "true" || formData.get("createTask") === "on";
  const priorityRaw = String(formData.get("priority") ?? "MEDIUM").trim();
  const description = String(formData.get("description") ?? "").trim();

  if (!title || !startAtRaw) return { error: "Missing required fields" };

  const startAt = parseDateOnly(startAtRaw);
  if (!startAt) return { error: "Invalid start date" };

  const endAt = endAtRaw ? parseDateOnly(endAtRaw) : null;
  if (endAtRaw && !endAt) return { error: "Invalid end date" };
  if (endAt && endAt < startAt) return { error: "End must be after Start" };

  const allowedPriorities = ["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const;
  const priority = allowedPriorities.includes(priorityRaw as (typeof allowedPriorities)[number])
    ? (priorityRaw as (typeof allowedPriorities)[number])
    : "MEDIUM";

  if (yachtIdRaw) {
    const y = await prisma.yacht.findFirst({
      where: { id: yachtIdRaw, organizationId },
      select: { id: true },
    });
    if (!y) return { error: "Yacht not found in your organization" };
  }
  if (assignedUserIdRaw) {
    const u = await prisma.user.findFirst({
      where: { id: assignedUserIdRaw, organizationId },
      select: { id: true },
    });
    if (!u) return { error: "User not found in your organization" };
  }

  // If "Create a Task" is checked, require yacht and create WorkOrder
  if (createTask) {
    if (!canCreateWorkOrder(role)) return { error: "Cannot create tasks" };
    if (!yachtIdRaw) return { error: "Yacht is required when creating a task" };

    await prisma.workOrder.create({
      data: {
        yachtId: yachtIdRaw,
        title,
        description: description || null,
        priority,
        status: "OPEN",
        createdByUserId: (session.user as any).id,
        assignedToUserId: assignedUserIdRaw || null,
        startDate: startAt,
        dueDate: endAt ?? startAt,
      },
    });
    revalidatePath("/tasks");
  } else {
    await prisma.calendarEvent.create({
      data: {
        title,
        startAt,
        endAt: endAt ?? startAt,
        yachtId: yachtIdRaw || null,
        assignedUserId: assignedUserIdRaw || null,
        createdByUserId: (session.user as any).id,
      },
    });
  }

  revalidatePath("/calendar");
  return { error: null };
}

/**
 * For your EventEditPanel: update an existing event.
 * Same validation rules as createEvent.
 */
export async function updateEvent(eventId: string, formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return { error: "Unauthorized" };

  const organizationId = requireOrganizationId(session);
  if (!organizationId) return { error: "Unauthorized" };

  const role = (session.user as any).role;
  if (!canCreateCalendarEvent(role)) return { error: "Forbidden" };

  const existing = await prisma.calendarEvent.findFirst({
    where: { id: eventId, ...calendarEventOrgWhere(organizationId) },
    select: { id: true },
  });
  if (!existing) return { error: "Not found" };

  const title = String(formData.get("title") ?? "").trim();
  const yachtIdRaw = String(formData.get("yachtId") ?? "").trim();
  const assignedUserIdRaw = String(formData.get("assignedUserId") ?? "").trim();
  const startAtRaw = String(formData.get("startAt") ?? "").trim();
  const endAtRaw = String(formData.get("endAt") ?? "").trim();

  if (!title || !startAtRaw) return { error: "Missing required fields" };

  const startAt = parseDateOnly(startAtRaw);
  if (!startAt) return { error: "Invalid start date" };

  const endAt = endAtRaw ? parseDateOnly(endAtRaw) : null;
  if (endAtRaw && !endAt) return { error: "Invalid end date" };
  if (endAt && endAt < startAt) return { error: "End must be after Start" };

  if (yachtIdRaw) {
    const y = await prisma.yacht.findFirst({
      where: { id: yachtIdRaw, organizationId },
      select: { id: true },
    });
    if (!y) return { error: "Yacht not found in your organization" };
  }
  if (assignedUserIdRaw) {
    const u = await prisma.user.findFirst({
      where: { id: assignedUserIdRaw, organizationId },
      select: { id: true },
    });
    if (!u) return { error: "User not found in your organization" };
  }

  await prisma.calendarEvent.update({
    where: { id: eventId },
    data: {
      title,
      startAt,
      endAt: endAt,
      yachtId: yachtIdRaw || null,
      assignedUserId: assignedUserIdRaw || null,
    },
  });

  revalidatePath("/calendar");
  return { error: null };
}

// Optional: if you want delete from the edit modal.
export async function deleteEvent(eventId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return { error: "Unauthorized" };

  const organizationId = requireOrganizationId(session);
  if (!organizationId) return { error: "Unauthorized" };

  const role = (session.user as any).role;
  if (!canCreateCalendarEvent(role)) return { error: "Forbidden" };

  const existing = await prisma.calendarEvent.findFirst({
    where: { id: eventId, ...calendarEventOrgWhere(organizationId) },
    select: { id: true },
  });
  if (!existing) return { error: "Not found" };

  await prisma.calendarEvent.delete({ where: { id: eventId } });
  revalidatePath("/calendar");
  return { error: null };
}

// Back-compat alias (si ya lo usas en algún lado)
export const createCalendarEvent = createEvent;