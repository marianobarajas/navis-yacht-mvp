import { Suspense } from "react";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getDashboardStats } from "@/actions/dashboard";
import { listWorkOrders } from "@/actions/workOrders";
import { listCrew } from "@/actions/users";
import { listYachts } from "@/actions/yachts";
import { canCreateWorkOrder } from "@/lib/rbac";

import { DashboardSprintPlanning } from "@/components/DashboardSprintPlanning";
import { DashboardCalendarPreview } from "@/components/DashboardCalendarPreview";
import { MyYachtsWidget } from "@/components/MyYachtsWidget";
import { CrewCard } from "@/components/CrewCard";
import { roleSortIndex } from "@/lib/crew";

/** Frosted glass panels + lift on hover (dashboard hero only) — ring + stronger icon wells for contrast on photo */
const GLASS_PANEL =
  "rounded-xl border border-white/25 bg-white/12 shadow-lg shadow-black/20 ring-1 ring-white/20 backdrop-blur-xl backdrop-saturate-150 transition-all duration-300 ease-out hover:scale-[1.015] hover:border-white/50 hover:bg-white/[0.18] hover:ring-white/35 hover:shadow-[0_24px_55px_-12px_rgba(0,0,0,0.55)]";

/** Brighter frosted chip so vector icons stay visible on aerial hero */
const ICON_WELL =
  "flex h-10 w-10 items-center justify-center rounded-lg border border-white/50 bg-white/40 shadow-md shadow-black/30 ring-2 ring-white/25 backdrop-blur-sm";
const HERO_LINK =
  "text-xs font-semibold text-white/90 drop-shadow-[0_1px_2px_rgba(0,0,0,0.65)] transition-colors hover:text-white";
/** Avoid icon / CTA overlap on narrow 2-col cards (flex min-width:auto overflow). */
const METRIC_CARD_HEADER =
  "grid grid-cols-[auto_minmax(0,1fr)] items-start gap-2";
const METRIC_CARD_CTA = `${HERO_LINK} min-w-0 justify-self-end text-right leading-snug break-words`;
const DASH_CTA =
  "inline-flex items-center gap-2 rounded-lg border border-white/25 bg-[var(--apple-accent)] px-4 py-2 text-sm font-semibold text-white shadow-md shadow-black/25 ring-1 ring-white/20 transition-colors hover:bg-[var(--apple-accent-hover)] hover:ring-white/35";

function MetricCardsSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
      <div className="lg:col-span-3 h-56 animate-pulse rounded-[var(--apple-radius)] bg-white/10 backdrop-blur-md" />
      <div className="lg:col-span-1 h-56 animate-pulse rounded-[var(--apple-radius)] bg-white/10 backdrop-blur-md" />
    </div>
  );
}

function clampPercent(n: number) {
  if (Number.isNaN(n) || !Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, Math.round(n)));
}

