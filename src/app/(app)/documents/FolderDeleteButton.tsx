"use client";

import { useState, useTransition } from "react";
import { TrashIcon } from "@/components/ui/Icons";
import { useRouter } from "next/navigation";
import { deleteFolder } from "@/actions/documents";

export function FolderDeleteButton({
  folderId,
  folderName,
  disabled,
}: {
  folderId: string;
  folderName: string;
  disabled?: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onDelete(e: React.MouseEvent) {
    // importante: si el card es Link, esto evita que navegue
    e.preventDefault();
    e.stopPropagation();

    setError(null);

    const ok = confirm(`Delete folder "${folderName}"?\nThis will delete all documents inside.`);
    if (!ok) return;

    startTransition(async () => {
      const res = await deleteFolder(folderId);
      if (res?.error) {
        setError(res.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={onDelete}
        disabled={disabled || isPending}
        aria-label={isPending ? "Deleting…" : "Delete folder"}
        className="flex h-8 w-8 items-center justify-center rounded-[var(--apple-radius)] border border-red-200 bg-[var(--apple-bg-elevated)] text-red-600 transition-colors hover:bg-red-50 disabled:opacity-60"
      >
        <TrashIcon className="h-4 w-4" />
      </button>

      {error ? <div className="text-xs text-red-600">{error}</div> : null}
    </div>
  );
}