"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateDocument } from "@/actions/documents";
import { XIcon, CheckIcon } from "@/components/ui/Icons";

type DocLite = {
  id: string;
  title: string;
  description?: string | null;
  externalUrl?: string | null;
};

function isValidHttpUrl(value: string) {
  try {
    const u = new URL(value);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

export function DocumentEditPanel({
  doc,
  onClose,
}: {
  doc: DocLite | null;
  onClose: () => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const initial = useMemo(() => {
    if (!doc) return null;
    return {
      title: doc.title ?? "",
      description: doc.description ?? "",
      externalUrl: doc.externalUrl ?? "",
    };
  }, [doc]);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [externalUrl, setExternalUrl] = useState("");

  useEffect(() => {
    if (!initial) return;
    setTitle(initial.title);
    setDescription(initial.description);
    setExternalUrl(initial.externalUrl);
    setError(null);
  }, [initial]);

  if (!doc) return null;

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const t = title.trim();
    const u = externalUrl.trim();

    if (!t || !u) {
      setError("Title and URL are required");
      return;
    }
    if (!isValidHttpUrl(u)) {
      setError("URL must start with http(s)://");
      return;
    }

    const fd = new FormData();
    fd.set("title", t);
    fd.set("description", description.trim());
    fd.set("externalUrl", u);

    startTransition(async () => {
      if (!doc) {
        setError("Document not found.");
        return;
      }
      const res = await updateDocument(doc.id, fd);
      if (res?.error) {
        setError(res.error);
        return;
      }
      router.refresh();
      onClose();
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 p-4 sm:items-center">
      <div className="w-full max-w-lg rounded-2xl bg-[var(--apple-bg-elevated)] shadow-lg">
        <div className="flex items-center justify-between border-b border-gray-100 p-4">
          <div>
            <div className="text-sm font-semibold text-[var(--apple-text-primary)]">Edit document</div>
            <div className="text-xs text-gray-500">Update the link details</div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-gray-200 px-3 py-1.5 text-sm"
          >
            Close
          </button>
        </div>

        <form onSubmit={onSubmit} className="grid gap-3 p-4">
          <div className="grid gap-1">
            <label className="text-sm text-gray-600">Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="rounded-xl border border-gray-200 bg-[var(--apple-bg-elevated)] px-3 py-2 text-sm"
            />
          </div>

          <div className="grid gap-1">
            <label className="text-sm text-gray-600">Description (optional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="rounded-xl border border-gray-200 bg-[var(--apple-bg-elevated)] px-3 py-2 text-sm"
            />
          </div>

          <div className="grid gap-1">
            <label className="text-sm text-gray-600">URL</label>
            <input
              value={externalUrl}
              onChange={(e) => setExternalUrl(e.target.value)}
              required
              className="rounded-xl border border-gray-200 bg-[var(--apple-bg-elevated)] px-3 py-2 text-sm"
              placeholder="https://..."
            />
          </div>

          {error ? <div className="text-sm text-red-600">{error}</div> : null}

          <button
            type="submit"
            disabled={isPending}
            aria-label={isPending ? "Saving…" : "Save changes"}
            className="flex h-9 w-9 items-center justify-center rounded-[var(--apple-radius)] border border-[var(--apple-accent)] bg-[var(--apple-accent)] text-white disabled:opacity-60 hover:bg-[var(--apple-accent-hover)]"
          >
            <CheckIcon className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  );
}