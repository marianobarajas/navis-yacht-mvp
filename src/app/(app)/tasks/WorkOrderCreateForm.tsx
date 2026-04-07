"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createWorkOrder } from "@/actions/workOrders";
import { CustomSelect } from "@/components/ui/CustomSelect";
import { CheckIcon } from "@/components/ui/Icons";

type YachtLite = { id: string; name: string };
type UserLite = { id: string; name: string };

export function WorkOrderCreateForm({
  yachts,
  users,
  onCreated,
  layout = "inline",
  onCancel,
}: {
  yachts: YachtLite[];
  users: UserLite[];
  onCreated?: () => void;
  layout?: "inline" | "modal";
  onCancel?: () => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const form = e.currentTarget;
    const fd = new FormData(form);

    startTransition(async () => {
      const res = await createWorkOrder(fd);

      if ((res as any)?.error) {
        setError((res as any).error);
        return;
      }

      form.reset();
      router.refresh();
      onCreated?.();
    });
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-3">
      <div className="grid gap-1">
        <label className="text-sm text-[var(--apple-text-secondary)]">Title</label>
        <input
          name="title"
          required
          className="apple-input w-full px-3 py-2 text-sm"
          placeholder="e.g. Replace fuel filter"
        />
      </div>

      <div className="grid gap-1">
        <label className="text-sm text-[var(--apple-text-secondary)]">Yacht</label>
        <CustomSelect
          name="yachtId"
          required
          defaultValue=""
          placeholder="Select a yacht…"
          options={[
            { value: "", label: "Select a yacht…" },
            ...yachts.map((y) => ({ value: y.id, label: y.name })),
          ]}
        />
      </div>

      <div className="grid gap-1">
        <label className="text-sm text-[var(--apple-text-secondary)]">Assign to (optional)</label>
        <CustomSelect
          name="assignedToUserId"
          defaultValue=""
          placeholder="Unassigned"
          options={[
            { value: "", label: "Unassigned" },
            ...users.map((u) => ({ value: u.id, label: u.name })),
          ]}
        />
        <p className="text-xs text-[var(--apple-text-tertiary)]">
          Their profile photo appears on the main tasks list when set.
        </p>
      </div>

      <div className="grid gap-1">
        <label className="text-sm text-[var(--apple-text-secondary)]">Priority</label>
        <CustomSelect
          name="priority"
          defaultValue="MEDIUM"
          options={[
            { value: "LOW", label: "LOW" },
            { value: "MEDIUM", label: "MEDIUM" },
            { value: "HIGH", label: "HIGH" },
            { value: "CRITICAL", label: "CRITICAL" },
          ]}
        />
      </div>

      <div className="grid gap-1">
        <label className="text-sm text-[var(--apple-text-secondary)]">Start date (optional)</label>
        <input
          type="date"
          name="startDate"
          className="apple-input w-full px-3 py-2 text-sm"
        />
        <p className="text-xs text-[var(--apple-text-tertiary)]">
          Tasks with dates will appear on the calendar.
        </p>
      </div>

      <div className="grid gap-1">
        <label className="text-sm text-[var(--apple-text-secondary)]">Due date (optional)</label>
        <input
          type="date"
          name="dueDate"
          className="apple-input w-full px-3 py-2 text-sm"
        />
      </div>

      <div className="grid gap-1">
        <label className="text-sm text-[var(--apple-text-secondary)]">Description (optional)</label>
        <textarea
          name="description"
          rows={3}
          className="apple-input w-full px-3 py-2 text-sm"
          placeholder="Extra details…"
        />
      </div>

      {error ? <div className="text-sm text-red-600">{error}</div> : null}

      {layout === "modal" ? (
        <div className="mt-2 flex flex-wrap justify-end gap-3 pt-2">
          {onCancel ? (
            <button
              type="button"
              onClick={onCancel}
              className="rounded-[var(--apple-radius)] border border-[var(--apple-border-strong)] bg-[var(--apple-bg-elevated)] px-5 py-2.5 text-sm font-medium text-[var(--apple-text-secondary)] transition-colors hover:bg-[var(--apple-bg-subtle)]"
            >
              Cancel
            </button>
          ) : null}
          <button
            type="submit"
            disabled={isPending}
            className="inline-flex items-center justify-center gap-2 rounded-[var(--apple-radius)] bg-[var(--apple-accent)] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--apple-accent-hover)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <CheckIcon className="h-4 w-4" />
            {isPending ? "Creating…" : "Create task"}
          </button>
        </div>
      ) : (
        <button
          type="submit"
          disabled={isPending}
          aria-label={isPending ? "Creating…" : "Create work order"}
          className="flex h-9 w-9 items-center justify-center rounded-[var(--apple-radius)] border border-[var(--apple-accent)] bg-[var(--apple-accent)] text-white disabled:opacity-60 hover:bg-[var(--apple-accent-hover)]"
        >
          <CheckIcon className="h-4 w-4" />
        </button>
      )}
    </form>
  );
}