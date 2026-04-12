"use client";

import { useRouter } from "next/navigation";
import type { Priority, WorkOrderStatus } from "@prisma/client";
import { PriorityBadge } from "@/components/ui/Badge";
import { EditableStatusCell } from "./EditableStatusCell";

type TaskCardProps = {
  wo: {
    id: string;
    title: string;
    priority: Priority;
    status: WorkOrderStatus;
    dueDate: Date | string | null;
    equipmentName?: string | null;
    yacht?: { name: string } | null;
    assignedTo?: { name: string; profileImage?: string | null } | null;
    _count?: { comments: number; attachments: number };
  };
};

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x.getTime();
}

function dueChip(due: Date | string | null): { label: string; className: string } | null {
  if (!due) return null;
  const d = new Date(due);
  if (Number.isNaN(d.getTime())) return null;
  const today = startOfDay(new Date());
  const dueT = startOfDay(d);
  if (dueT < today) {
    return {
      label: "Overdue",
      className: "bg-[var(--ocean-coral-muted)] text-[var(--accent-urgent)]",
    };
  }
  if (dueT === today) {
    return {
      label: "Due today",
      className: "bg-[rgba(246,227,184,0.75)] text-[#6b5420]",
    };
  }
  return {
    label: d.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
    className: "bg-[var(--apple-bg-muted)] text-[var(--apple-text-secondary)]",
  };
}

export function TaskCard({ wo }: TaskCardProps) {
  const router = useRouter();
  const due = dueChip(wo.dueDate);
  const attachments = wo._count?.attachments ?? 0;
  const comments = wo._count?.comments ?? 0;
  const subtitleParts = [wo.yacht?.name, wo.equipmentName].filter(Boolean);

  function goDetail(e: React.SyntheticEvent) {
    const t = e.target as HTMLElement;
    if (t.closest("[data-no-row-nav]")) return;
    router.push(`/tasks/${wo.id}`);
  }

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={goDetail}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          goDetail(e);
        }
      }}
      className="flex cursor-pointer flex-col gap-4 rounded-[var(--apple-radius-lg)] border border-[var(--apple-border)] bg-[var(--apple-bg-elevated)] p-4 shadow-[var(--apple-shadow-sm)] transition-shadow hover:shadow-[var(--apple-shadow)] sm:flex-row sm:items-center sm:gap-5"
    >
      <div className="flex min-w-0 flex-1 items-start gap-3">
        <div
          className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--apple-accent-muted)] text-base font-semibold text-[var(--apple-accent)]"
          title={wo.assignedTo ? `Assigned: ${wo.assignedTo.name}` : "Unassigned"}
        >
          {wo.assignedTo?.profileImage ? (
            <img src={wo.assignedTo.profileImage} alt="" className="h-full w-full object-cover" />
          ) : wo.assignedTo ? (
            <span aria-hidden>{wo.assignedTo.name.charAt(0).toUpperCase()}</span>
          ) : (
            <svg className="h-6 w-6 text-[var(--apple-text-tertiary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-[var(--apple-text-primary)]">{wo.title}</h3>
          <p className="mt-0.5 text-sm font-medium text-[var(--apple-text-secondary)]">
            {wo.assignedTo?.name ?? "Unassigned"}
          </p>
          {subtitleParts.length > 0 ? (
            <p className="mt-0.5 text-sm text-[var(--apple-text-tertiary)]">{subtitleParts.join(" · ")}</p>
          ) : null}
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <PriorityBadge priority={wo.priority} />
            {due ? (
              <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${due.className}`}>
                {due.label}
              </span>
            ) : null}
          </div>
        </div>
      </div>

      <div className="flex shrink-0 flex-wrap items-center justify-end gap-3 sm:flex-nowrap" data-no-row-nav>
        <div data-no-row-nav>
          <EditableStatusCell workOrderId={wo.id} currentStatus={wo.status} size="lg" />
        </div>
        <div className="flex items-center gap-3 text-[var(--apple-text-tertiary)]">
          <span className="flex items-center gap-1 text-xs font-medium" title="Attachments">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
              />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {attachments}
          </span>
          <span className="flex items-center gap-1 text-xs font-medium" title="Comments">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
            {comments}
          </span>
        </div>
      </div>
    </article>
  );
}
