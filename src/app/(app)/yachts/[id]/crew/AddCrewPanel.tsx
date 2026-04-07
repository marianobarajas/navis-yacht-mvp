"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { assignYachtToUser } from "@/actions/yachts";
import { CustomSelect } from "@/components/ui/CustomSelect";
import { PlusIcon } from "@/components/ui/Icons";

type User = { id: string; name: string; email: string };

export function AddCrewPanel({
  yachtId,
  users,
  assignedUserIds,
}: {
  yachtId: string;
  users: User[];
  assignedUserIds: string[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selectedUserId, setSelectedUserId] = useState("");
  const [error, setError] = useState<string | null>(null);

  const availableUsers = users.filter((u) => !assignedUserIds.includes(u.id));
  const options = availableUsers.map((u) => ({ value: u.id, label: `${u.name} (${u.email})` }));

  function handleAdd() {
    if (!selectedUserId) return;
    setError(null);
    startTransition(async () => {
      const res = await assignYachtToUser(yachtId, selectedUserId);
      if ((res as any)?.error) {
        setError((res as any).error);
        return;
      }
      setSelectedUserId("");
      router.refresh();
    });
  }

  if (availableUsers.length === 0) return null;

  return (
    <div className="rounded-xl border border-[var(--apple-border)] bg-[var(--apple-bg-subtle)]/50 p-5">
      <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-[var(--apple-text-tertiary)]">Add crew member</h3>
      <div className="flex flex-wrap items-end gap-4">
        <div className="min-w-[240px] flex-1">
          <CustomSelect
            value={selectedUserId}
            onChange={setSelectedUserId}
            options={[{ value: "", label: "Select user…" }, ...options]}
            placeholder="Select user…"
          />
        </div>
        <button
          type="button"
          onClick={handleAdd}
          disabled={!selectedUserId || isPending}
          aria-label="Add crew"
          className="flex h-10 items-center gap-2 rounded-xl border border-[var(--apple-accent)] bg-[var(--apple-accent)] px-5 text-sm font-medium text-white transition-colors hover:bg-[var(--apple-accent-hover)] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <PlusIcon className="h-4 w-4" />
          Add
        </button>
      </div>
      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
    </div>
  );
}
