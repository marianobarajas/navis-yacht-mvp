"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deactivateUser, deleteUserPermanently, reactivateUser } from "@/actions/users";
import { ArrowPathIcon, TrashIcon, UserMinusIcon } from "@/components/ui/Icons";

type BaseProps = {
  userId: string;
  userName?: string;
  actorUserId: string;
  onDone?: () => void;
  compact?: boolean;
};

/** Soft-off: user stays in DB, cannot sign in. */
export function DeactivateUserButton({
  userId,
  userName,
  actorUserId,
  onDone,
  compact,
}: BaseProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (userId === actorUserId) return null;

  const btnClass = compact
    ? "flex h-8 w-8 items-center justify-center rounded-[var(--apple-radius)] border border-amber-200 bg-[var(--apple-bg-elevated)] text-amber-700 transition-colors hover:bg-amber-50 disabled:opacity-60"
    : "rounded-[var(--apple-radius)] border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-900 transition-colors hover:bg-amber-100 disabled:opacity-60";

  return (
    <div className="flex flex-col items-end gap-0.5">
      <button
        type="button"
        disabled={isPending}
        title="Deactivate — keep record, block sign-in"
        onClick={() => {
          setError(null);
          const ok = window.confirm(
            `Deactivate${userName ? ` "${userName}"` : " this user"}? They will stay in the team list but cannot sign in until reactivated.`
          );
          if (!ok) return;
          startTransition(async () => {
            const res = await deactivateUser(userId);
            if (res?.error) {
              setError(res.error);
              return;
            }
            router.refresh();
            onDone?.();
          });
        }}
        className={btnClass}
      >
        {compact ? <UserMinusIcon className="h-4 w-4" /> : "Deactivate"}
      </button>
      {error ? <span className="text-xs text-red-600">{error}</span> : null}
    </div>
  );
}

export function ReactivateUserButton({
  userId,
  userName,
  actorUserId,
  onDone,
  compact,
}: BaseProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (userId === actorUserId) return null;

  const btnClass = compact
    ? "flex h-8 w-8 items-center justify-center rounded-[var(--apple-radius)] border border-emerald-200 bg-[var(--apple-bg-elevated)] text-emerald-700 transition-colors hover:bg-emerald-50 disabled:opacity-60"
    : "rounded-[var(--apple-radius)] border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-900 transition-colors hover:bg-emerald-100 disabled:opacity-60";

  return (
    <div className="flex flex-col items-end gap-0.5">
      <button
        type="button"
        disabled={isPending}
        title="Reactivate — allow sign-in again"
        onClick={() => {
          setError(null);
          startTransition(async () => {
            const res = await reactivateUser(userId);
            if (res?.error) {
              setError(res.error);
              return;
            }
            router.refresh();
            onDone?.();
          });
        }}
        className={btnClass}
      >
        {compact ? <ArrowPathIcon className="h-4 w-4" /> : `Reactivate${userName ? ` ${userName}` : ""}`}
      </button>
      {error ? <span className="text-xs text-red-600">{error}</span> : null}
    </div>
  );
}

/** Remove user from database (after reassigning their authored records to you). */
export function PermanentlyDeleteUserButton({
  userId,
  userName,
  actorUserId,
  onDone,
  compact,
}: BaseProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (userId === actorUserId) return null;

  const btnClass = compact
    ? "flex h-8 w-8 items-center justify-center rounded-[var(--apple-radius)] border border-red-200 bg-[var(--apple-bg-elevated)] text-red-600 transition-colors hover:bg-red-50 disabled:opacity-60"
    : "rounded-[var(--apple-radius)] border border-red-300 bg-red-50 px-3 py-2 text-sm font-medium text-red-800 transition-colors hover:bg-red-100 disabled:opacity-60";

  return (
    <div className="flex flex-col items-end gap-0.5">
      <button
        type="button"
        disabled={isPending}
        title="Permanently delete user from database"
        onClick={() => {
          setError(null);
          const ok = window.confirm(
            `Permanently DELETE${userName ? ` "${userName}"` : " this user"} from the database?\n\nThis cannot be undone. Work orders and documents they created will show you as the creator instead.`
          );
          if (!ok) return;
          const ok2 = window.confirm("Last chance — remove this user forever?");
          if (!ok2) return;
          startTransition(async () => {
            const res = await deleteUserPermanently(userId);
            if (res?.error) {
              setError(res.error);
              return;
            }
            router.refresh();
            onDone?.();
          });
        }}
        className={btnClass}
      >
        {compact ? <TrashIcon className="h-4 w-4" /> : "Delete permanently"}
      </button>
      {error ? <span className="text-xs text-red-600">{error}</span> : null}
    </div>
  );
}
