"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { assignWorkOrder } from "@/actions/workOrders";
import { CustomSelect } from "@/components/ui/CustomSelect";
import { CheckIcon } from "@/components/ui/Icons";

type UserLite = { id: string; name: string };

export function AssignForm({
  workOrderId,
  users,
  currentAssignedId,
}: {
  workOrderId: string;
  users: UserLite[];
  currentAssignedId: string | null;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [assignedId, setAssignedId] = useState(currentAssignedId ?? "");
  const [error, setError] = useState<string | null>(null);

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      const res = await assignWorkOrder(workOrderId, assignedId || null);
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
          <div className="text-sm font-medium text-[var(--apple-text-primary)]">Assigned</div>
          <div className="text-xs text-gray-500">Assign this work order</div>
        </div>

        <button
          type="submit"
          disabled={isPending}
          aria-label={isPending ? "Saving…" : "Save"}
          className="flex h-9 w-9 items-center justify-center rounded-[var(--apple-radius)] border border-[var(--apple-accent)] bg-[var(--apple-accent)] text-white disabled:opacity-60 hover:bg-[var(--apple-accent-hover)]"
        >
          <CheckIcon className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-3 grid gap-1">
        <label className="text-sm text-gray-600">Assigned to</label>
        <CustomSelect
          value={assignedId}
          onChange={(v) => setAssignedId(v)}
          disabled={isPending}
          placeholder="Unassigned"
          options={[
            { value: "", label: "Unassigned" },
            ...(users ?? []).map((u) => ({ value: u.id, label: u.name })),
          ]}
        />
      </div>

      {error ? <div className="mt-2 text-sm text-red-600">{error}</div> : null}
    </form>
  );
}