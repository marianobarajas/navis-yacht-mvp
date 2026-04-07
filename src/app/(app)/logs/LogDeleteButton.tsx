"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteLogEntry } from "@/actions/logEntries";

export default function LogDeleteButton({
  logId,
  label = "Delete",
  confirmText = "Delete this log? This cannot be undone.",
}: {
  logId: string;
  label?: string;
  confirmText?: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onClick() {
    setError(null);
    if (!confirm(confirmText)) return;

    startTransition(async () => {
      const res = await deleteLogEntry(logId);
      if (res?.error) {
        setError(res.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={onClick}
        disabled={isPending}
        className="rounded-[var(--apple-radius)] border border-red-200 bg-[var(--apple-bg-elevated)] px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-60"
      >
        {isPending ? "Deleting…" : label}
      </button>

      {error ? <div className="text-xs text-red-600">{error}</div> : null}
    </div>
  );
}