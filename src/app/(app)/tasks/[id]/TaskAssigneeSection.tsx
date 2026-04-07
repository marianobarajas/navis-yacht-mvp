"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { assignWorkOrder } from "@/actions/workOrders";
import { CustomSelect } from "@/components/ui/CustomSelect";

type UserLite = { id: string; name: string; profileImage?: string | null };

export function TaskAssigneeSection({
  workOrderId,
  assignedTo,
  crewUsers,
  canAssign,
}: {
  workOrderId: string;
  assignedTo: UserLite | null;
  crewUsers: UserLite[];
  canAssign: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const value = assignedTo?.id ?? "";

  function onChange(userId: string) {
    setError(null);
    startTransition(async () => {
      const res = await assignWorkOrder(workOrderId, userId || null);
      if ((res as { error?: string })?.error) {
        setError((res as { error: string }).error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="rounded-[var(--apple-radius-lg)] border border-[var(--apple-border)] bg-[var(--apple-bg-elevated)] p-4 shadow-[var(--apple-shadow-sm)]">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[var(--apple-border-muted)] bg-[var(--apple-accent-muted)] text-base font-semibold text-[var(--apple-accent)]">
            {assignedTo?.profileImage ? (
              <img src={assignedTo.profileImage} alt="" className="h-full w-full object-cover" />
            ) : assignedTo ? (
              <span aria-hidden>{assignedTo.name.charAt(0).toUpperCase()}</span>
            ) : (
              <svg className="h-6 w-6 text-[var(--apple-text-tertiary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            )}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--apple-text-tertiary)]">Assigned to</p>
            {!canAssign ? (
              <p className="mt-0.5 truncate text-sm font-medium text-[var(--apple-text-primary)]">
                {assignedTo?.name ?? "Unassigned"}
              </p>
            ) : null}
          </div>
        </div>

        {canAssign ? (
          <div className="min-w-0 flex-1 sm:max-w-xs">
            <CustomSelect
              value={value}
              onChange={onChange}
              disabled={isPending}
              placeholder="Unassigned"
              emphasizeValue
              options={[
                { value: "", label: "Unassigned" },
                ...crewUsers.map((u) => ({ value: u.id, label: u.name })),
              ]}
            />
            {error ? <p className="mt-1 text-xs text-red-600">{error}</p> : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
