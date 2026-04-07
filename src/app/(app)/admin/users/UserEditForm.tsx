"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateUser } from "@/actions/users";
import { CheckIcon, XIcon } from "@/components/ui/Icons";
import { CustomSelect } from "@/components/ui/CustomSelect";

type UserForEdit = {
  id: string;
  name: string;
  email: string;
  role: string;
  shiftStatus?: string;
  isActive: boolean;
};

export function UserEditForm({ user, actorRole, onClose, compact }: { user: UserForEdit; actorRole: string; onClose: () => void; compact?: boolean }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const gap = compact ? "gap-1.5" : "gap-4";
  const labelClass = compact ? "text-[10px] font-medium" : "text-sm font-medium";
  const inputClass = compact ? "apple-input h-8 w-full px-2 py-1 text-xs" : "apple-input w-full px-3 py-2 text-sm";
  const roleShiftStatusClass =
    "border-[var(--apple-accent)]/50 bg-[var(--apple-bg-subtle)]/80 font-medium shadow-sm hover:border-[var(--apple-accent)] focus:ring-2 focus:ring-[var(--apple-accent-muted)]";

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const res = await updateUser(user.id, formData);
      if ((res as any)?.error) {
        setError((res as any).error);
        return;
      }
      router.refresh();
      onClose();
    });
  }

  const roleOptions =
    actorRole === "ADMIN"
      ? [{ value: "ADMIN", label: "ADMIN" }, { value: "MANAGER", label: "MANAGER" }, { value: "TECHNICIAN", label: "TECHNICIAN" }]
      : [{ value: "MANAGER", label: "MANAGER" }, { value: "TECHNICIAN", label: "TECHNICIAN" }];

  return (
    <form onSubmit={onSubmit} className={compact ? `grid grid-cols-2 gap-x-3 gap-y-1.5` : `grid ${gap}`}>
      {compact ? (
        <>
          <div className="col-span-2 grid gap-0.5">
            <label className={`${labelClass} text-[var(--apple-text-secondary)]`}>Name</label>
            <input name="name" required defaultValue={user.name} className={inputClass} placeholder="Full name" />
          </div>
          <div className="col-span-2 grid gap-0.5">
            <label className={`${labelClass} text-[var(--apple-text-secondary)]`}>Email</label>
            <input name="email" type="email" required defaultValue={user.email} className={inputClass} placeholder="email@example.com" />
          </div>
          <div className="grid gap-0.5">
            <label className={`${labelClass} font-semibold text-[var(--apple-text-primary)]`}>Role</label>
            <CustomSelect name="role" defaultValue={user.role} options={roleOptions} triggerClassName={roleShiftStatusClass} emphasizeValue />
          </div>
          <div className="grid gap-0.5">
            <label className={`${labelClass} font-semibold text-[var(--apple-text-primary)]`}>Shift status</label>
            <CustomSelect name="shiftStatus" defaultValue={user.shiftStatus ?? "OFF_DUTY"} options={[{ value: "OFF_DUTY", label: "Off duty" }, { value: "ON_SHIFT", label: "On shift" }, { value: "UNAVAILABLE", label: "Unavailable" }]} triggerClassName={roleShiftStatusClass} emphasizeValue />
          </div>
          {error ? <div className="col-span-2 rounded-[var(--apple-radius-sm)] bg-red-50 px-2 py-1.5 text-xs text-red-600">{error}</div> : null}
          <div className="grid gap-0.5">
            <label className={`${labelClass} font-semibold text-[var(--apple-text-primary)]`}>Active</label>
            <CustomSelect name="isActive" defaultValue={user.isActive ? "true" : "false"} options={[{ value: "true", label: "Yes" }, { value: "false", label: "No" }]} triggerClassName={roleShiftStatusClass} emphasizeValue />
          </div>
        </>
      ) : (
        <>
          <div className="grid gap-1">
            <label className={`${labelClass} text-[var(--apple-text-secondary)]`}>Name</label>
            <input name="name" required defaultValue={user.name} className={inputClass} placeholder="Full name" />
          </div>
          <div className="grid gap-1">
            <label className={`${labelClass} text-[var(--apple-text-secondary)]`}>Email</label>
            <input name="email" type="email" required defaultValue={user.email} className={inputClass} placeholder="email@example.com" />
          </div>
          <div className="grid gap-1">
            <label className={`${labelClass} font-semibold text-[var(--apple-text-primary)]`}>Role</label>
            <CustomSelect name="role" defaultValue={user.role} options={roleOptions} triggerClassName={roleShiftStatusClass} emphasizeValue />
          </div>
          <div className="grid gap-1">
            <label className={`${labelClass} font-semibold text-[var(--apple-text-primary)]`}>Shift status</label>
            <CustomSelect name="shiftStatus" defaultValue={user.shiftStatus ?? "OFF_DUTY"} options={[{ value: "OFF_DUTY", label: "Off duty" }, { value: "ON_SHIFT", label: "On shift" }, { value: "UNAVAILABLE", label: "Unavailable" }]} triggerClassName={roleShiftStatusClass} emphasizeValue />
          </div>
          <div className="grid gap-1">
            <label className={`${labelClass} font-semibold text-[var(--apple-text-primary)]`}>Active</label>
            <CustomSelect name="isActive" defaultValue={user.isActive ? "true" : "false"} options={[{ value: "true", label: "Yes" }, { value: "false", label: "No" }]} triggerClassName={roleShiftStatusClass} emphasizeValue />
          </div>
        </>
      )}

      {!compact && error ? <div className="rounded-[var(--apple-radius-sm)] bg-red-50 px-2 py-1.5 text-sm text-red-600">{error}</div> : null}

      <div className={`flex shrink-0 items-center gap-2 ${compact ? "col-span-1 col-start-2 justify-end pt-0.5" : "justify-end pt-2"}`}>
        <button
          type="button"
          onClick={onClose}
          aria-label="Cancel"
          className={`flex items-center gap-1.5 rounded-[var(--apple-radius)] border border-[var(--apple-border)] font-medium text-[var(--apple-text-secondary)] transition-colors hover:bg-[var(--apple-bg-subtle)] ${compact ? "px-2.5 py-1 text-xs" : "px-4 py-2 text-sm"}`}
        >
          <XIcon className={compact ? "h-3.5 w-3.5" : "h-4 w-4"} />
          Cancel
        </button>
        <button
          type="submit"
          disabled={isPending}
          aria-label={isPending ? "Saving…" : "Save"}
          className={`flex items-center gap-1.5 rounded-[var(--apple-radius)] border border-[var(--apple-accent)] bg-[var(--apple-accent)] font-medium text-white transition-colors hover:bg-[var(--apple-accent-hover)] disabled:opacity-60 ${compact ? "px-2.5 py-1 text-xs" : "px-4 py-2 text-sm"}`}
        >
          <CheckIcon className={compact ? "h-3.5 w-3.5" : "h-4 w-4"} />
          {isPending ? "Saving…" : "Save"}
        </button>
      </div>
    </form>
  );
}
