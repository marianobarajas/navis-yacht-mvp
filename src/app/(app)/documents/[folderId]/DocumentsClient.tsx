"use client";

import { useState } from "react";
import { formatDateDDMMYY } from "@/lib/dateUtils";
import { DocumentEditPanel } from "./DocumentEditPanel";
import { DocumentDeleteButton } from "./DocumentDeleteButton";
import { accentStripByIndex } from "@/lib/uiAccent";
import { PencilIcon, ExternalLinkIcon } from "@/components/ui/Icons";

type DocLite = {
  id: string;
  title: string;
  description?: string | null;
  externalUrl?: string | null;
  createdAt: string | Date;
  createdBy?: { name: string } | null;
};

export function DocumentsClient({
  docs,
  folderId,
}: {
  docs: DocLite[];
  folderId: string;
}) {
  const [selected, setSelected] = useState<DocLite | null>(null);

  return (
    <>
      <div className="divide-y divide-gray-100">
        {docs.map((d) => (
          <div key={d.id} className="flex items-start justify-between gap-4 p-4">
            <div className="min-w-0">
              <div className="font-medium text-[var(--apple-text-primary)] truncate">{d.title}</div>

              {d.description ? (
                <div className="text-sm text-[var(--apple-text-tertiary)]">{d.description}</div>
              ) : null}

              <div className="mt-1 text-xs text-[var(--apple-text-tertiary)]">
                Added by {d.createdBy?.name ?? "Unknown"} ·{" "}
                {formatDateDDMMYY(d.createdAt)}
              </div>

              {d.externalUrl ? (
                <a
                  href={d.externalUrl}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Open link"
                  className="mt-2 inline-flex h-8 w-8 items-center justify-center rounded-[var(--apple-radius)] border border-[var(--apple-border)] text-[var(--apple-accent)] transition-colors hover:bg-[var(--apple-accent-muted)]"
                >
                  <ExternalLinkIcon className="h-4 w-4" />
                </a>
              ) : null}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSelected(d)}
                aria-label="Edit"
                className="flex h-8 w-8 items-center justify-center rounded-[var(--apple-radius)] border border-[var(--apple-border)] text-[var(--apple-text-secondary)] transition-colors hover:border-[var(--apple-accent)] hover:bg-[var(--apple-accent-muted)] hover:text-[var(--apple-accent)]"
              >
                <PencilIcon className="h-4 w-4" />
              </button>

              <DocumentDeleteButton docId={d.id} folderId={folderId} title={d.title} />
            </div>
          </div>
        ))}
      </div>

      <DocumentEditPanel doc={selected} onClose={() => setSelected(null)} />
    </>
  );
}