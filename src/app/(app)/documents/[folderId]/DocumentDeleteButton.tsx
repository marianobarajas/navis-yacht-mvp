"use client";

import { useState, useTransition } from "react";
import { TrashIcon } from "@/components/ui/Icons";
import { useRouter } from "next/navigation";
import { deleteDocument } from "@/actions/documents";

export function DocumentDeleteButton({
  docId,
  folderId,
  title,
}: {
  docId: string;
  folderId: string;
  title?: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  function onDelete() {
    setErr(null);

    const ok = confirm(
      `Delete this document${title ? `: "${title}"` : ""}?\nThis cannot be undone.`
    );
    if (!ok) return;

    startTransition(async () => {
      const res = await deleteDocument(docId, folderId);
      if (res?.error) {
        setErr(res.error);
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
        disabled={isPending}
        aria-label={isPending ? "Deleting…" : "Delete document"}
        className="flex h-8 w-8 items-center justify-center rounded-[var(--apple-radius)] border border-red-200 bg-[var(--apple-bg-elevated)] text-red-600 transition-colors hover:bg-red-50 disabled:opacity-60"
      >
        <TrashIcon className="h-4 w-4" />
      </button>
      {err ? <div className="text-xs text-red-600">{err}</div> : null}
    </div>
  );
}