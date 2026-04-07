"use client";

import { useState, useTransition, type FormEvent } from "react";
import { PencilIcon, XIcon, CheckIcon } from "@/components/ui/Icons";
import { useRouter } from "next/navigation";
import { renameFolder } from "@/actions/documents";

export function FolderEditButton({
  folderId,
  currentName,
}: {
  folderId: string;
  currentName: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(currentName);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const fd = new FormData();
    fd.set("name", name);

    startTransition(async () => {
      const res = await renameFolder(folderId, fd);
      if (res?.error) {
        setError(res.error);
        return;
      }
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setName(currentName);
          setError(null);
          setOpen(true);
        }}
        aria-label="Edit folder"
        className="flex h-8 w-8 items-center justify-center rounded-[var(--apple-radius)] border border-[var(--apple-border)] text-[var(--apple-text-secondary)] transition-colors hover:border-[var(--apple-accent)] hover:bg-[var(--apple-accent-muted)] hover:text-[var(--apple-accent)]"
      >
        <PencilIcon className="h-4 w-4" />
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 p-4 sm:items-center">
          <div className="w-full max-w-md rounded-2xl bg-[var(--apple-bg-elevated)] shadow-lg">
            <div className="flex items-center justify-between border-b border-gray-100 p-4">
              <div>
                <div className="text-sm font-semibold text-[var(--apple-text-primary)]">Rename folder</div>
                <div className="text-xs text-gray-500">Update the folder name</div>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="flex h-9 w-9 items-center justify-center rounded-[var(--apple-radius)] border border-[var(--apple-border)] text-[var(--apple-text-secondary)] hover:bg-[var(--apple-bg-subtle)]"
              >
                <XIcon className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={onSubmit} className="grid gap-4 p-5" onClick={(e) => e.stopPropagation()}>
              <div className="grid gap-2">
                <label className="text-sm font-medium text-[var(--apple-text-secondary)]">Folder name</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="apple-input w-full px-4 py-2.5 text-sm"
                />
              </div>

              {error ? <div className="rounded-[var(--apple-radius)] bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div> : null}

              <div className="flex justify-end">
              <button
                type="submit"
                disabled={isPending}
                aria-label={isPending ? "Saving…" : "Save"}
                className="flex h-9 w-9 items-center justify-center rounded-[var(--apple-radius)] border border-[var(--apple-accent)] bg-[var(--apple-accent)] text-white disabled:opacity-60 hover:bg-[var(--apple-accent-hover)]"
              >
                <CheckIcon className="h-4 w-4" />
              </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}