"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createYacht } from "@/actions/yachts";
import { CheckIcon } from "@/components/ui/Icons";

export function YachtCreateForm({ onSuccess }: { onSuccess?: () => void }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const form = e.currentTarget;
    const formData = new FormData(form);

    startTransition(async () => {
      const res = await createYacht(formData);
      if (res?.error) {
        setError(res.error);
        return;
      }
      form.reset();
      router.refresh();
      onSuccess?.();
    });
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-3" encType="multipart/form-data">
      <input type="hidden" name="yachtStatus" value="ACTIVE" />
      <div className="grid gap-1">
        <label className="text-sm text-gray-600">Yacht name</label>
        <input
          name="name"
          required
          className="rounded-xl border border-gray-200 bg-[var(--apple-bg-elevated)] px-3 py-2 text-sm"
          placeholder="e.g. M/Y Aurora"
        />
      </div>

      <div className="grid gap-1">
        <label className="text-sm text-gray-600">Registration #</label>
        <input
          name="registrationNumber"
          required
          className="rounded-xl border border-gray-200 bg-[var(--apple-bg-elevated)] px-3 py-2 text-sm"
          placeholder="e.g. ABC-1234"
        />
      </div>

      <div className="grid gap-1">
        <label className="text-sm text-gray-600">Model</label>
        <input
          name="model"
          required
          className="rounded-xl border border-gray-200 bg-[var(--apple-bg-elevated)] px-3 py-2 text-sm"
          placeholder="e.g. Azimut 78"
        />
      </div>

      <div className="grid gap-1">
        <label className="text-sm text-gray-600">Year</label>
        <input
          name="year"
          type="number"
          min={1900}
          max={2100}
          required
          className="rounded-xl border border-gray-200 bg-[var(--apple-bg-elevated)] px-3 py-2 text-sm"
          placeholder="e.g. 2020"
        />
      </div>

      <div className="grid gap-1">
        <label className="text-sm text-gray-600">Owner name</label>
        <input
          name="ownerName"
          required
          className="rounded-xl border border-gray-200 bg-[var(--apple-bg-elevated)] px-3 py-2 text-sm"
          placeholder="e.g. John Doe"
        />
      </div>

      <div className="grid gap-1">
        <label className="text-sm text-gray-600">Marina</label>
        <input
          name="marina"
          required
          className="rounded-xl border border-gray-200 bg-[var(--apple-bg-elevated)] px-3 py-2 text-sm"
          placeholder="e.g. Marina Vallarta"
        />
      </div>

      <div className="grid gap-1">
        <label className="text-sm text-[var(--apple-text-secondary)]">Cover photo (optional)</label>
        <input
          name="coverImage"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="text-sm text-[var(--apple-text-secondary)] file:mr-3 file:rounded-[var(--apple-radius-sm)] file:border-0 file:bg-[var(--apple-accent-muted)] file:px-3 file:py-2 file:text-sm file:font-medium file:text-[var(--apple-accent)]"
        />
        <p className="text-xs text-[var(--apple-text-tertiary)]">JPEG, PNG, or WebP · max 5MB · leave empty for a blank card header</p>
      </div>

      {error ? <div className="text-sm text-red-600">{error}</div> : null}

      <button
        type="submit"
        disabled={isPending}
        aria-label={isPending ? "Creating…" : "Create yacht"}
        className="flex h-9 w-9 items-center justify-center rounded-[var(--apple-radius)] border border-[var(--apple-accent)] bg-[var(--apple-accent)] text-white disabled:opacity-60 hover:bg-[var(--apple-accent-hover)]"
      >
        <CheckIcon className="h-4 w-4" />
      </button>
    </form>
  );
}