/** Helpers **/
function addDays(d: Date, days: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + days);
  return x;
}
function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}
async function DashboardContent() {
  const session = await getServerSession(authOptions);
  const me = session?.user?.id
    ? await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { role: true, permissionOverrides: true },
      })
    : null;
  const canAddTask = !!me && canCreateWorkOrder(me.role, me.permissionOverrides as Record<string, boolean> | null);

  const [statsRes, workOrdersRes, crewRes, yachtsRes] =
    await Promise.all([
      getDashboardStats(),
      listWorkOrders(),
      listCrew(),
      listYachts(),
    ]);

  const yachts = (yachtsRes as any)?.data ?? [];
  const stats = (statsRes as any)?.data ?? {};
  const totalCompletionPercent = stats.totalCompletionPercent ?? 0;
  const totalAssigned = stats.totalAssigned ?? 0;
  const totalCompleted = stats.totalCompleted ?? 0;
  const expenseTotal = stats.expenseTotal ?? 0;
  const openTasks = totalAssigned - totalCompleted;

  const workOrders = (workOrdersRes as any)?.data ?? [];
  const crewRaw = (crewRes as any)?.data ?? [];

  // ===== Day range: today -2 to today +4 (7 days) =====
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const rangeStart = addDays(now, -2);
  const rangeEnd = addDays(now, 5); // exclusive end for +4 (today+0..+4)
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(rangeStart, i));

  const ordersWithDue = (workOrders ?? []).filter((wo: any) => wo?.dueDate);

  const weekOrders = ordersWithDue.filter((wo: any) => {
    const due = new Date(wo.dueDate);
    due.setHours(0, 0, 0, 0);
    return due >= rangeStart && due < rangeEnd;
  });

  const weekTotal = weekOrders.length;
  const weekCompleted = weekOrders.filter((wo: any) =>
    ["DONE", "CLOSED"].includes(wo.status)
  ).length;

  const weekCompletionPercent =
    weekTotal === 0 ? 0 : clampPercent((weekCompleted / weekTotal) * 100);

  const PRIORITY_ORDER: Record<string, number> = {
    CRITICAL: 0,
    HIGH: 1,
    MEDIUM: 2,
    LOW: 3,
  };
  const weekBuckets = weekDays.map((day) => {
    const items = weekOrders
      .filter((wo: any) => isSameDay(new Date(wo.dueDate), day))
      .sort((a: any, b: any) => (PRIORITY_ORDER[a.priority] ?? 4) - (PRIORITY_ORDER[b.priority] ?? 4))
      .slice(0, 3);
    return { day, items };
  });

  const calendarPreviewDays = weekBuckets.map(({ day, items }) => ({
    iso: day.toISOString(),
    items: items.map((wo: any) => ({
      id: wo.id,
      title: wo.title ?? "Task",
      priority: wo.priority ?? "MEDIUM",
      dueDate: wo.dueDate ? new Date(wo.dueDate).toISOString() : null,
      status: wo.status ?? "OPEN",
    })),
  }));

  // Crew: on duty / active first, then by yacht position (Captain → …)
  const crew = [...crewRaw].sort((a: any, b: any) => {
    const aWork = a.shiftStatus === "ON_DUTY" || a.shiftStatus === "ACTIVE" ? 1 : 0;
    const bWork = b.shiftStatus === "ON_DUTY" || b.shiftStatus === "ACTIVE" ? 1 : 0;
    if (aWork !== bWork) return bWork - aWork;
    return roleSortIndex(a.role) - roleSortIndex(b.role);
  });

  return (
    <>
      {/* Summary cards row - reference style */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Link href="/tasks" className={`${GLASS_PANEL} block p-4`}>
          <div className={METRIC_CARD_HEADER}>
            <div className={`${ICON_WELL} shrink-0 bg-rose-400/35`}>
              <svg className="h-5 w-5 text-rose-50 drop-shadow-[0_1px_3px_rgba(0,0,0,0.75)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.25}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <span className={METRIC_CARD_CTA}>View All →</span>
          </div>
          <p className="mt-2 text-sm font-medium text-[var(--apple-text-secondary)]">Tasks</p>
          <p className="mt-0.5 text-xl font-bold text-[var(--apple-text-primary)]">
            <span className="text-[var(--accent-urgent)]">{openTasks}</span>
            <span className="text-sm font-normal text-[var(--apple-text-secondary)]"> open</span>
            {" · "}
            <span className="text-[var(--apple-text-primary)]">{totalAssigned}</span>{" "}
            <span className="text-sm font-normal text-[var(--apple-text-secondary)]">total</span>
          </p>
        </Link>
        <Link href="/calendar" className={`${GLASS_PANEL} block p-4`}>
          <div className={METRIC_CARD_HEADER}>
            <div className={`${ICON_WELL} shrink-0 bg-sky-400/35`}>
              <svg className="h-5 w-5 text-sky-50 drop-shadow-[0_1px_3px_rgba(0,0,0,0.75)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.25}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <span className={METRIC_CARD_CTA}>View Schedule →</span>
          </div>
          <p className="mt-2 text-sm font-medium text-[var(--apple-text-secondary)]">Calendar</p>
          <p className="mt-0.5 text-xl font-bold text-sky-100 drop-shadow-[0_1px_3px_rgba(0,0,0,0.75)]">
            {weekTotal} <span className="text-sm font-normal text-sky-100/90">upcoming</span>
          </p>
        </Link>
        <Link href="/logs" className={`${GLASS_PANEL} block p-4`}>
          <div className={METRIC_CARD_HEADER}>
            <div className={`${ICON_WELL} shrink-0 bg-emerald-400/35`}>
              <svg className="h-5 w-5 text-emerald-50 drop-shadow-[0_1px_3px_rgba(0,0,0,0.75)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.25}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className={METRIC_CARD_CTA}>View All →</span>
          </div>
          <p className="mt-2 text-sm font-medium text-[var(--apple-text-secondary)]">Recent Expenses</p>
          <p className="mt-0.5 text-xl font-bold text-emerald-100 drop-shadow-[0_1px_4px_rgba(0,0,0,0.85)]">
            {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(expenseTotal)}
          </p>
        </Link>
        <Link href="/documents" className={`${GLASS_PANEL} block p-4`}>
          <div className={METRIC_CARD_HEADER}>
            <div className={`${ICON_WELL} shrink-0 bg-amber-200/40`}>
              <svg className="h-5 w-5 text-amber-950 drop-shadow-[0_1px_2px_rgba(255,255,255,0.35)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.25}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <span className={METRIC_CARD_CTA}>View Reports →</span>
          </div>
          <p className="mt-2 text-sm font-medium text-[var(--apple-text-secondary)]">Reports</p>
          <p className="mt-0.5 text-sm font-medium text-[var(--apple-text-primary)]">Documents &amp; folders</p>
        </Link>
      </div>

      {/* Two-column layout: Left = Calendar Preview + Task Assignments, Right = Completion + Crew + Expense Tracking */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2 lg:items-stretch">
        {/* ——— LEFT COLUMN ——— */}
        <div className="flex min-h-0 flex-col gap-6">
          <DashboardCalendarPreview
            days={calendarPreviewDays}
            todayIso={now.toISOString()}
            glass
          />

          {/* Task Assignments */}
          <div className={`${GLASS_PANEL} p-5`}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-bold text-[var(--apple-text-primary)]">
                Task Assignments
              </h2>
              {canAddTask ? (
                <Link href="/tasks" className={DASH_CTA}>
                  <svg className="h-4 w-4 drop-shadow" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                  Add Task
                </Link>
              ) : null}
            </div>
            <div className="mt-4">
              <DashboardSprintPlanning workOrders={workOrders} inline glass />
            </div>
          </div>

          {/* Expense Tracking - flex-1 so bottom aligns with Crew */}
          <div className={`flex min-h-0 flex-1 flex-col ${GLASS_PANEL} p-5`}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-bold text-[var(--apple-text-primary)]">
                Expense Tracking
              </h2>
              <Link href="/logs" className={DASH_CTA}>
                <svg className="h-4 w-4 drop-shadow" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                View expenses
              </Link>
            </div>
            <p className="mt-4 text-2xl font-bold text-emerald-100 drop-shadow-[0_1px_4px_rgba(0,0,0,0.85)]">
              {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(expenseTotal)}
            </p>
            <p className="mt-0.5 text-sm text-[var(--apple-text-secondary)]">total recorded</p>
          </div>
        </div>

        {/* ——— RIGHT COLUMN ——— */}
        <div className="flex min-h-0 flex-col gap-6">
          {/* Completion */}
          <div className={`flex flex-col ${GLASS_PANEL} p-5`}>
            <div className="text-lg font-bold text-[var(--apple-text-primary)]">
              Completion
            </div>

          {/* Range-based completion */}
          <div className="mt-5">
            <div className="text-sm font-medium text-[var(--apple-text-tertiary)]">
              Tasks due in this range
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-semibold text-[var(--apple-text-primary)]">
                {weekCompletionPercent}%
              </span>
              <span className="text-sm text-[var(--apple-text-tertiary)]">
                ({weekCompleted}/{weekTotal})
              </span>
            </div>
            <div className="mt-2.5 h-2.5 w-full overflow-hidden rounded-[999px] border border-[var(--apple-border-muted)] bg-[var(--apple-bg-muted)]">
              <div
                className="h-full rounded-[999px] bg-[var(--apple-accent)]/60 transition-[width] duration-300"
                style={{ width: `${weekCompletionPercent}%` }}
              />
            </div>
          </div>

          {/* Total completion (all tasks assigned to user) */}
          <div className="mt-6">
            <div className="text-sm font-medium text-[var(--apple-text-tertiary)]">
              Total (all your tasks)
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-semibold text-[var(--apple-text-primary)]">
                {totalCompletionPercent}%
              </span>
              <span className="text-sm text-[var(--apple-text-tertiary)]">
                ({totalCompleted}/{totalAssigned})
              </span>
            </div>
            <div className="mt-2.5 h-2.5 w-full overflow-hidden rounded-[999px] border border-[var(--apple-border-muted)] bg-[var(--apple-bg-muted)]">
              <div
                className="h-full rounded-[999px] bg-[var(--apple-accent)] transition-[width] duration-300"
                style={{ width: `${totalCompletionPercent}%` }}
              />
            </div>
          </div>

          <div className="mt-5 flex justify-end">
            <Link
              href="/tasks"
              aria-label="Manage tasks"
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/45 bg-cyan-600/90 text-white shadow-lg shadow-black/40 ring-2 ring-white/30 transition-colors hover:bg-cyan-500 hover:ring-white/50"
            >
              <svg className="h-5 w-5 drop-shadow" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.25}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </Link>
          </div>
        </div>

          {/* Crew - flex-1 so bottom aligns with Task Assignments */}
          <div className={`flex min-h-0 flex-1 flex-col ${GLASS_PANEL} p-5`}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-bold text-[var(--apple-text-primary)]">
                Crew
              </h2>
              <Link href="/crew" className={DASH_CTA}>
                <svg className="h-4 w-4 drop-shadow" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                Manage Crew
              </Link>
            </div>
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {crew.length === 0 ? (
                <p className="col-span-2 py-6 text-center text-sm text-white/80 drop-shadow-[0_1px_2px_rgba(0,0,0,0.55)]">
                  No crew data
                </p>
              ) : (
                crew.slice(0, 4).map((c: any) => (
                  <CrewCard key={c.id} crew={c} showAssignments glass />
                ))
              )}
            </div>
            <Link
              href="/crew"
              className={`mt-auto shrink-0 inline-block pt-3 ${HERO_LINK}`}
            >
              View all crew →
            </Link>
          </div>
        </div>
      </div>

      {/* My Yachts - full width below two columns */}
      <section className="mt-8">
        <MyYachtsWidget yachts={yachts} glass />
      </section>
    </>
  );
}

export default function DashboardPage() {
  return (
    <div>
      <h1 className="text-3xl font-semibold tracking-tight text-white drop-shadow-sm">
        Dashboard
      </h1>
      <p className="mt-2 text-base text-white/75">
        Overview of operations
      </p>

      <div className="mt-8">
        <Suspense fallback={<MetricCardsSkeleton />}>
          <DashboardContent />
        </Suspense>
      </div>
    </div>
  );
}