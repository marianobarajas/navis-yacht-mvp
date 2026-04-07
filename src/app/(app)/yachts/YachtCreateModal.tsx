"use client";

import { useState } from "react";
import { YachtCreateForm } from "./YachtCreateForm";
import { PlusIcon, XIcon, BoatIcon } from "@/components/ui/Icons";

export function YachtCreateModal() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-[var(--apple-radius)] bg-[var(--apple-accent)] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[var(--apple-accent-hover)]"
      >
        <PlusIcon className="h-4 w-4" />
        Add yacht
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-yacht-title"
          onClick={(e) => e.target === e.currentTarget && setOpen(false)}
        >
          <div className="relative w-full max-w-lg rounded-[var(--apple-radius-xl)] border border-[var(--apple-border)] bg-[var(--apple-bg-elevated)] shadow-[var(--apple-shadow-lg)]">
            <div className="flex items-start justify-between gap-4 border-b border-[var(--apple-border)] px-6 py-5">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[var(--apple-radius)] bg-[var(--apple-accent-muted)]">
                  <BoatIcon className="h-5 w-5 text-[var(--apple-accent)]" />
                </div>
                <div>
                  <h2 id="add-yacht-title" className="text-lg font-semibold text-[var(--apple-text-primary)]">
                    Add yacht
                  </h2>
                  <p className="mt-1 text-sm text-[var(--apple-text-tertiary)]">Register a new vessel</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--apple-text-primary)] text-white transition-opacity hover:opacity-90"
              >
                <XIcon className="h-5 w-5" />
              </button>
            </div>
            <div className="max-h-[min(70vh,560px)] overflow-y-auto px-6 py-5">
              <YachtCreateForm onSuccess={() => setOpen(false)} />
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
