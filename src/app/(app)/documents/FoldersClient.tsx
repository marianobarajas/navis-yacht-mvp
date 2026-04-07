"use client";

import { useState } from "react";
import Link from "next/link";
import { FolderEditPanel } from "./FolderEditPanel";
import { FolderDeleteButton } from "./FolderDeleteButton";
import { accentStripByIndex } from "@/lib/uiAccent";

type FolderLite = {
  id: string;
  name: string;
  yacht?: { id: string; name: string } | null;
  _count?: { documents: number } | null;
};

export function FoldersClient({
  folders,
  canManage,
}: {
  folders: FolderLite[];
  canManage: boolean;
}) {
  const [selected, setSelected] = useState<FolderLite | null>(null);

  return (
    <>
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {folders.length === 0 ? (
          <div className="col-span-full rounded-[var(--apple-radius)] border border-[var(--apple-border)] bg-[var(--apple-bg-elevated)] p-8 text-center text-[var(--apple-text-secondary)]">
            No folders yet
          </div>
        ) : (
          folders.map((f, i) => (
            <div
              key={f.id}
              className={`overflow-hidden rounded-[var(--apple-radius)] border border-[var(--apple-border)] border-l-4 bg-[var(--apple-bg-elevated)] p-4 shadow-[var(--apple-shadow-sm)] ${accentStripByIndex(i)}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <Link href={`/documents/${f.id}`} className="block hover:underline">
                    <h3 className="truncate font-semibold text-[var(--apple-text-primary)]">{f.name}</h3>
                  </Link>
                  <p className="text-xs text-[var(--apple-text-tertiary)]">
                    {f.yacht?.name ? `Yacht: ${f.yacht.name}` : "Global"}
                  </p>
                </div>

                <span className="rounded-[var(--apple-radius-full)] bg-[var(--apple-bg-subtle)] px-2.5 py-1 text-xs font-medium text-[var(--apple-text-secondary)]">
                  {f._count?.documents ?? 0}
                </span>
              </div>

              {canManage ? (
                <div className="mt-3 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setSelected(f)}
                    className="rounded-[var(--apple-radius)] border border-[var(--apple-border-strong)] bg-[var(--apple-bg-elevated)] px-3 py-2 text-sm font-medium text-[var(--apple-text-primary)] transition-colors hover:bg-[var(--apple-bg-subtle)]"
                  >
                    Edit
                  </button>

                  <FolderDeleteButton folderId={f.id} folderName={f.name} />
                </div>
              ) : null}
            </div>
          ))
        )}
      </div>

      <FolderEditPanel folder={selected} onClose={() => setSelected(null)} />
    </>
  );
}