"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createUser, sendUserInvite } from "@/actions/users";
import { CustomSelect } from "@/components/ui/CustomSelect";
import { ChevronDownIcon, UserPlusIcon } from "@/components/ui/Icons";

type YachtOption = { id: string; name: string };

const ROLE_OPTIONS_CREW_MEMBER = [
  { value: "TECHNICIAN", label: "Crew" },
  { value: "MANAGER", label: "Member" },
] as const;

const ROLE_OPTIONS_ALL = [
  { value: "TECHNICIAN", label: "Crew" },
  { value: "MANAGER", label: "Member" },
  { value: "ADMIN", label: "Admin" },
] as const;

export function CrewAddMemberCard({
  yachts,
  allowAdminRole,
}: {
  yachts: YachtOption[];
  allowAdminRole: boolean;
}) {
  const router = useRouter();

  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  function submitWith(
    fn: (fd: FormData) => Promise<{ error?: string | null; devInviteUrl?: string }>
  ) {
    const form = document.getElementById("crew-create-form") as HTMLFormElement | null;
    if (!form) return;
    const fd = new FormData(form);
    setError(null);
    setOk(null);
    startTransition(async () => {
      const res = await fn(fd);
      if (res?.error) {
        setError(res.error);
        return;
      }
      if (fn === sendUserInvite && res?.devInviteUrl) {
        setOk(
          [
            "Invite created, but no email was sent — RESEND_API_KEY is not set.",
            "Add it to .env (local) or Vercel → Environment Variables (production), from resend.com/api-keys, then send again.",
            `For now, copy this link: ${res.devInviteUrl}`,
          ].join(" ")
        );
      } else {
        setOk(fn === sendUserInvite ? "Invite sent." : "User created.");
      }
      form.reset();
      router.refresh();
    });
  }

  const yachtOptions = [
    { value: "", label: "Select yacht (optional)" },
    ...yachts.map((y) => ({ value: y.id, label: y.name })),
  ];

  const roleOptions = allowAdminRole ? [...ROLE_OPTIONS_ALL] : [...ROLE_OPTIONS_CREW_MEMBER];

  return (
    <div
      id="crew-add"
      className="overflow-hidden rounded-[var(--apple-radius-lg)] border border-[var(--apple-border-muted)] bg-[var(--apple-bg-cream)] shadow-[var(--apple-shadow)]"
    >
      <div
        className={`p-3 ${expanded ? "border-b border-[var(--apple-border-muted)]" : ""}`}
      >
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          aria-expanded={expanded}
          className="flex w-full min-w-0 items-center gap-3 rounded-[var(--apple-radius)] text-left transition-colors hover:bg-black/[0.03]"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--apple-radius)] bg-[var(--apple-accent-muted)]">
            <UserPlusIcon className="h-5 w-5 text-[var(--apple-accent)]" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-sm font-semibold text-[var(--apple-text-primary)] sm:text-base">Add crew member</h2>
            <p className="truncate text-xs text-[var(--apple-text-tertiary)] sm:text-sm">Invite by email or create with a password</p>
          </div>
          <ChevronDownIcon
            className={`h-5 w-5 shrink-0 text-[var(--apple-text-tertiary)] transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
          />
        </button>
      </div>

      {expanded ? (
        <form
          id="crew-create-form"
          className="grid gap-3 p-3 pt-2"
          onSubmit={(e) => e.preventDefault()}
        >
          <div className="grid gap-1.5 sm:grid-cols-2 sm:gap-3">
            <div className="grid gap-1 sm:col-span-2">
              <label className="text-xs font-medium text-[var(--apple-text-secondary)]">Name</label>
              <input name="name" className="apple-input w-full px-3 py-2 text-sm" required />
            </div>
            <div className="grid gap-1">
              <label className="text-xs font-medium text-[var(--apple-text-secondary)]">Email</label>
              <input
                name="email"
                type="email"
                placeholder="example@company.com"
                className="apple-input w-full px-3 py-2 text-sm"
                required
              />
            </div>
            <div className="grid gap-1">
              <label className="text-xs font-medium text-[var(--apple-text-secondary)]">
                Password <span className="font-normal text-[var(--apple-text-tertiary)]">(create only)</span>
              </label>
              <input
                name="password"
                type="password"
                placeholder="Only if using “Create user”"
                className="apple-input w-full px-3 py-2 text-sm"
                autoComplete="new-password"
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="grid gap-1">
              <label className="text-xs font-medium text-[var(--apple-text-secondary)]">Yacht</label>
              <CustomSelect
                name="initialYachtId"
                defaultValue=""
                options={yachtOptions}
                triggerClassName="bg-[var(--apple-bg-elevated)] !h-10 !py-0 text-sm [&_svg]:text-[var(--apple-accent)]"
              />
            </div>
            <div className="grid gap-1">
              <label className="text-xs font-medium text-[var(--apple-text-secondary)]">Role</label>
              <CustomSelect
                name="role"
                defaultValue="TECHNICIAN"
                options={roleOptions}
                triggerClassName="bg-[var(--apple-bg-elevated)] !h-10 !py-0 text-sm"
              />
            </div>
          </div>

          {error ? (
            <div className="rounded-[var(--apple-radius-sm)] bg-red-50 px-2.5 py-1.5 text-xs text-red-600">{error}</div>
          ) : null}
          {ok ? (
            <div className="rounded-[var(--apple-radius-sm)] bg-emerald-50 px-2.5 py-1.5 text-xs text-emerald-700">{ok}</div>
          ) : null}

          <div className="flex flex-wrap items-center gap-2 pt-0.5">
            <button
              type="button"
              disabled={isPending}
              className="rounded-[var(--apple-radius)] bg-[var(--apple-accent)] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[var(--apple-accent-hover)] disabled:opacity-60"
              onClick={() => submitWith(sendUserInvite)}
            >
              {isPending ? "Sending…" : "Send invite"}
            </button>
            <button
              type="button"
              disabled={isPending}
              className="rounded-[var(--apple-radius)] border border-[var(--apple-border)] bg-[var(--apple-bg-warm)] px-4 py-2 text-sm font-medium text-[var(--apple-text-primary)] transition-colors hover:bg-[var(--apple-bg-subtle)] disabled:opacity-60"
              onClick={() => submitWith(createUser)}
            >
              {isPending ? "Creating…" : "Create user with password"}
            </button>
          </div>
          <p className="text-xs text-[var(--apple-text-tertiary)]">
            <strong>Send invite</strong> creates the user and emails them a link to set a password. That requires{" "}
            <code className="rounded bg-black/5 px-1">RESEND_API_KEY</code> in <code className="rounded bg-black/5 px-1">.env</code> or Vercel env (from{" "}
            <span className="whitespace-nowrap">resend.com</span>). Without it, you only get the link on screen to copy manually.
            <strong> Create user</strong> needs a temporary password.
          </p>
        </form>
      ) : null}
    </div>
  );
}
