"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { unassignYachtFromUser } from "@/actions/yachts";
import { XIcon } from "@/components/ui/Icons";

export function RemoveCrewButton({
  yachtId,
  userId,
  userName,
}: {
  yachtId: string;
  userId: string;
  userName: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() => {
        if (!window.confirm(`Remove ${userName} from this yacht?`)) return;
        startTransition(async () => {
          await unassignYachtFromUser(yachtId, userId);
          router.refresh();
        });
      }}
      aria-label={`Remove ${userName}`}
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[var(--apple-text-tertiary)] transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-60"
    >
      <XIcon className="h-4 w-4" />
    </button>
  );
}
