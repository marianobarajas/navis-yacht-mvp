"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createUser } from "@/actions/users";
import { CustomSelect } from "@/components/ui/CustomSelect";
import { CheckIcon } from "@/components/ui/Icons";

const ROLE_OPTIONS_CREW_MEMBER = [
  { value: "TECHNICIAN", label: "Crew" },
  { value: "MANAGER", label: "Member" },
];

const ROLE_OPTIONS_ALL = [
  { value: "TECHNICIAN", label: "Crew" },
  { value: "MANAGER", label: "Member" },
  { value: "ADMIN", label: "Admin" },
];

export function UserCreateForm({ allowAdminRole }: { allowAdminRole: boolean }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setOk(null);

    const form = e.currentTarget;
    const fd = new FormData(form);

    startTransition(async () => {
      const res = await createUser(fd);

      if ((res as any)?.error) {
        setError((res as any).error);
        return;
      }

      setOk("User created");
      form.reset();
      router.refresh(); // mejor que window.location.reload()
    });
  }

  return (
    <div className="rounded-[var(--apple-radius-lg)] border border-[var(--apple-border)] bg-[var(--apple-bg-elevated)] p-4 shadow-[var(--apple-shadow-sm)]">
      <form onSubmit={onSubmit} className="grid gap-4">
        <div className="grid gap-2">
          <label className="text-sm font-medium text-[var(--apple-text-secondary)]">Name</label>
          <input
            name="name"
            className="apple-input w-full px-3 py-2 text-sm"
            required
          />
        </div>

        <div className="grid gap-2">
          <label className="text-sm font-medium text-[var(--apple-text-secondary)]">Email</label>
          <input
            name="email"
            className="apple-input w-full px-3 py-2 text-sm"
            placeholder="example@company.com"
            type="email"
            required
          />
        </div>

        <div className="grid gap-2">
          <label className="text-sm font-medium text-[var(--apple-text-secondary)]">Role</label>
          <CustomSelect
            name="role"
            defaultValue="TECHNICIAN"
            options={allowAdminRole ? ROLE_OPTIONS_ALL : ROLE_OPTIONS_CREW_MEMBER}
          />
          {!allowAdminRole ? (
            <p className="text-xs text-[var(--apple-text-tertiary)]">
              Only admins can create Admin accounts.
            </p>
          ) : null}
        </div>

        <div className="grid gap-2">
          <label className="text-sm font-medium text-[var(--apple-text-secondary)]">Temporary Password</label>
          <input
            name="password"
            className="apple-input w-full px-3 py-2 text-sm"
            placeholder="Set a temporary password"
            type="password"
            required
          />
        </div>

        {error ? <div className="rounded-[var(--apple-radius-sm)] bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div> : null}
        {ok ? <div className="rounded-[var(--apple-radius-sm)] bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{ok}</div> : null}

        <button
          type="submit"
          disabled={isPending}
          aria-label={isPending ? "Creating…" : "Create user"}
          className="flex h-9 w-9 items-center justify-center rounded-[var(--apple-radius)] border border-[var(--apple-accent)] bg-[var(--apple-accent)] text-white disabled:opacity-60 hover:bg-[var(--apple-accent-hover)]"
        >
          <CheckIcon className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}