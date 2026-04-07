"use client";

import { useState } from "react";
import { YachtCreateForm } from "./YachtCreateForm";
import { PlusIcon, XIcon, BoatIcon } from "@/components/ui/Icons";

export default function YachtCreatePanel() {
  const [open, setOpen] = useState(false);

  return (
    <div className="mt-6 overflow-hidden rounded-[var(--apple-radius-lg)] border border-[var(--apple-border)] bg-[var(--apple-bg-elevated)] shadow-[var(--apple-shadow-sm)] transition-shadow hover:shadow-[var(--apple-shadow)]">
      <div className="flex items-center justify-between gap-4 border-b border-[var(--apple-border)] bg-[var(--apple-bg-subtle)] px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-[var(--apple-radius)] bg-[var(--apple-accent-muted)]">
            <BoatIcon className="h-5 w-5 text-[var(--apple-accent)]" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-[var(--apple-text-primary)]">Add yacht</h2>
            <p className="text-xs text-[var(--apple-text-tertiary)]">Register a new vessel</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setOpen((p) => !p)}
          aria-label={open ? "Close" : "New yacht"}
          className="flex h-10 w-10 items-center justify-center rounded-[var(--apple-radius)] border border-[var(--apple-accent)] bg-[var(--apple-accent)] text-white transition-colors hover:bg-[var(--apple-accent-hover)]"
        >
          {open ? <XIcon className="h-5 w-5" /> : <PlusIcon className="h-5 w-5" />}
        </button>
      </div>

      {open ? (
        <div className="p-5">
          <YachtCreateForm />
        </div>
      ) : null}
    </div>
  );
}
