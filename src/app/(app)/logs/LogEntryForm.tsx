"use client";

import { useState, useTransition } from "react";
import { createLogEntry } from "@/actions/logEntries";
import { CustomSelect } from "@/components/ui/CustomSelect";
import { CheckIcon } from "@/components/ui/Icons";

type Yacht = { id: string; name: string };
type User = { id: string; name: string };

export function LogEntryForm({
  yachts,
  crew,
  canCreate,
}: {
  yachts: Yacht[];
  crew: User[];
  canCreate: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  const [yachtId, setYachtId] = useState("");
  const [workOrderId, setWorkOrderId] = useState(""); // optional
  const [entryType, setEntryType] = useState<"STATUS_UPDATE" | "NOTE" | "CHECKLIST" | "PHOTO">(
    "NOTE"
  );
  const [text, setText] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  if (!canCreate) return null;

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setOk(null);

    if (!yachtId) {
      setError("Please select a yacht");
      return;
    }
    if (!text.trim()) {
      setError("Please write a log message");
      return;
    }

    startTransition(async () => {
      try {
        const fd = new FormData();
        fd.set("yachtId", yachtId);
        fd.set("entryType", entryType);
        fd.set("text", text.trim());
        if (workOrderId) fd.set("workOrderId", workOrderId);

        const res = await createLogEntry(fd);
        if (res?.error) throw new Error(res.error);

        setOk("Log entry created");

        // Reset
        setYachtId("");
        setWorkOrderId("");
        setEntryType("NOTE");
        setText("");

        window.location.reload();
      } catch (err: any) {
        setError(err?.message ?? "Failed to create log entry");
      }
    });
  }

  return (
    <div className="rounded-2xl bg-[var(--oceanops-card)] shadow-[var(--oceanops-shadow)] p-4">
      <div className="font-semibold mb-3">New Log Entry</div>

      <form onSubmit={onSubmit} className="grid gap-3">
        <div className="grid gap-1">
          <label className="text-sm text-gray-600">Yacht</label>
          <CustomSelect
            value={yachtId}
            onChange={(v) => setYachtId(v)}
            placeholder="Select a yacht"
            options={[
              { value: "", label: "Select a yacht" },
              ...yachts.map((y) => ({ value: y.id, label: y.name })),
            ]}
          />
        </div>

        <div className="grid gap-1">
          <label className="text-sm text-gray-600">Type</label>
          <CustomSelect
            value={entryType}
            onChange={(v) => setEntryType(v as any)}
            options={[
              { value: "NOTE", label: "NOTE" },
              { value: "STATUS_UPDATE", label: "STATUS_UPDATE" },
              { value: "CHECKLIST", label: "CHECKLIST" },
              { value: "PHOTO", label: "PHOTO" },
            ]}
          />
        </div>

        <div className="grid gap-1">
          <label className="text-sm text-gray-600">Work Order ID (optional)</label>
          <input
            className="apple-input w-full px-3 py-2 text-sm"
            value={workOrderId}
            onChange={(e) => setWorkOrderId(e.target.value)}
            placeholder="Paste a work order id (optional)"
          />
          <p className="text-xs text-gray-500">
            (Later we can replace this with a dropdown of work orders for the selected yacht.)
          </p>
        </div>

        <div className="grid gap-1">
          <label className="text-sm text-gray-600">Message</label>
          <textarea
            className="apple-input w-full px-3 py-2 text-sm"
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={4}
            placeholder="Write the log entry…"
            required
          />
        </div>

        {error ? <div className="text-sm text-red-600">{error}</div> : null}
        {ok ? <div className="text-sm text-green-700">{ok}</div> : null}

        <button
          type="submit"
          disabled={isPending}
          aria-label={isPending ? "Saving…" : "Save log"}
          className="flex h-9 w-9 items-center justify-center rounded-[var(--apple-radius)] border border-[var(--apple-accent)] bg-[var(--apple-accent)] text-white disabled:opacity-60 hover:bg-[var(--apple-accent-hover)]"
        >
          <CheckIcon className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}