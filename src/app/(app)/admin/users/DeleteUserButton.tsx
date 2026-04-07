"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deactivateUser } from "@/actions/users";
import { TrashIcon } from "@/components/ui/Icons";

export function DeleteUserButton({
  userId,
  userName,
  isActive,
  canDelete,
  onDeleted,
}: {
  userId: string;
  userName?: string;
  isActive: boolean;
  canDelete: boolean;
  onDeleted?: () => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (!canDelete) return <span className="text-xs text-[var(--apple-text-tertiary)]">—</span>;
  if (!isActive) return <span className="text-xs text-[var(--apple-text-tertiary)]">Inactive</span>;

  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        disabled={isPending}
        onClick={() => {
          setError(null);
          const ok = window.confirm(
            `Deactivate user${userName ? ` "${userName}"` : ""}? They will no longer be able to sign in.`
          );
          if (!ok) return;

          startTransition(async () => {
            const res = await deactivateUser(userId);
            if ((res as any)?.error) {
              setError((res as any).error);
              return;
            }
            router.refresh();
            onDeleted?.();
          });
        }}
        aria-label={isPending ? "Deactivating…" : "Delete (deactivate) user"}
        className="flex h-8 w-8 items-center justify-center rounded-[var(--apple-radius)] border border-red-200 bg-[var(--apple-bg-elevated)] text-red-600 transition-colors hover:bg-red-50 disabled:opacity-60"
      >
        <TrashIcon className="h-4 w-4" />
      </button>
      {error ? <span className="text-xs text-red-600">{error}</span> : null}
    </div>
  );
}
