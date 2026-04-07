"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { renameFolder } from "@/actions/documents";
import { XIcon, CheckIcon } from "@/components/ui/Icons";

type FolderLite = {
  id: string;
  name: string;
};

export function FolderEditPanel({
  folder,
  onClose,
}: {
  folder: FolderLite | null;
  onClose: () => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const initial = useMemo(() => {
    if (!folder) return null;
    return { name: folder.name ?? "" };
  }, [folder]);

  const [name, setName] = useState("");

  useEffect(() => {
    if (!initial) return;
    setName(initial.name);
    setError(null);
  }, [initial]);

  if (!folder) return null;

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const n = name.trim();
    if (!n) {
      setError("Name required");
      return;
    }

    const fd = new FormData();
    fd.set("name", n);

    startTransition(async () => {
      if (!folder) {
        setError("Folder not found");
        return;
      }
      const res = await renameFolder(folder.id, fd);
      if (res?.error) {
        setError(res.error);
        return;
      }
      router.refresh();
      onClose();
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 p-4 sm:items-center">
      <div className="w-full max-w-lg rounded-2xl bg-[var(--apple-bg-elevated)] shadow-lg">
        <div className="flex items-center justify-between border-b border-gray-100 p-4">
          <div>
            <div className="text-sm font-semibold text-[var(--apple-text-primary)]">Edit folder</div>
            <div className="text-xs text-gray-500">Rename the folder</div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-gray-200 px-3 py-1.5 text-sm"
          >
            Close
          </button>
        </div>

        <form onSubmit={onSubmit} className="grid gap-3 p-4">
          <div className="grid gap-1">
            <label className="text-sm text-gray-600">Folder name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="rounded-xl border border-gray-200 bg-[var(--apple-bg-elevated)] px-3 py-2 text-sm"
            />
          </div>

          {error ? <div className="text-sm text-red-600">{error}</div> : null}

          <button
            type="submit"
            disabled={isPending}
            aria-label={isPending ? "Saving…" : "Save changes"}
            className="flex h-9 w-9 items-center justify-center rounded-[var(--apple-radius)] border border-[var(--apple-accent)] bg-[var(--apple-accent)] text-white disabled:opacity-60 hover:bg-[var(--apple-accent-hover)]"
          >
            <CheckIcon className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  );
}