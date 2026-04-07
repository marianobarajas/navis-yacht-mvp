"use client";

import { useState } from "react";
import { UserCreateForm } from "./UserCreateForm";
import { PlusIcon, XIcon, UsersIcon } from "@/components/ui/Icons";

export default function UserCreatePanel({ allowAdminRole }: { allowAdminRole: boolean }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="apple-panel transition-shadow hover:shadow-[var(--apple-shadow)]">
      <div className="flex items-center justify-between gap-4 border-b border-[var(--apple-border)] bg-[var(--apple-bg-subtle)] px-6 py-5">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-[var(--apple-radius)] bg-[var(--apple-accent-muted)]">
            <UsersIcon className="h-6 w-6 text-[var(--apple-accent)]" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-[var(--apple-text-primary)]">Add crew member</h2>
            <p className="mt-0.5 text-sm text-[var(--apple-text-tertiary)]">Create a new crew account</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setOpen((p) => !p)}
          aria-label={open ? "Close" : "Add new user"}
          className="flex h-11 w-11 items-center justify-center rounded-[var(--apple-radius)] border border-[var(--apple-accent)] bg-[var(--apple-accent)] text-white transition-colors hover:bg-[var(--apple-accent-hover)]"
        >
          {open ? <XIcon className="h-5 w-5" /> : <PlusIcon className="h-5 w-5" />}
        </button>
      </div>

      {open ? (
        <div className="p-6">
          <UserCreateForm allowAdminRole={allowAdminRole} />
        </div>
      ) : null}
    </div>
  );
}