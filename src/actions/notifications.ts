"use server";

import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isManagerOrAbove } from "@/lib/rbac";
import type { NotificationType } from "@prisma/client";

export type NotificationPreferences = {
  taskAssigned?: boolean;
  dueToday?: boolean;
  taskUpdated?: boolean;
};

const TYPE_TO_PREF_KEY: Record<NotificationType, keyof NotificationPreferences> = {
  TASK_ASSIGNED: "taskAssigned",
  TASK_DUE_TODAY: "dueToday",
  TASK_UPDATED: "taskUpdated",
};

function isNotificationEnabled(prefs: NotificationPreferences | null, type: NotificationType): boolean {
  if (!prefs) return true;
  const key = TYPE_TO_PREF_KEY[type];
  const val = prefs[key];
  return val !== false;
}

/** Create a notification for a user (internal use). Skips if user has disabled this type. */
export async function createNotification(
  userId: string,
  type: NotificationType,
  title: string,
  body: string,
  options?: { link?: string; workOrderId?: string }
) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { notificationPreferences: true },
  });
  const prefs = (user?.notificationPreferences ?? {}) as NotificationPreferences | null;
  if (!isNotificationEnabled(prefs, type)) return;

  await prisma.notification.create({
    data: {
      userId,
      type,
      title,
      body,
      link: options?.link ?? null,
      workOrderId: options?.workOrderId ?? null,
    },
  });
}

/** Get notifications for the current user: from DB (recent) + "due today" tasks. Respects notification preferences. */
export async function getNotificationsForCurrentUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { error: "Unauthorized", data: null };

  const userId = session.user.id;
  const role = (session.user as { role?: string })?.role;

  const whereClause =
    role && isManagerOrAbove(role)
      ? { OR: [{ createdByUserId: userId }, { assignedToUserId: userId }] }
      : { assignedToUserId: userId };

  const [userPrefs, dbNotifications, dueTodayOrders] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { notificationPreferences: true },
    }),
    prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        type: true,
        title: true,
        body: true,
        link: true,
        read: true,
        createdAt: true,
      },
    }),
    prisma.workOrder.findMany({
      where: {
        ...whereClause,
        dueDate: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
          lt: new Date(new Date().setHours(23, 59, 59, 999)),
        },
        status: { notIn: ["DONE", "CLOSED"] },
      },
      select: { id: true, title: true },
    }),
  ]);

  const prefs = (userPrefs?.notificationPreferences ?? {}) as NotificationPreferences | null;

  const formatTime = (d: Date) => {
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    if (diff < 60 * 1000) return "Just now";
    if (diff < 60 * 60 * 1000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 24 * 60 * 60 * 1000) return `${Math.floor(diff / 3600000)}h ago`;
    return d.toLocaleDateString();
  };

  const dueTodayItems =
    isNotificationEnabled(prefs, "TASK_DUE_TODAY") ?
      dueTodayOrders.map((wo) => ({
        id: `due-today-${wo.id}`,
        title: "Due today",
        body: wo.title,
        time: "Today",
        unread: true as boolean,
        link: `/tasks/${wo.id}`,
      }))
    : [];

  const dbItems = dbNotifications
    .filter((n) => isNotificationEnabled(prefs, n.type))
    .map((n) => ({
      id: n.id,
      title: n.title,
      body: n.body,
      time: formatTime(n.createdAt),
      unread: !n.read,
      link: n.link ?? undefined,
    }));

  const list = [...dueTodayItems, ...dbItems];

  return { error: null, data: list };
}

export async function markNotificationRead(notificationId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { error: "Unauthorized" };

  await prisma.notification.updateMany({
    where: { id: notificationId, userId: session.user.id },
    data: { read: true },
  });
  return { error: null };
}

/** Get current user's notification preferences (for profile page). */
export async function getNotificationPreferences(): Promise<NotificationPreferences> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return {};

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { notificationPreferences: true },
  });
  const prefs = user?.notificationPreferences as NotificationPreferences | null;
  return {
    taskAssigned: prefs?.taskAssigned !== false,
    dueToday: prefs?.dueToday !== false,
    taskUpdated: prefs?.taskUpdated !== false,
  };
}

/** Update current user's notification preferences. */
export async function updateNotificationPreferences(prefs: NotificationPreferences) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { error: "Unauthorized" };

  await prisma.user.update({
    where: { id: session.user.id },
    data: { notificationPreferences: prefs as object },
  });
  revalidatePath("/profile");
  revalidatePath("/", "layout");
  return { error: null };
}
