"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { WorkOrderStatus } from "@prisma/client";
import { updateWorkOrderStatus } from "@/actions/workOrders";
import { CustomSelect } from "@/components/ui/CustomSelect";
import { CheckIcon } from "@/components/ui/Icons";

const STATUSES: WorkOrderStatus[] = [
  "OPEN",
  "IN_PROGRESS",
  "WAITING_PARTS",
  "DONE",
  "CLOSED",
];

export default function StatusForm({
  workOrderId,
  currentStatus,
  canUpdate,
}: {
  workOrderId: string;
  currentStatus: WorkOrderStatus;
  canUpdate: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState<WorkOrderStatus>(currentStatus);
  const [error, setError] = useState<string | null>(null);

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!canUpdate) return;
    setError(null);

    startTransition(async () => {
      const res = await updateWorkOrderStatus(workOrderId, status);
      if ((res as any)?.error) {
        setError((res as any).error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="rounded-xl border border-gray-100 bg-[var(--apple-bg-elevated)] p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-medium text-[var(--apple-text-primary)]">Status</div>
          <div className="text-xs text-gray-500">Update work order status</div>
        </div>

        <button
          type="submit"
          disabled={!canUpdate || isPending}
          aria-label={isPending ? "Saving…" : "Save"}
          className="flex h-9 w-9 items-center justify-center rounded-[var(--apple-radius)] border border-[var(--apple-accent)] bg-[var(--apple-accent)] text-white disabled:opacity-60 hover:bg-[var(--apple-accent-hover)]"
        >
          <CheckIcon className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-3 grid gap-1">
        <label className="text-sm text-gray-600">Status</label>
        <CustomSelect
          value={status}
          onChange={(v) => setStatus(v as WorkOrderStatus)}
          disabled={!canUpdate || isPending}
          options={STATUSES.map((s) => ({ value: s, label: s.replaceAll("_", " ") }))}
        />
      </div>

      {error ? <div className="mt-2 text-sm text-red-600">{error}</div> : null}
    </form>
  );
}