"use client";

import { useState } from "react";
import { WorkOrderCreateForm } from "./WorkOrderCreateForm";
import { PlusIcon, XIcon } from "@/components/ui/Icons";

type YachtLite = { id: string; name: string };
type UserLite = { id: string; name: string };

export default function WorkOrderCreatePanel({
  yachts,
  users,
}: {
  yachts: YachtLite[];
  users: UserLite[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-[var(--apple-radius)] bg-[var(--apple-accent)] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[var(--apple-accent-hover)]"
      >
        <PlusIcon className="h-4 w-4" />
        Create task
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="new-task-title"
          onClick={(e) => e.target === e.currentTarget && setOpen(false)}
        >
          <div className="relative w-full max-w-lg rounded-[var(--apple-radius-xl)] border border-[var(--apple-border)] bg-[var(--apple-bg-elevated)] shadow-[var(--apple-shadow-lg)]">
            <div className="flex items-start justify-between gap-4 border-b border-[var(--apple-border)] px-6 py-5">
              <div>
                <h2 id="new-task-title" className="text-lg font-semibold text-[var(--apple-text-primary)]">
                  New task
                </h2>
                <p className="mt-1 text-sm text-[var(--apple-text-tertiary)]">Create a task for a yacht</p>
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
            <div className="max-h-[min(70vh,520px)] overflow-y-auto px-6 py-5">
              <WorkOrderCreateForm
                yachts={yachts}
                users={users}
                layout="modal"
                onCancel={() => setOpen(false)}
                onCreated={() => setOpen(false)}
              />
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
