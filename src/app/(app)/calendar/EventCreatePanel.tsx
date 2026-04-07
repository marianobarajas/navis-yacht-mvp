"use client";

import { useState } from "react";
import { EventCreateForm } from "./EventCreateForm";
import { PlusIcon, XIcon, CalendarIcon } from "@/components/ui/Icons";

type YachtLite = { id: string; name: string };
type UserLite = { id: string; name: string };

export function EventCreatePanel({
  yachts,
  users,
  canCreate,
}: {
  yachts: YachtLite[];
  users: UserLite[];
  canCreate: boolean;
}) {
  const [open, setOpen] = useState(false);

  // Si no puede crear, no muestres el panel (o cámbialo a modo “read-only” si quieres).
  if (!canCreate) return null;

  return (
    <div className="mt-6 rounded-[var(--apple-radius-lg)] border border-[var(--apple-border)] bg-[var(--apple-bg-elevated)] p-4 shadow-[var(--apple-shadow-sm)] overflow-visible">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--apple-accent-muted)] text-[var(--apple-accent)]">
            <CalendarIcon className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-[var(--apple-text-primary)]">Create event</h2>
            <p className="mt-0.5 text-xs text-[var(--apple-text-tertiary)]">Add an event to a yacht schedule</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          aria-label={open ? "Close" : "Add event"}
          className="flex h-9 w-9 items-center justify-center rounded-[var(--apple-radius)] border border-[var(--apple-accent)] bg-[var(--apple-accent)] text-white transition-colors hover:bg-[var(--apple-accent-hover)]"
        >
          {open ? <XIcon className="h-4 w-4" /> : <PlusIcon className="h-4 w-4" />}
        </button>
      </div>

      {open ? (
        <div className="mt-4 border-t border-[var(--apple-border)] pt-4">
          <EventCreateForm yachts={yachts} users={users} onCreated={() => setOpen(false)} />
        </div>
      ) : null}
    </div>
  );
}