import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isManagerOrAbove, canCreateWorkOrder } from "@/lib/rbac";
import { requireOrganizationId } from "@/lib/organization";
import { calendarEventOrgWhere } from "@/lib/calendarScopes";
import CalendarView from "./CalendarView";

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user) throw new Error("Unauthorized");

  const organizationId = requireOrganizationId(session);
  if (!organizationId) throw new Error("Unauthorized");

  const params = await searchParams;
  const initialDate = params.date ?? null;

  const role = (session.user as any).role as string;
  const canCreate = isManagerOrAbove(role);
  const canCreateTask = canCreateWorkOrder(role);

  const [events, tasks, yachts, users] = await Promise.all([
    prisma.calendarEvent.findMany({
      where: calendarEventOrgWhere(organizationId),
      orderBy: { startAt: "desc" },
      take: 500,
      select: {
        id: true,
        title: true,
        description: true,
        startAt: true,
        endAt: true,
        yachtId: true,
        assignedUserId: true,
      },
    }),
    prisma.workOrder.findMany({
      where: {
        yacht: { organizationId },
        OR: [
          { startDate: { not: null } },
          { dueDate: { not: null } },
        ],
        ...(isManagerOrAbove(role)
          ? {}
          : { assignedToUserId: session.user.id }),
      },
      orderBy: { dueDate: "asc" },
      take: 500,
      select: {
        id: true,
        title: true,
        startDate: true,
        dueDate: true,
        status: true,
        priority: true,
        yachtId: true,
        assignedToUserId: true,
      },
    }),
    prisma.yacht.findMany({
      where: { organizationId },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.user.findMany({
      where: { isActive: true, organizationId },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-[var(--apple-text-primary)]">
            Calendar
          </h1>
          <p className="mt-2 text-base text-[var(--apple-text-tertiary)]">
            Plan and manage yacht operations
          </p>
          <p className="mt-1 text-sm text-[var(--apple-text-tertiary)]">
            {canCreate ? "Tasks and events are displayed here" : "View events and tasks"}
          </p>
        </div>
      </div>

      <CalendarView
        initialEvents={events}
        initialTasks={tasks}
        yachts={yachts}
        users={users}
        canCreate={canCreate}
        canCreateTask={canCreateTask}
        initialDate={initialDate}
      />
    </div>
  );
}