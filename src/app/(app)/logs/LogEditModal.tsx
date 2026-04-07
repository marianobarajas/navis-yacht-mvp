"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { updateLogEntry } from "@/actions/logEntries";
import { CustomSelect } from "@/components/ui/CustomSelect";
import { XIcon, CheckIcon } from "@/components/ui/Icons";

const ENTRY_TYPES = ["STATUS_UPDATE", "NOTE", "CHECKLIST", "PHOTO"] as const;

type WorkOrderLite = { id: string; title: string };

type LogLite = {
  id: string;
  entryType: string;
  text: string | null;
  workOrderId: string | null;
};

export default function LogEditModal({
  log,
  workOrders,
  onClose,
}: {
  log: LogLite;
  workOrders: WorkOrderLite[];
  onClose: () => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const fd = new FormData(e.currentTarget);

    startTransition(async () => {
      const res = await updateLogEntry(log.id, fd);
      if ((res as any)?.error) {
        setError((res as any).error);
        return;
      }
      onClose();
      router.refresh();
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-[var(--apple-radius-xl)] border border-[var(--apple-border)] bg-[var(--apple-bg-elevated)] shadow-[var(--apple-shadow-xl)]">
        <div className="flex items-center justify-between border-b border-[var(--apple-border)] px-5 py-4">
          <div className="text-sm font-semibold text-[var(--apple-text-primary)]">Edit log</div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-9 w-9 items-center justify-center rounded-[var(--apple-radius)] border border-[var(--apple-border)] text-[var(--apple-text-secondary)] hover:bg-[var(--apple-bg-subtle)]"
          >
            <XIcon className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="grid gap-4 px-5 py-4">
          <div className="grid gap-2">
            <label className="text-sm font-medium text-[var(--apple-text-secondary)]">Type</label>
            <CustomSelect
              name="entryType"
              defaultValue={log.entryType ?? "NOTE"}
              options={ENTRY_TYPES.map((t) => ({ value: t, label: t.replaceAll("_", " ") }))}
            />
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium text-[var(--apple-text-secondary)]">Task (optional)</label>
            <CustomSelect
              name="workOrderId"
              defaultValue={log.workOrderId ?? ""}
              placeholder="—"
              options={[
                { value: "", label: "—" },
                ...workOrders.map((wo) => ({ value: wo.id, label: wo.title })),
              ]}
            />
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium text-[var(--apple-text-secondary)]">Text</label>
            <textarea
              name="text"
              defaultValue={log.text ?? ""}
              rows={4}
              className="apple-input w-full px-3 py-2 text-sm"
              required
            />
          </div>

          {error ? <div className="rounded-[var(--apple-radius-sm)] bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div> : null}

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              aria-label="Cancel"
              className="flex h-9 w-9 items-center justify-center rounded-[var(--apple-radius)] border border-[var(--apple-border)] text-[var(--apple-text-secondary)] hover:bg-[var(--apple-bg-subtle)]"
            >
              <XIcon className="h-4 w-4" />
            </button>
            <button
              type="submit"
              disabled={isPending}
              aria-label={isPending ? "Saving…" : "Save changes"}
              className="flex h-9 w-9 items-center justify-center rounded-[var(--apple-radius)] border border-[var(--apple-accent)] bg-[var(--apple-accent)] text-white disabled:opacity-60 hover:bg-[var(--apple-accent-hover)]"
            >
              <CheckIcon className="h-4 w-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}