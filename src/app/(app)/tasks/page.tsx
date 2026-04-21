import { Suspense } from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { listWorkOrders } from "@/actions/workOrders";
import { listYachts } from "@/actions/yachts";
import { canCreateWorkOrder } from "@/lib/rbac";
import { requireOrganizationId } from "@/lib/organization";

import { TasksFilters } from "./TasksFilters";
import WorkOrderCreatePanel from "./WorkOrderCreatePanel";
import { TaskCard } from "./TaskCard";

function ListSkeleton() {
  return (
    <div className="mt-6 space-y-4">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="h-28 animate-pulse rounded-[var(--apple-radius-lg)] border border-[var(--apple-border)] bg-[var(--apple-bg-elevated)]"
        />
      ))}
    </div>
  );
}

function taskStats(workOrders: { status: string }[]) {
  let todo = 0;
  let inProgress = 0;
  let done = 0;
  for (const wo of workOrders) {
    if (wo.status === "OPEN") todo += 1;
    else if (wo.status === "IN_PROGRESS" || wo.status === "WAITING_PARTS") inProgress += 1;
    else if (wo.status === "DONE" || wo.status === "CLOSED") done += 1;
  }
  return { total: workOrders.length, todo, inProgress, done };
}

export default async function TasksPage({
  searchParams,
}: {
  searchParams: Promise<{
    status?: string;
    statusGroup?: string;
    priority?: string;
    yachtId?: string;
    assignee?: string;
    due?: string;
  }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return (
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-[var(--apple-text-primary)]">Tasks</h1>
        <p className="mt-2 text-base text-red-600">Unauthorized</p>
      </div>
    );
  }

  const organizationId = requireOrganizationId(session);
  if (!organizationId) {
    return (
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-[var(--apple-text-primary)]">Tasks</h1>
        <p className="mt-2 text-base text-red-600">Unauthorized</p>
      </div>
    );
  }

  const params = await searchParams;

  const role = (session.user as any).role;
  const me = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { permissionOverrides: true },
  });
  const canCreate = canCreateWorkOrder(role, me?.permissionOverrides as Record<string, boolean> | null);

  const filters = {
    status: params.status as import("@prisma/client").WorkOrderStatus | undefined,
    statusGroup:
      params.statusGroup === "todo"
        ? ("todo" as const)
        : params.statusGroup === "in_progress"
          ? ("in_progress" as const)
          : params.statusGroup === "done"
            ? ("done" as const)
            : undefined,
    priority: params.priority as import("@prisma/client").Priority | undefined,
    yachtId: params.yachtId,
    assignedToUserId: params.assignee,
    dueFilter:
      params.due === "overdue"
        ? ("overdue" as const)
        : params.due === "upcoming"
          ? ("upcoming" as const)
          : undefined,
  };

  const [ordersRes, yachtsRes, users] = await Promise.all([
    listWorkOrders(filters),
    listYachts(),
    prisma.user.findMany({
      where: { isActive: true, organizationId },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const workOrders = (ordersRes as any)?.data ?? [];
  const error = (ordersRes as any)?.error ?? null;

  const yachts = (yachtsRes as any)?.data ?? [];
  const filteredYachtName = params.yachtId ? yachts.find((y: any) => y.id === params.yachtId)?.name : null;

  const stats = taskStats(workOrders);

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-[var(--apple-text-primary)]">Tasks</h1>
          <p className="mt-2 text-base text-[var(--apple-text-tertiary)]">Crew tasks &amp; assignments</p>
        </div>
        {canCreate ? (
          <WorkOrderCreatePanel
            yachts={yachts.map((y: any) => ({ id: y.id, name: y.name }))}
            users={users}
          />
        ) : null}
      </div>

      {error ? <p className="mt-3 text-base text-red-600">{error}</p> : null}

      <TasksFilters
        yachts={yachts.map((y: any) => ({ id: y.id, name: y.name }))}
        technicians={users}
        current={{ ...params, statusGroup: params.statusGroup ?? "" }}
      />

      {filteredYachtName ? (
        <div className="mt-6 flex items-start gap-3 rounded-[var(--apple-radius-lg)] border border-[rgba(90,143,143,0.35)] bg-[var(--ocean-teal-muted)]/50 px-4 py-3 text-sm text-[var(--apple-text-primary)]">
          <span
            className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--apple-bg-elevated)] text-sm font-bold text-[var(--palette-teal-dark)]"
            aria-hidden
          >
            i
          </span>
          <p>
            Showing tasks for yacht: <span className="font-semibold">{filteredYachtName}</span>
          </p>
        </div>
      ) : null}

      <Suspense fallback={<ListSkeleton />}>
        {workOrders.length === 0 ? (
          <div className="mt-8 rounded-[var(--apple-radius-lg)] border border-[var(--apple-border)] bg-[var(--apple-bg-elevated)] p-12 text-center text-[var(--apple-text-secondary)] shadow-[var(--apple-shadow-sm)]">
            No tasks match your filters.
          </div>
        ) : (
          <>
            <div className="mt-8 space-y-4">
              {workOrders.map((wo: any) => (
                <TaskCard key={wo.id} wo={wo} />
              ))}
            </div>

            <p className="mt-10 text-center text-sm text-[var(--apple-text-tertiary)]">
              No more tasks to show · <span aria-hidden>🎉</span> Great job! All caught up.
            </p>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <span className="rounded-[var(--apple-radius)] border border-[var(--apple-border)] bg-[var(--apple-bg-elevated)] px-4 py-2 text-xs font-semibold text-[var(--apple-text-secondary)] shadow-sm">
                {stats.total} total tasks
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-[var(--apple-radius)] border border-[var(--apple-border)] bg-[var(--apple-bg-elevated)] px-4 py-2 text-xs font-semibold text-[var(--apple-accent)] shadow-sm">
                <span className="h-2 w-2 rounded-full bg-[var(--apple-accent)]" aria-hidden />
                {stats.inProgress} in progress
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-[var(--apple-radius)] border border-[var(--apple-border)] bg-[var(--apple-bg-elevated)] px-4 py-2 text-xs font-semibold text-[var(--apple-text-secondary)] shadow-sm">
                <span className="h-2 w-2 rounded-full bg-[var(--apple-text-tertiary)]" aria-hidden />
                {stats.todo} to do
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-[var(--apple-radius)] border border-[var(--apple-border)] bg-[var(--apple-bg-elevated)] px-4 py-2 text-xs font-semibold text-[#0f766e] shadow-sm">
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {stats.done} done
              </span>
            </div>
          </>
        )}
      </Suspense>

      <div className="mt-10 flex items-start gap-3 rounded-[var(--apple-radius-lg)] border border-[rgba(90,143,143,0.25)] bg-[var(--ocean-teal-muted)]/35 px-4 py-3 text-sm text-[var(--apple-text-primary)]">
        <span className="text-lg" aria-hidden>
          💡
        </span>
        <p>
          <span className="font-medium">Tip:</span> Tap any task to view details, add photos, comments, and mark progress.
        </p>
      </div>
    </div>
  );
}
