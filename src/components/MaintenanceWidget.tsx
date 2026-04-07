import Link from "next/link";
import { PriorityBadge } from "@/components/ui/Badge";
import { StatusBadge } from "@/components/ui/Badge";
import { formatDateDDMMYY } from "@/lib/dateUtils";
import type { Priority, WorkOrderStatus } from "@prisma/client";

type Wo = {
  id: string;
  title: string;
  equipmentName: string | null;
  dueDate: Date | null;
  priority: Priority;
  status: WorkOrderStatus;
  yacht: { id: string; name: string };
  assignedTo: { id: string; name: string } | null;
};

export function MaintenanceWidget({ workOrders }: { workOrders: Wo[] }) {
  const withEquipment = workOrders.filter((wo) => wo.equipmentName);
  const list = withEquipment.length > 0 ? withEquipment : workOrders.slice(0, 6);

  if (list.length === 0) {
    return (
      <div className="rounded-[var(--apple-radius)] border border-[var(--apple-border)] bg-[var(--apple-bg-elevated)] p-6 shadow-[var(--apple-shadow-sm)]">
        <h3 className="text-sm font-medium text-[var(--apple-text-secondary)]">
          Equipment maintenance
        </h3>
        <p className="mt-4 text-center text-sm text-[var(--apple-text-tertiary)]">
          No work orders yet
        </p>
        <Link
          href="/tasks"
          className="mt-2 block text-center text-sm font-medium text-[var(--apple-accent)] hover:underline"
        >
          View tasks →
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-[var(--apple-radius)] border border-[var(--apple-border)] bg-[var(--apple-bg-elevated)] p-4 shadow-[var(--apple-shadow-sm)]">
      <h3 className="text-sm font-medium text-[var(--apple-text-secondary)]">
        Equipment maintenance
      </h3>
      <ul className="mt-3 space-y-2">
        {list.map((wo) => (
          <li key={wo.id}>
            <Link
              href={`/tasks/${wo.id}`}
              className="flex items-center gap-3 rounded-[var(--apple-radius)] border border-[var(--apple-border)] p-3 transition-colors hover:bg-[var(--apple-bg-subtle)] hover:border-[var(--apple-border-strong)]"
            >
              <div className="min-w-0 flex-1">
                <p className="font-medium text-[var(--apple-text-primary)]">
                  {wo.equipmentName || wo.title}
                </p>
                <p className="text-xs text-[var(--apple-text-tertiary)]">
                  {wo.yacht.name}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {wo.dueDate && (
                  <span className="text-xs text-[var(--apple-text-tertiary)]">
                    {formatDateDDMMYY(wo.dueDate)}
                  </span>
                )}
                <PriorityBadge priority={wo.priority} />
                <StatusBadge status={wo.status} />
                {wo.assignedTo && (
                  <span
                    className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--apple-accent-muted)] text-xs font-medium text-[var(--apple-accent)]"
                    title={wo.assignedTo.name}
                  >
                    {wo.assignedTo.name.charAt(0)}
                  </span>
                )}
              </div>
            </Link>
          </li>
        ))}
      </ul>
      <Link
        href="/tasks"
        className="mt-3 block text-sm font-medium text-[var(--apple-accent)] hover:underline"
      >
        View all tasks →
      </Link>
    </div>
  );
}
