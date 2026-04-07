"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { createTenantFromPlatform } from "@/actions/platform";

export function PlatformNewTenantForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage(null);
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await createTenantFromPlatform(fd);
      if (res.error) {
        setMessage({ type: "err", text: res.error });
        return;
      }
      e.currentTarget.reset();
      setMessage({ type: "ok", text: `Organization created. Slug: ${res.slug}. The admin can sign in at /signin.` });
      router.refresh();
    });
  }

  return (
    <form
      onSubmit={onSubmit}
      className="mt-4 space-y-4 rounded-[var(--apple-radius-lg)] border border-[var(--apple-border)] bg-[var(--apple-bg-elevated)] p-6 shadow-[var(--apple-shadow-sm)]"
    >
      <h2 className="text-lg font-semibold text-[var(--apple-text-primary)]">Add organization</h2>
      <p className="text-sm text-[var(--apple-text-tertiary)]">
        Creates a new tenant and their first ADMIN (same rules as <code className="text-xs">npm run provision-org</code>).
      </p>

      {message ? (
        <p
          className={
            message.type === "ok"
              ? "text-sm text-[#0f766e]"
              : "text-sm text-red-600"
          }
        >
          {message.text}
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block sm:col-span-2">
          <span className="mb-1 block text-xs font-medium text-[var(--apple-text-secondary)]">Company name</span>
          <input
            name="companyName"
            required
            className="w-full rounded-[var(--apple-radius)] border border-[var(--apple-border)] bg-white px-3 py-2 text-sm"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-[var(--apple-text-secondary)]">First admin email</span>
          <input
            name="adminEmail"
            type="email"
            required
            className="w-full rounded-[var(--apple-radius)] border border-[var(--apple-border)] bg-white px-3 py-2 text-sm"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-[var(--apple-text-secondary)]">First admin name</span>
          <input
            name="adminName"
            required
            className="w-full rounded-[var(--apple-radius)] border border-[var(--apple-border)] bg-white px-3 py-2 text-sm"
          />
        </label>
        <label className="block sm:col-span-2">
          <span className="mb-1 block text-xs font-medium text-[var(--apple-text-secondary)]">
            First admin password (min 8 characters)
          </span>
          <input
            name="adminPassword"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            className="w-full rounded-[var(--apple-radius)] border border-[var(--apple-border)] bg-white px-3 py-2 text-sm"
          />
        </label>
        <label className="block sm:col-span-2">
          <span className="mb-1 block text-xs font-medium text-[var(--apple-text-secondary)]">
            Slug (optional — auto-generated if empty)
          </span>
          <input
            name="slug"
            className="w-full rounded-[var(--apple-radius)] border border-[var(--apple-border)] bg-white px-3 py-2 text-sm"
            placeholder="e.g. blue-fleet"
          />
        </label>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="rounded-[var(--apple-radius)] bg-[var(--apple-accent)] px-4 py-2.5 text-sm font-semibold text-white transition-opacity disabled:opacity-50"
      >
        {pending ? "Creating…" : "Create organization"}
      </button>
    </form>
  );
}
