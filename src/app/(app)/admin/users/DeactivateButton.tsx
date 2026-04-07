"use client";

import { useTransition } from "react";
import { deactivateUser } from "@/actions/users";
import { UserMinusIcon } from "@/components/ui/Icons";

export function DeactivateButton({
  userId,
  isActive,
}: {
  userId: string;
  isActive: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  if (!isActive) return null;

  return (
    <button
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          await deactivateUser(userId);
          window.location.reload();
        })
      }
      aria-label={isPending ? "Deactivating…" : "Deactivate user"}
      className="flex h-8 w-8 items-center justify-center rounded-[var(--apple-radius)] border border-amber-200 bg-[var(--apple-bg-elevated)] text-amber-700 transition-colors hover:bg-amber-50 disabled:opacity-60"
    >
      <UserMinusIcon className="h-4 w-4" />
    </button>
  );
}