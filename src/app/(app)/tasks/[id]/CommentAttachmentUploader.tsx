"use client";

import { useState, useTransition } from "react";
import { uploadCommentAttachment } from "@/actions/workOrderCommentAttachments";
import { PaperClipIcon } from "@/components/ui/Icons";

export default function CommentAttachmentUploader({
  commentId,
  onDone,
}: {
  commentId: string;
  onDone?: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  async function upload(file: File) {
    setErr(null);

    startTransition(async () => {
      const formData = new FormData();
      formData.set("file", file);

      const res = await uploadCommentAttachment(commentId, formData);

      if (res?.error) {
        setErr(res.error);
        return;
      }

      onDone?.();
    });
  }

  return (
    <div className="flex items-center gap-2">
      <label className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-[var(--apple-radius)] border border-[var(--apple-border)] bg-[var(--apple-bg-elevated)] text-[var(--apple-text-primary)] transition-colors hover:border-[var(--apple-accent)] hover:bg-[var(--apple-accent-muted)] hover:text-[var(--apple-accent)]" title={isPending ? "Uploading…" : "Add file"} aria-label={isPending ? "Uploading…" : "Add file"}>
        <PaperClipIcon className="h-4 w-4" />
        <input
          type="file"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) upload(f);
            e.currentTarget.value = "";
          }}
          disabled={isPending}
        />
      </label>

      {err ? <span className="text-xs text-red-600">{err}</span> : null}
    </div>
  );
}