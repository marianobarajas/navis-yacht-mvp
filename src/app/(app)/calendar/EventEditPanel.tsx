"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateEvent, deleteEvent } from "@/actions/calendar";
import { CustomSelect } from "@/components/ui/CustomSelect";
import { XIcon, TrashIcon, CheckIcon } from "@/components/ui/Icons";
import { toDateInputValue } from "@/lib/dateUtils";

export type YachtLite = { id: string; name: string };
export type UserLite = { id: string; name: string };

export type CalendarEventUI = {
  id: string;
  title: string;
  startAt: Date;
  endAt: Date | null;
  yachtId: string | null;
  assignedUserId: string | null;

  yacht?: YachtLite | null;
  assignedTo?: UserLite | null;
};

export function EventEditPanel({
  event,
  yachts,
  users,
  onClose,
}: {
  event: CalendarEventUI | null;
  yachts: YachtLite[];
  users: UserLite[];
  onClose: () => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const initial = useMemo(() => {
    if (!event) return null;
    return {
      title: event.title ?? "",
      yachtId: event.yachtId ?? "",
      assignedUserId: event.assignedUserId ?? "",
      startAt: toDateInputValue(event.startAt),
      endAt: toDateInputValue(event.endAt ?? null),
    };
  }, [event]);

  const [title, setTitle] = useState("");
  const [yachtId, setYachtId] = useState("");
  const [assignedUserId, setAssignedUserId] = useState("");
  const [startAt, setStartAt] = useState("");
  const [endAt, setEndAt] = useState("");

  useEffect(() => {
    if (!initial) return;
    setTitle(initial.title);
    setYachtId(initial.yachtId);
    setAssignedUserId(initial.assignedUserId);
    setStartAt(initial.startAt);
    setEndAt(initial.endAt);
    setError(null);
  }, [initial]);

  if (!event) return null;

  // ✅ Capture stable values after the guard so TS stops panicking
  const eventId = event.id;

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const fd = new FormData();
    fd.set("title", title);
    fd.set("yachtId", yachtId);
    fd.set("assignedUserId", assignedUserId);
    fd.set("startAt", startAt);
    fd.set("endAt", endAt);

    startTransition(async () => {
      const res = await updateEvent(eventId, fd);
      if (res?.error) {
        setError(res.error);
        return;
      }
      router.refresh();
      onClose();
    });
  }

  function onDelete() {
    if (!confirm("Delete this event? This cannot be undone.")) return;

    startTransition(async () => {
      const res = await deleteEvent(eventId);
      if (res?.error) {
        setError(res.error);
        return;
      }
      router.refresh();
      onClose();
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm p-4 sm:items-center">
      <div className="w-full max-w-lg rounded-[var(--apple-radius-xl)] border border-[var(--apple-border)] bg-[var(--apple-bg-elevated)] shadow-[var(--apple-shadow-xl)]">
        <div className="flex items-center justify-between border-b border-[var(--apple-border)] px-5 py-4">
          <div>
            <div className="text-base font-semibold text-[var(--apple-text-primary)]">Edit event</div>
            <div className="mt-0.5 text-sm text-[var(--apple-text-tertiary)]">Update details</div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-9 w-9 items-center justify-center rounded-[var(--apple-radius)] border border-[var(--apple-border)] text-[var(--apple-text-secondary)] hover:bg-[var(--apple-bg-subtle)]"
          >
            <XIcon className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="grid gap-4 p-5">
          <div className="grid gap-2">
            <label className="text-sm font-medium text-[var(--apple-text-secondary)]">Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="apple-input w-full px-4 py-2.5 text-sm"
            />
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium text-[var(--apple-text-secondary)]">Yacht</label>
            <CustomSelect
              value={yachtId}
              onChange={(v) => setYachtId(v)}
              placeholder="Unassigned"
              options={[
                { value: "", label: "Unassigned" },
                ...yachts.map((y) => ({ value: y.id, label: y.name })),
              ]}
            />
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium text-[var(--apple-text-secondary)]">Assign to</label>
            <CustomSelect
              value={assignedUserId}
              onChange={(v) => setAssignedUserId(v)}
              placeholder="Unassigned"
              options={[
                { value: "", label: "Unassigned" },
                ...users.map((u) => ({ value: u.id, label: u.name })),
              ]}
            />
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium text-[var(--apple-text-secondary)]">Start date</label>
            <input
              type="date"
              value={startAt}
              onChange={(e) => setStartAt(e.target.value)}
              required
              className="apple-input w-full px-4 py-2.5 text-sm"
            />
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium text-[var(--apple-text-secondary)]">End date (optional)</label>
            <input
              type="date"
              value={endAt}
              onChange={(e) => setEndAt(e.target.value)}
              className="apple-input w-full px-4 py-2.5 text-sm"
            />
          </div>

          {error ? <div className="text-sm text-red-600">{error}</div> : null}

          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onDelete}
              disabled={isPending}
              aria-label="Delete"
              className="flex h-9 w-9 items-center justify-center rounded-[var(--apple-radius)] border border-red-200 bg-[var(--apple-bg-elevated)] text-red-600 hover:bg-red-50 disabled:opacity-60"
            >
              <TrashIcon className="h-4 w-4" />
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