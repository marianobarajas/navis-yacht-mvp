"use client";

import { useMemo, useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createEvent } from "@/actions/calendar";
import { CustomSelect } from "@/components/ui/CustomSelect";
import { CheckIcon, XIcon } from "@/components/ui/Icons";

type YachtLite = { id: string; name: string };
type UserLite = { id: string; name: string };

export function EventCreateForm({
  yachts,
  users,
  onCreated,
}: {
  yachts: YachtLite[];
  users: UserLite[];
  onCreated?: () => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [title, setTitle] = useState("");
  const [yachtId, setYachtId] = useState<string>("");
  const [assignedUserId, setAssignedUserId] = useState<string>("");
  const [startAt, setStartAt] = useState<string>("");
  const [endAt, setEndAt] = useState<string>("");
  const [notes, setNotes] = useState<string>("");

  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  const yachtOptions = useMemo(() => (Array.isArray(yachts) ? yachts : []), [yachts]);
  const userOptions = useMemo(() => (Array.isArray(users) ? users : []), [users]);

  function validate(): string | null {
    if (!title.trim()) return "Title is required.";
    if (!startAt.trim()) return "Start date is required.";

    const s = new Date(`${startAt}T12:00:00`);
    if (Number.isNaN(s.getTime())) return "Start date is invalid.";

    if (endAt.trim()) {
      const e = new Date(`${endAt}T12:00:00`);
      if (Number.isNaN(e.getTime())) return "End date is invalid.";
      if (e < s) return "End must be after Start.";
    }

    return null;
  }

  function resetForm() {
    setTitle("");
    setYachtId("");
    setAssignedUserId("");
    setStartAt("");
    setEndAt("");
    setNotes("");
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setOk(null);

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    const fd = new FormData();
    fd.set("title", title.trim());
    fd.set("yachtId", yachtId);                 // ✅ siempre
    fd.set("assignedUserId", assignedUserId);   // ✅ siempre (ojo con el nombre en tu action)
    fd.set("startAt", startAt.trim());
    fd.set("endAt", endAt.trim() || startAt.trim());
    fd.set("notes", notes.trim());

    startTransition(async () => {
      const res = await createEvent(fd);

      if (res?.error) {
        setError(res.error);
        return;
      }

      setOk("Event created.");
      resetForm();
      onCreated?.();
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="mt-4 grid gap-3 overflow-visible" style={{ minHeight: 220 }}>
      <div className="grid gap-1">
        <label className="text-sm text-[var(--apple-text-secondary)]">Title</label>
        <input
          name="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          className="apple-input w-full px-3 py-2 text-sm"
          placeholder="e.g. Inspection / Marina visit"
        />
      </div>

      <div className="grid gap-1">
        <label className="text-sm text-[var(--apple-text-secondary)]">Yacht (optional)</label>
        <CustomSelect
          name="yachtId"
          value={yachtId}
          onChange={(v) => setYachtId(v)}
          placeholder="Unassigned"
          options={[
            { value: "", label: "Unassigned" },
            ...yachtOptions.map((y) => ({ value: y.id, label: y.name })),
          ]}
        />
      </div>

      <div className="grid gap-1">
        <label className="text-sm text-[var(--apple-text-secondary)]">Assign to (optional)</label>
        <CustomSelect
          name="assignedUserId"
          value={assignedUserId}
          onChange={(v) => setAssignedUserId(v)}
          placeholder="Unassigned"
          options={[
            { value: "", label: "Unassigned" },
            ...userOptions.map((u) => ({ value: u.id, label: u.name })),
          ]}
        />
      </div>

      <div className="grid gap-1">
        <label className="text-sm text-[var(--apple-text-secondary)]">Start date</label>
        <input
          name="startAt"
          type="date"
          value={startAt}
          onChange={(e) => setStartAt(e.target.value)}
          required
          className="apple-input w-full px-3 py-2 text-sm"
        />
      </div>

      <div className="grid gap-1">
        <label className="text-sm text-[var(--apple-text-secondary)]">End date (optional)</label>
        <input
          name="endAt"
          type="date"
          value={endAt}
          onChange={(e) => setEndAt(e.target.value)}
          className="apple-input w-full px-3 py-2 text-sm"
        />
      </div>

      <div className="grid gap-1">
        <label className="text-sm text-[var(--apple-text-secondary)]">Notes (optional)</label>
        <textarea
          name="notes"
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="apple-input w-full px-3 py-2 text-sm"
          placeholder="Extra details…"
        />
      </div>

      {error ? <div className="text-sm text-red-600">{error}</div> : null}
      {ok ? <div className="text-sm text-green-700">{ok}</div> : null}

      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={isPending}
          aria-label={isPending ? "Creating…" : "Create event"}
          className="flex h-9 w-9 items-center justify-center rounded-[var(--apple-radius)] border border-[var(--apple-accent)] bg-[var(--apple-accent)] text-white disabled:opacity-60 hover:bg-[var(--apple-accent-hover)]"
        >
          <CheckIcon className="h-4 w-4" />
        </button>

        <button
          type="button"
          disabled={isPending}
          onClick={() => {
            setError(null);
            setOk(null);
            resetForm();
          }}
          aria-label="Clear"
          className="flex h-9 w-9 items-center justify-center rounded-[var(--apple-radius)] border border-[var(--apple-border)] text-[var(--apple-text-secondary)] hover:bg-[var(--apple-bg-subtle)] disabled:opacity-60"
        >
          <XIcon className="h-4 w-4" />
        </button>
      </div>
    </form>
  );
}