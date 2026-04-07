"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createDocument } from "@/actions/documents";
import { PlusIcon, XIcon, DocumentIcon, CheckIcon } from "@/components/ui/Icons";

export function DocumentCreatePanel({ folderId }: { folderId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    // ✅ Captura el form ANTES del async
    const form = e.currentTarget;
    const fd = new FormData(form);

    // Asegura folderId aunque no venga en inputs
    fd.set("folderId", folderId);

    startTransition(async () => {
      const res = await createDocument(fd);
      if (res?.error) {
        setError(res.error);
        return;
      }

      // ✅ Ya no dependes del event
      form.reset();
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <div className="mt-6 overflow-hidden rounded-[var(--apple-radius-lg)] border border-[var(--apple-border)] bg-[var(--apple-bg-elevated)] shadow-[var(--apple-shadow-sm)] transition-shadow hover:shadow-[var(--apple-shadow)]">
      <div className="flex items-center justify-between gap-4 border-b border-[var(--apple-border)] bg-[var(--apple-bg-subtle)] px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-[var(--apple-radius)] bg-[var(--apple-accent-muted)]">
            <DocumentIcon className="h-5 w-5 text-[var(--apple-accent)]" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-[var(--apple-text-primary)]">Add document</h2>
            <p className="text-xs text-[var(--apple-text-tertiary)]">Link to a file or URL</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setOpen((p) => !p)}
          aria-label={open ? "Close" : "Add document"}
          className="flex h-10 w-10 items-center justify-center rounded-[var(--apple-radius)] border border-[var(--apple-accent)] bg-[var(--apple-accent)] text-white transition-colors hover:bg-[var(--apple-accent-hover)]"
        >
          {open ? <XIcon className="h-5 w-5" /> : <PlusIcon className="h-5 w-5" />}
        </button>
      </div>

      {open ? (
        <form onSubmit={onSubmit} className="grid gap-4 p-5">
          {/* opcional: hidden input para folderId (igual lo seteamos en fd) */}
          <input type="hidden" name="folderId" value={folderId} />

          <div className="grid gap-2">
            <label className="text-sm font-medium text-[var(--apple-text-secondary)]">Title</label>
            <input
              name="title"
              required
              className="apple-input w-full px-4 py-2.5 text-sm"
              placeholder="e.g. Insurance Policy"
            />
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium text-[var(--apple-text-secondary)]">Description (optional)</label>
            <input
              name="description"
              className="apple-input w-full px-4 py-2.5 text-sm"
              placeholder="Short note…"
            />
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium text-[var(--apple-text-secondary)]">Link (http/https)</label>
            <input
              name="externalUrl"
              required
              className="apple-input w-full px-4 py-2.5 text-sm"
              placeholder="https://..."
            />
          </div>

          {error ? <div className="rounded-[var(--apple-radius)] bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div> : null}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isPending}
              aria-label={isPending ? "Saving…" : "Save"}
              className="flex h-10 w-10 items-center justify-center rounded-[var(--apple-radius)] border border-[var(--apple-accent)] bg-[var(--apple-accent)] text-white transition-colors hover:bg-[var(--apple-accent-hover)] disabled:opacity-60"
            >
              <CheckIcon className="h-5 w-5" />
            </button>
          </div>
        </form>
      ) : null}
    </div>
  );
}