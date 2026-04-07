"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createLogEntry } from "@/actions/logEntries";
import { CustomSelect } from "@/components/ui/CustomSelect";
import { PlusIcon, XIcon, CheckIcon } from "@/components/ui/Icons";

type YachtLite = { id: string; name: string };
type WorkOrderLite = { id: string; title: string };

const TYPES = ["NOTE", "STATUS_UPDATE", "CHECKLIST", "PHOTO"] as const;

export default function LogCreatePanel({
  yachts,
  workOrders,
}: {
  yachts: YachtLite[];
  workOrders: WorkOrderLite[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const form = e.currentTarget;
    const fd = new FormData(form);

    startTransition(async () => {
      const res = await createLogEntry(fd);
      if (res?.error) {
        setError(res.error);
        return;
      }

      form.reset();
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <div className="mt-6 rounded-[var(--apple-radius)] border border-[var(--apple-border)] bg-[var(--apple-bg-elevated)] shadow-[var(--apple-shadow-sm)]">
      <div className="flex items-center justify-between gap-3 p-4">
        <div>
          <h2 className="text-sm font-medium text-[var(--apple-text-secondary)]">Logs</h2>
          <p className="text-xs text-[var(--apple-text-tertiary)]">Create a new log entry</p>
        </div>

        <button
          type="button"
          onClick={() => setOpen((p) => !p)}
          aria-label={open ? "Close" : "New log"}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--apple-radius)] border border-[var(--apple-accent)] bg-[var(--apple-accent)] text-white transition-colors hover:bg-[var(--apple-accent-hover)]"
        >
          {open ? <XIcon className="h-4 w-4" /> : <PlusIcon className="h-4 w-4" />}
        </button>
      </div>

      {open ? (
        <form onSubmit={onSubmit} className="grid gap-3 border-t border-[var(--apple-border)] p-4">
          <div className="grid gap-2">
            <label className="text-sm font-medium text-[var(--apple-text-secondary)]">Yacht</label>
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

          <div className="grid gap-2">
            <label className="text-sm font-medium text-[var(--apple-text-secondary)]">Type</label>
            <CustomSelect
              name="entryType"
              defaultValue="NOTE"
              options={TYPES.map((t) => ({ value: t, label: t.replaceAll("_", " ") }))}
            />
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium text-[var(--apple-text-secondary)]">Related task (optional)</label>
            <CustomSelect
              name="workOrderId"
              defaultValue=""
              placeholder="None"
              options={[
                { value: "", label: "None" },
                ...workOrders.map((wo) => ({ value: wo.id, label: wo.title })),
              ]}
            />
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium text-[var(--apple-text-secondary)]">Text</label>
            <textarea
              name="text"
              required
              rows={4}
              className="apple-input w-full px-3 py-2 text-sm"
              placeholder="What happened?"
            />
          </div>

          {error ? <div className="rounded-[var(--apple-radius-sm)] bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div> : null}

          <button
            type="submit"
            disabled={isPending}
            aria-label={isPending ? "Saving…" : "Create log"}
            className="flex h-9 w-9 items-center justify-center rounded-[var(--apple-radius)] border border-[var(--apple-accent)] bg-[var(--apple-accent)] text-white disabled:opacity-60 hover:bg-[var(--apple-accent-hover)]"
          >
            <CheckIcon className="h-4 w-4" />
          </button>
        </form>
      ) : null}
    </div>
  );
}