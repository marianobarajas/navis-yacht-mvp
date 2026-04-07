import type { Priority, WorkOrderStatus } from "@prisma/client";
import type { ShiftStatus } from "@prisma/client";

const priorityStyles: Record<Priority, string> = {
  LOW: "bg-[rgba(196,140,114,0.32)] text-[#8b6048]",
  MEDIUM: "bg-[var(--ocean-teal-muted)] text-[#247a7e]",
  HIGH: "bg-[rgba(246,227,184,0.65)] text-[#5c4a2e]",
  CRITICAL: "bg-[var(--ocean-coral-muted)] text-[var(--accent-urgent)]",
};

const statusStyles: Record<WorkOrderStatus, string> = {
  OPEN: "bg-[var(--apple-bg-muted)] text-[var(--apple-text-secondary)]",
  IN_PROGRESS: "bg-[var(--apple-accent-muted)] text-[var(--apple-accent)]",
  WAITING_PARTS: "bg-[rgba(246,227,184,0.55)] text-[#7a5f20]",
  DONE: "bg-[var(--ocean-success-muted)] text-[#2d7a55]",
  CLOSED: "bg-[var(--apple-bg-subtle)] text-[var(--apple-text-tertiary)]",
};

const shiftStyles: Record<ShiftStatus, string> = {
  ON_SHIFT: "bg-[var(--apple-accent-muted)] text-[var(--apple-accent)]",
  OFF_DUTY: "bg-[var(--apple-bg-muted)] text-[var(--apple-text-secondary)]",
  UNAVAILABLE: "bg-[var(--ocean-coral-muted)] text-[var(--accent-urgent)]",
};

const baseBadge =
  "inline-flex items-center rounded-[var(--apple-radius-full)] px-2.5 py-0.5 text-xs font-medium";

export function PriorityBadge({ priority }: { priority: Priority }) {
  return (
    <span className={`${baseBadge} ${priorityStyles[priority]}`}>
      {priority.replace("_", " ")}
    </span>
  );
}

export function StatusBadge({ status }: { status: WorkOrderStatus }) {
  return (
    <span className={`${baseBadge} ${statusStyles[status]}`}>
      {status.replace("_", " ")}
    </span>
  );
}

export function ShiftBadge({ status }: { status: ShiftStatus }) {
  const label =
    status === "ON_SHIFT"
      ? "On Shift"
      : status === "OFF_DUTY"
        ? "Off Duty"
        : "Unavailable";
  return (
    <span className={`${baseBadge} ${shiftStyles[status]}`}>{label}</span>
  );
}

const roleStyles: Record<string, string> = {
  ADMIN: "bg-[var(--apple-accent-muted)] text-[var(--apple-accent)]",
  MANAGER: "bg-[var(--ocean-teal-muted)] text-[#247a7e]",
  TECHNICIAN: "bg-[var(--ocean-success-muted)] text-[#2d7a55]",
};

export function RoleBadge({ role }: { role: string }) {
  return (
    <span className={`${baseBadge} ${roleStyles[role] ?? "bg-[var(--apple-bg-subtle)] text-[var(--apple-text-secondary)]"}`}>
      {role}
    </span>
  );
}
