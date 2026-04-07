import Link from "next/link";
import { StatusBadge } from "@/components/ui/Badge";
import { PriorityBadge } from "@/components/ui/Badge";
import type { Priority, WorkOrderStatus } from "@prisma/client";
import { priorityBorderLeftClass } from "@/lib/uiAccent";

type Wo = {
  id: string;
  title: string;
  status: WorkOrderStatus;
  yacht: { id: string; name: string };
  priority: Priority | string;
  dueDate?: Date | string | null;
};

const PRIORITY_ORDER: Record<Priority, number> = {
  CRITICAL: 0,
  HIGH: 1,
  MEDIUM: 2,
  LOW: 3,
};

const columns: {
  status: WorkOrderStatus[];
  title: string;
  statusGroup?: string;
  dotClass: string;
}[] = [
  {
    title: "To Do",
    status: ["OPEN"],
    statusGroup: "todo",
    dotClass: "bg-[var(--palette-slate)]",
  },
  {
    title: "In Progress",
    status: ["IN_PROGRESS", "WAITING_PARTS"],
    statusGroup: "in_progress",
    dotClass: "bg-[var(--palette-muted-teal)]",
  },
  {
    title: "Done",
    status: ["DONE", "CLOSED"],
    statusGroup: "done",
    dotClass: "bg-[var(--palette-success-dark)]",
  },
];

function sortByPriorityAndDue(items: Wo[]): Wo[] {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  return [...items].sort((a, b) => {
    const pa = PRIORITY_ORDER[(a.priority as Priority) ?? "LOW"];
    const pb = PRIORITY_ORDER[(b.priority as Priority) ?? "LOW"];
    if (pa !== pb) return pa - pb;

    const da = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
    const db = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
    return da - db;
  });
}

export function KanbanPreview({ workOrders, glass }: { workOrders: Wo[]; glass?: boolean }) {
  const colShell = glass
    ? "rounded-[var(--apple-radius)] border border-white/15 bg-white/5 p-4 shadow-md backdrop-blur-md transition-all duration-300 hover:border-white/30 hover:bg-white/[0.08]"
    : "rounded-[var(--apple-radius)] border border-[var(--apple-border)] bg-[var(--apple-bg-elevated)] p-4 shadow-[var(--apple-shadow-sm)]";

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      {columns.map((col) => {
        const items = sortByPriorityAndDue(
          workOrders.filter((wo) => col.status.includes(wo.status))
        );
        const visible = items.slice(0, 2);
        const hasMore = items.length > 2;
        const viewAllHref = col.statusGroup ? `/tasks?statusGroup=${col.statusGroup}` : "/tasks";

        return (
          <div key={col.title} className={colShell}>
            <h3 className="flex items-center gap-2 text-sm font-medium text-[var(--apple-text-secondary)]">
              <span className={`h-2 w-2 shrink-0 rounded-full ${col.dotClass}`} aria-hidden />
              {col.title}
            </h3>
            <ul className="mt-3 space-y-2">
              {items.length === 0 ? (
                <li
                  className={`rounded-[var(--apple-radius)] border border-dashed py-6 text-center text-sm text-[var(--apple-text-tertiary)] ${
                    glass ? "border-white/25" : "border-[var(--apple-border-strong)]"
                  }`}
                >
                  No items
                </li>
              ) : (
                visible.map((wo) => (
                  <li key={wo.id}>
                    <Link
                      href={`/tasks/${wo.id}`}
                      className={
                        glass
                          ? `block overflow-hidden rounded-[var(--apple-radius)] border border-white/12 border-l-4 bg-white/5 p-3 text-sm backdrop-blur-sm transition-colors hover:bg-white/12 hover:border-white/25 ${priorityBorderLeftClass(wo.priority)}`
                          : `block overflow-hidden rounded-[var(--apple-radius)] border border-[var(--apple-border)] border-l-4 p-3 text-sm transition-colors hover:bg-[var(--apple-bg-subtle)] hover:border-[var(--apple-border-strong)] ${priorityBorderLeftClass(wo.priority)}`
                      }
                    >
                      <span className="font-medium text-[var(--apple-text-primary)]">
                        {wo.title}
                      </span>
                      <span className="ml-1 text-[var(--apple-text-tertiary)]">
                        · {wo.yacht.name}
                      </span>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <PriorityBadge priority={wo.priority as Priority} />
                        <StatusBadge status={wo.status} />
                      </div>
                    </Link>
                  </li>
                ))
              )}
            </ul>
            {hasMore && (
              <div className="mt-2 flex justify-end">
                <Link
                  href={viewAllHref}
                  className="text-sm font-medium text-[var(--apple-accent)] hover:underline"
                >
                  View all ({items.length})
                </Link>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
