"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createFolder } from "@/actions/documents";
import { CustomSelect } from "@/components/ui/CustomSelect";
import { PlusIcon, XIcon, FolderIcon, CheckIcon } from "@/components/ui/Icons";

type YachtLite = { id: string; name: string };

export default function FolderCreatePanel({ yachts }: { yachts: YachtLite[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const form = e.currentTarget;
    const fd = new FormData(form);

    startTransition(async () => {
      const res = await createFolder(fd);
      if (res?.error) {
        setError(res.error);
        return;
      }

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
            <FolderIcon className="h-5 w-5 text-[var(--apple-accent)]" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-[var(--apple-text-primary)]">New folder</h2>
            <p className="text-xs text-[var(--apple-text-tertiary)]">Global or per yacht</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setOpen((p) => !p)}
          aria-label={open ? "Close" : "New folder"}
          className="flex h-10 w-10 items-center justify-center rounded-[var(--apple-radius)] border border-[var(--apple-accent)] bg-[var(--apple-accent)] text-white transition-colors hover:bg-[var(--apple-accent-hover)]"
        >
          {open ? <XIcon className="h-5 w-5" /> : <PlusIcon className="h-5 w-5" />}
        </button>
      </div>

      {open ? (
        <form onSubmit={onSubmit} className="grid gap-4 p-5">
          <div className="grid gap-2">
            <label className="text-sm font-medium text-[var(--apple-text-secondary)]">Folder name</label>
            <input
              name="name"
              required
              className="apple-input w-full px-4 py-2.5 text-sm"
              placeholder="e.g. Safety Certificates"
            />
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium text-[var(--apple-text-secondary)]">Scope</label>
            <CustomSelect
              name="yachtId"
              defaultValue=""
              placeholder="Global (all yachts)"
              options={[
                { value: "", label: "Global (all yachts)" },
                ...yachts.map((y) => ({ value: y.id, label: y.name })),
              ]}
            />
          </div>

          {error ? <div className="rounded-[var(--apple-radius)] bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div> : null}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isPending}
              className="flex h-10 w-10 items-center justify-center rounded-[var(--apple-radius)] border border-[var(--apple-accent)] bg-[var(--apple-accent)] text-white transition-colors hover:bg-[var(--apple-accent-hover)] disabled:opacity-60"
              aria-label={isPending ? "Creating…" : "Create folder"}
            >
              <CheckIcon className="h-5 w-5" />
            </button>
          </div>
        </form>
      ) : null}
    </div>
  );
}