"use client";

import { useState } from "react";
import { PencilIcon } from "@/components/ui/Icons";
import { XIcon } from "@/components/ui/Icons";
import { YachtEditForm } from "./YachtEditForm";

type YachtForEdit = {
  id: string;
  name: string;
  registrationNumber: string;
  model: string;
  year: number;
  ownerName: string;
  marina: string;
  yachtStatus?: string;
  maintenanceHealth?: string | null;
  coverImageUrl?: string | null;
  assignmentCount?: number;
};

export function YachtEditPanel({
  yacht,
  variant = "icon",
}: {
  yacht: YachtForEdit;
  variant?: "icon" | "button";
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {variant === "icon" ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Edit yacht"
          className="flex h-9 w-9 items-center justify-center rounded-[var(--apple-radius)] border border-[var(--apple-border)] text-[var(--apple-text-secondary)] transition-colors hover:border-[var(--apple-accent)] hover:bg-[var(--apple-accent-muted)] hover:text-[var(--apple-accent)]"
        >
          <PencilIcon className="h-4 w-4" />
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-2 rounded-[var(--apple-radius)] border border-[var(--apple-accent)] bg-[var(--apple-accent-muted)] px-4 py-2 text-sm font-medium text-[var(--apple-accent)] transition-colors hover:bg-[var(--apple-accent-muted-hover)]"
        >
          <PencilIcon className="h-4 w-4" />
          Edit yacht
        </button>
      )}

      {open && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <div
            className="relative flex max-h-[min(92vh,820px)] w-full max-w-2xl flex-col overflow-hidden rounded-[var(--apple-radius-xl)] border border-[var(--apple-border)] bg-[var(--apple-bg-elevated)] shadow-[var(--apple-shadow-xl)]"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-yacht-title"
          >
            <div className="flex shrink-0 items-start justify-between gap-4 border-b border-[var(--apple-border)] px-6 py-5">
              <div>
                <h2 id="edit-yacht-title" className="text-lg font-semibold text-[var(--apple-text-primary)]">
                  Edit yacht
                </h2>
                <p className="mt-1 text-sm text-[var(--apple-text-tertiary)]">{yacht.name}</p>
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
            <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-6 py-5">
              <YachtEditForm yacht={yacht} onClose={() => setOpen(false)} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
