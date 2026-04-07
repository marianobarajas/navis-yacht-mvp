"use client";

import { useEffect, useMemo, useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { Priority } from "@prisma/client";
import { updateWorkOrderDetails } from "@/actions/workOrders";
import { CustomSelect } from "@/components/ui/CustomSelect";
import { PriorityBadge } from "@/components/ui/Badge";
import { CheckIcon, PencilIcon, XIcon } from "@/components/ui/Icons";
import { toDateInputValue, formatDateDDMMYY } from "@/lib/dateUtils";

const PRIORITIES: Priority[] = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];

export default function TaskEditForm({
  workOrder,
  canEdit,
}: {
  workOrder: {
    id: string;
    title: string;
    description: string | null;
    equipmentName: string | null;
    priority: Priority;
    startDate: Date | string | null;
    dueDate: Date | string | null;
  };
  canEdit: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const initial = useMemo(() => {
    return {
      title: workOrder.title ?? "",
      description: workOrder.description ?? "",
      equipmentName: workOrder.equipmentName ?? "",
      priority: workOrder.priority ?? "MEDIUM",
      startDate: toDateInputValue(workOrder.startDate),
      dueDate: toDateInputValue(workOrder.dueDate),
    };
  }, [workOrder]);

  const [title, setTitle] = useState(initial.title);
  const [description, setDescription] = useState(initial.description);
  const [equipmentName, setEquipmentName] = useState(initial.equipmentName);
  const [priority, setPriority] = useState<Priority>(initial.priority);
  const [startDate, setStartDate] = useState(initial.startDate);
  const [dueDate, setDueDate] = useState(initial.dueDate);

  // reset si cambias de task
  useEffect(() => {
    setTitle(initial.title);
    setDescription(initial.description);
    setEquipmentName(initial.equipmentName);
    setPriority(initial.priority as Priority);
    setStartDate(initial.startDate);
    setDueDate(initial.dueDate);
    setError(null);
    setOpen(false);
  }, [initial]);

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!canEdit) return;

    setError(null);

    const fd = new FormData();
    fd.set("title", title);
    fd.set("description", description);
    fd.set("equipmentName", equipmentName);
    fd.set("priority", priority);
    fd.set("startDate", startDate);
    fd.set("dueDate", dueDate);

    startTransition(async () => {
      const res = await updateWorkOrderDetails(workOrder.id, fd);
      if ((res as any)?.error) {
        setError((res as any).error);
        return;
      }
      router.refresh();
      setOpen(false);
    });
  }

  return (
    <div className="overflow-hidden rounded-[var(--apple-radius-lg)] border border-[var(--apple-border)] bg-[var(--apple-bg-elevated)] shadow-[var(--apple-shadow-sm)] transition-shadow hover:shadow-[var(--apple-shadow)]">
      <div className="flex items-center justify-between border-b border-[var(--apple-border)] bg-[var(--apple-bg-subtle)] px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-[var(--apple-radius)] bg-[var(--apple-accent-muted)]">
            <svg className="h-5 w-5 text-[var(--apple-accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <div>
            <div className="text-sm font-semibold text-[var(--apple-text-primary)]">Details</div>
            <div className="text-xs text-[var(--apple-text-tertiary)]">
              Title, dates, priority and notes
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setOpen((p) => !p)}
          disabled={!canEdit}
          aria-label={open ? "Close" : "Edit"}
          title={!canEdit ? "You don't have permission to edit this task." : ""}
          className="flex h-9 w-9 items-center justify-center rounded-[var(--apple-radius)] border border-[var(--apple-accent)] bg-[var(--apple-accent)] text-white transition-colors hover:bg-[var(--apple-accent-hover)] disabled:opacity-50 disabled:hover:bg-[var(--apple-accent)]"
        >
          {open ? <XIcon className="h-4 w-4" /> : <PencilIcon className="h-4 w-4" />}
        </button>
      </div>

      {!open ? (
        <div className="grid gap-4 p-5 sm:grid-cols-2">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-[var(--apple-text-tertiary)]">Title</div>
            <div className="mt-1 text-sm font-medium text-[var(--apple-text-primary)]">{workOrder.title}</div>
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-[var(--apple-text-tertiary)]">Priority</div>
            <div className="mt-1.5">
              <PriorityBadge priority={workOrder.priority} />
            </div>
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-[var(--apple-text-tertiary)]">Start</div>
            <div className="mt-1 text-sm text-[var(--apple-text-secondary)]">{formatDateDDMMYY(workOrder.startDate)}</div>
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-[var(--apple-text-tertiary)]">Due</div>
            <div className="mt-1 text-sm text-[var(--apple-text-secondary)]">{formatDateDDMMYY(workOrder.dueDate)}</div>
          </div>
          <div className="sm:col-span-2">
            <div className="text-xs font-semibold uppercase tracking-wider text-[var(--apple-text-tertiary)]">Equipment</div>
            <div className="mt-1 text-sm text-[var(--apple-text-secondary)]">{workOrder.equipmentName ?? "—"}</div>
          </div>
          {(workOrder.description ?? "").trim() ? (
            <div className="sm:col-span-2">
              <div className="text-xs font-semibold uppercase tracking-wider text-[var(--apple-text-tertiary)]">Notes</div>
              <div className="mt-1 rounded-[var(--apple-radius)] bg-[var(--apple-bg-subtle)] p-3 text-sm text-[var(--apple-text-secondary)]">
                {workOrder.description}
              </div>
            </div>
          ) : null}
        </div>
      ) : (
        <form onSubmit={onSubmit} className="grid gap-4 p-5 sm:grid-cols-2">
          <div className="sm:col-span-2 grid gap-2">
            <label className="text-sm font-medium text-[var(--apple-text-secondary)]">Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              disabled={!canEdit || isPending}
              className="apple-input w-full px-3 py-2 text-sm disabled:opacity-60"
            />
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium text-[var(--apple-text-secondary)]">Priority</label>
            <CustomSelect
              value={priority}
              onChange={(v) => setPriority(v as Priority)}
              disabled={!canEdit || isPending}
              options={PRIORITIES.map((p) => ({ value: p, label: p.replaceAll("_", " ") }))}
            />
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium text-[var(--apple-text-secondary)]">Start date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              disabled={!canEdit || isPending}
              className="apple-input w-full px-3 py-2 text-sm disabled:opacity-60"
            />
            <div className="text-xs text-[var(--apple-text-tertiary)]">
              Leave empty to remove
            </div>
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium text-[var(--apple-text-secondary)]">Due date</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              disabled={!canEdit || isPending}
              className="apple-input w-full px-3 py-2 text-sm disabled:opacity-60"
            />
            <div className="text-xs text-[var(--apple-text-tertiary)]">
              Leave empty to remove
            </div>
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium text-[var(--apple-text-secondary)]">Equipment (optional)</label>
            <input
              value={equipmentName}
              onChange={(e) => setEquipmentName(e.target.value)}
              disabled={!canEdit || isPending}
              className="apple-input w-full px-3 py-2 text-sm disabled:opacity-60"
              placeholder="e.g. Generator, HVAC, Water pump…"
            />
          </div>

          <div className="sm:col-span-2 grid gap-2">
            <label className="text-sm font-medium text-[var(--apple-text-secondary)]">Notes / Comments</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={!canEdit || isPending}
              rows={4}
              className="apple-input w-full px-3 py-2 text-sm disabled:opacity-60"
              placeholder="What needs to be done, context, parts, etc."
            />
          </div>

          {error ? <div className="sm:col-span-2 rounded-[var(--apple-radius)] bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div> : null}

          <div className="sm:col-span-2 flex justify-end">
            <button
              type="submit"
              disabled={!canEdit || isPending}
              aria-label={isPending ? "Saving…" : "Save changes"}
              className="flex h-9 w-9 items-center justify-center rounded-[var(--apple-radius)] border border-[var(--apple-accent)] bg-[var(--apple-accent)] text-white transition-colors hover:bg-[var(--apple-accent-hover)] disabled:opacity-60"
            >
              <CheckIcon className="h-4 w-4" />
            </button>
          </div>
        </form>
      )}
    </div>
  );
}