"use client";

import { useEffect, useMemo, useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { updateUser } from "@/actions/users";
import { CustomSelect } from "@/components/ui/CustomSelect";
import { PencilIcon, XIcon, CheckIcon } from "@/components/ui/Icons";

type Role = "ADMIN" | "MANAGER" | "TECHNICIAN";
type ShiftStatus = "ON_SHIFT" | "OFF_DUTY" | "UNAVAILABLE";

export type CrewEditUserLite = {
  id: string;
  name: string;
  email: string;
  role: Role;
  shiftStatus: ShiftStatus;
  isActive: boolean;
};

const ROLE_LABELS_ADMIN: { value: Role; label: string }[] = [
  { value: "TECHNICIAN", label: "Crew" },
  { value: "MANAGER", label: "Member" },
  { value: "ADMIN", label: "Admin" },
];

const ROLE_LABELS_MANAGER: { value: Role; label: string }[] = [
  { value: "TECHNICIAN", label: "Crew" },
  { value: "MANAGER", label: "Member" },
];

export function CrewEditModal({
  user,
  open,
  onClose,
  actorRole = "ADMIN",
}: {
  user: CrewEditUserLite;
  open: boolean;
  onClose: () => void;
  /** Who is editing; managers cannot assign Admin. */
  actorRole?: Role;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const initial = useMemo(
    () => ({
      name: user.name ?? "",
      email: user.email ?? "",
      role: user.role ?? "TECHNICIAN",
      shiftStatus: user.shiftStatus ?? "OFF_DUTY",
      isActive: user.isActive ?? true,
    }),
    [user]
  );

  const [name, setName] = useState(initial.name);
  const [email, setEmail] = useState(initial.email);
  const [role, setRole] = useState<Role>(initial.role);
  const [shiftStatus, setShiftStatus] = useState<ShiftStatus>(initial.shiftStatus);
  const [isActive, setIsActive] = useState<boolean>(initial.isActive);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setName(initial.name);
    setEmail(initial.email);
    setRole(initial.role);
    setShiftStatus(initial.shiftStatus);
    setIsActive(initial.isActive);
  }, [open, initial]);

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const fd = new FormData();
    fd.set("name", name);
    fd.set("email", email);
    fd.set("role", role);
    fd.set("shiftStatus", shiftStatus);
    fd.set("isActive", isActive ? "true" : "false");

    startTransition(async () => {
      const res = await updateUser(user.id, fd);
      if (res?.error) {
        setError(res.error);
        return;
      }
      onClose();
      router.refresh();
    });
  }

  const roleOptions = useMemo(() => {
    if (actorRole === "ADMIN") return ROLE_LABELS_ADMIN;
    if (user.role === "ADMIN") return [{ value: "ADMIN" as const, label: "Admin" }];
    return ROLE_LABELS_MANAGER;
  }, [actorRole, user.role]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 p-4 sm:items-center">
      <div className="w-full max-w-lg rounded-2xl bg-[var(--apple-bg-elevated)] shadow-lg">
        <div className="flex items-center justify-between border-b border-gray-100 p-4">
          <div>
            <div className="text-sm font-semibold text-[var(--apple-text-primary)]">Edit crew member</div>
            <div className="text-xs text-gray-500">Update details and save</div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-9 w-9 items-center justify-center rounded-[var(--apple-radius)] border border-[var(--apple-border)] text-[var(--apple-text-secondary)] hover:bg-[var(--apple-bg-subtle)]"
          >
            <XIcon className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="grid gap-3 p-4">
          <div className="grid gap-2">
            <label className="text-sm font-medium text-[var(--apple-text-secondary)]">Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="apple-input w-full px-4 py-2.5 text-sm"
            />
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium text-[var(--apple-text-secondary)]">Email</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              required
              className="apple-input w-full px-4 py-2.5 text-sm"
            />
          </div>

          <div className="grid gap-1">
            <label className="text-sm text-gray-600">Role</label>
            <CustomSelect
              value={role}
              onChange={(v) => setRole(v as Role)}
              options={roleOptions}
            />
          </div>

          <div className="grid gap-1">
            <label className="text-sm text-gray-600">Shift status</label>
            <CustomSelect
              value={shiftStatus}
              onChange={(v) => setShiftStatus(v as ShiftStatus)}
              options={[
                { value: "ON_SHIFT", label: "ON_SHIFT" },
                { value: "OFF_DUTY", label: "OFF_DUTY" },
                { value: "UNAVAILABLE", label: "UNAVAILABLE" },
              ]}
            />
          </div>

          <label className="flex items-center gap-2 text-sm text-[var(--apple-text-primary)]">
            <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
            Active
          </label>

          {error ? <div className="text-sm text-red-600">{error}</div> : null}

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              aria-label="Cancel"
              className="flex h-9 w-9 items-center justify-center rounded-[var(--apple-radius)] border border-[var(--apple-border)] text-[var(--apple-text-secondary)] hover:bg-[var(--apple-bg-subtle)]"
            >
              <XIcon className="h-4 w-4" />
            </button>
            <button
              type="submit"
              disabled={isPending}
              aria-label={isPending ? "Saving…" : "Save"}
              className="flex h-9 w-9 items-center justify-center rounded-[var(--apple-radius)] border border-[var(--apple-accent)] bg-[var(--apple-accent)] text-white hover:bg-[var(--apple-accent-hover)] disabled:opacity-60"
            >
              <CheckIcon className="h-4 w-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function CrewEditButton({ user }: { user: CrewEditUserLite }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Edit crew member"
        className="flex h-8 w-8 items-center justify-center rounded-[var(--apple-radius)] border border-[var(--apple-border)] text-[var(--apple-text-secondary)] transition-colors hover:border-[var(--apple-accent)] hover:bg-[var(--apple-accent-muted)] hover:text-[var(--apple-accent)]"
      >
        <PencilIcon className="h-4 w-4" />
      </button>

      <CrewEditModal user={user} open={open} onClose={() => setOpen(false)} actorRole="ADMIN" />
    </>
  );
}
