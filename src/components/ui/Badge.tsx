import type { Priority, WorkOrderStatus } from "@prisma/client";
import type { Role, ShiftStatus } from "@prisma/client";
import { ROLE_LABELS, SHIFT_STATUS_LABELS } from "@/lib/crew";

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
  ACTIVE:
    "border border-emerald-400/55 bg-emerald-950/65 text-emerald-50 shadow-sm",
  ON_DUTY: "border border-sky-400/60 bg-sky-950/70 text-sky-50 shadow-sm",
  OFF_DUTY: "border border-zinc-500/50 bg-zinc-900/85 text-zinc-100 shadow-sm",
  ON_LEAVE: "border border-amber-500/50 bg-amber-950/70 text-amber-50 shadow-sm",
  ON_ROTATION: "border border-violet-400/50 bg-violet-950/65 text-violet-100 shadow-sm",
  STANDBY: "border border-slate-400/45 bg-slate-900/80 text-slate-100 shadow-sm",
};

const roleBadgeStyles: Record<Role, string> = {
  CAPTAIN:
    "border border-amber-400/60 bg-amber-950/70 text-amber-50 shadow-sm",
  CHIEF_ENGINEER:
    "border border-sky-400/55 bg-sky-950/70 text-sky-50 shadow-sm",
  FIRST_MATE:
    "border border-teal-400/55 bg-teal-950/70 text-teal-50 shadow-sm",
  BOSUN:
    "border border-cyan-400/50 bg-cyan-950/65 text-cyan-50 shadow-sm",
  DECKHAND_1:
    "border border-emerald-400/50 bg-emerald-950/65 text-emerald-50 shadow-sm",
  DECKHAND_2:
    "border border-emerald-300/50 bg-emerald-900/65 text-emerald-50 shadow-sm",
  CHEF:
    "border border-orange-400/55 bg-orange-950/70 text-orange-50 shadow-sm",
  CHIEF_STEWARDESS:
    "border border-violet-400/50 bg-violet-950/65 text-violet-100 shadow-sm",
  STEWARDESS_1:
    "border border-fuchsia-400/50 bg-fuchsia-950/65 text-fuchsia-100 shadow-sm",
  STEWARDESS_2:
    "border border-fuchsia-300/50 bg-fuchsia-900/65 text-fuchsia-100 shadow-sm",
};

const baseBadge =
  "inline-flex items-center rounded-[var(--apple-radius-full)] px-2.5 py-1 text-xs font-semibold tracking-wide";

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
  const label = SHIFT_STATUS_LABELS[status];
  return (
    <span className={`${baseBadge} ${shiftStyles[status]}`}>{label}</span>
  );
}

export function RoleBadge({ role }: { role: Role }) {
  return (
    <span className={`${baseBadge} ${roleBadgeStyles[role]}`}>
      {ROLE_LABELS[role]}
    </span>
  );
}
