"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { deleteWorkOrder } from "@/actions/workOrders";
import { TrashIcon } from "@/components/ui/Icons";

export default function TaskDeleteButton({
  workOrderId,
  label = "Delete",
  confirmText,
  redirectTo,
}: {
  workOrderId: string;
  label?: string;
  confirmText?: string;
  redirectTo?: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onClick() {
    const ok = window.confirm(confirmText ?? "Delete this task? This cannot be undone.");
    if (!ok) return;

    setError(null);

    startTransition(async () => {
      const res = await deleteWorkOrder(workOrderId);
      if (res?.error) {
        setError(res.error);
        return;
      }

      if (redirectTo) {
        router.push(redirectTo);
      } else {
        router.refresh();
      }
    });
  }

  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={onClick}
        disabled={isPending}
        aria-label={isPending ? "Deleting…" : label}
        className="flex h-10 w-10 items-center justify-center rounded-[var(--apple-radius)] border border-red-200 bg-[var(--apple-bg-elevated)] text-red-600 transition-colors hover:bg-red-50 disabled:opacity-60"
      >
        <TrashIcon className="h-5 w-5" />
      </button>
      {error ? <span className="text-xs text-red-600">{error}</span> : null}
    </div>
  );
}