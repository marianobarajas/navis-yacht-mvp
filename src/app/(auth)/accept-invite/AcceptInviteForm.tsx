"use client";

import { useSearchParams } from "next/navigation";
import { useState, type FormEvent, Suspense } from "react";
import { acceptUserInvite } from "@/actions/users";

function FormBody() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  /** Do not use useTransition with async server actions — isPending often never clears. */
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!token) {
      setError("Missing invite token. Open the link from your email.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await acceptUserInvite(token, password);
      if (res?.error) {
        setError(res.error);
        return;
      }
      // Full navigation: reliable after server actions (client router sometimes does not update).
      window.location.assign("/signin?invited=1");
    } catch (err) {
      console.error(err);
      setError("Something went wrong. Try again or open the invite link once more.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4">
      <div className="grid gap-1.5">
        <label className="text-sm font-medium text-[var(--apple-text-secondary)]">New password</label>
        <input
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="apple-input w-full px-4 py-2.5 text-sm"
          required
          minLength={8}
        />
      </div>
      <div className="grid gap-1.5">
        <label className="text-sm font-medium text-[var(--apple-text-secondary)]">Confirm password</label>
        <input
          type="password"
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className="apple-input w-full px-4 py-2.5 text-sm"
          required
          minLength={8}
        />
      </div>
      {error ? <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div> : null}
      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-[var(--apple-radius)] bg-[var(--apple-accent)] py-2.5 text-sm font-semibold text-white hover:bg-[var(--apple-accent-hover)] disabled:opacity-60"
      >
        {submitting ? "Saving…" : "Accept invite"}
      </button>
    </form>
  );
}

export function AcceptInviteForm() {
  return (
    <Suspense fallback={<div className="text-center text-sm text-[var(--apple-text-tertiary)]">Loading…</div>}>
      <FormBody />
    </Suspense>
  );
}
