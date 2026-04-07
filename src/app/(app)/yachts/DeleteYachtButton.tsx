"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteYacht } from "@/actions/yachts";
import { TrashIcon } from "@/components/ui/Icons";

export function DeleteYachtButton({
  yachtId,
  yachtName,
}: {
  yachtId: string;
  yachtName?: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        disabled={isPending}
        onClick={() => {
          setError(null);
          const ok = window.confirm(
            `Delete yacht${yachtName ? ` "${yachtName}"` : ""}? This cannot be undone.`
          );
          if (!ok) return;

          startTransition(async () => {
            const res = await deleteYacht(yachtId);
            if (res?.error) {
              setError(res.error);
              return;
            }
            router.refresh();
          });
        }}
        aria-label={isPending ? "Deleting…" : "Delete yacht"}
        className="flex h-9 w-9 items-center justify-center rounded-[var(--apple-radius)] border border-red-200 bg-[var(--apple-bg-elevated)] text-red-600 transition-colors hover:bg-red-50 disabled:opacity-60"
      >
        <TrashIcon className="h-4 w-4" />
      </button>
      {error ? <span className="text-xs text-red-600">{error}</span> : null}
    </div>
  );
}