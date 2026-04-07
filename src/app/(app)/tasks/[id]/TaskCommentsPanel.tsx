"use client";

import { useRef, useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  createWorkOrderComment,
  deleteWorkOrderComment,
} from "@/actions/workOrderComment";
import {
  getCommentDownloadUrl,
  uploadCommentAttachment,
} from "@/actions/workOrderCommentAttachments";
import CommentAttachmentUploader from "./CommentAttachmentUploader";
import { formatDateDDMMYY } from "@/lib/dateUtils";
import { CheckIcon, PaperClipIcon } from "@/components/ui/Icons";

type CommentAttachment = {
  id: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  url: string | null;
  createdAt: string | Date;
  uploader?: { id: string; name: string } | null;
};

type CommentItem = {
  id: string;
  text: string;
  createdAt: string | Date;
  author: { id: string; name: string } | null;
  attachments?: CommentAttachment[];
};

export default function TaskCommentsPanel({
  workOrderId,
  comments,
  canComment,
  currentUserId,
}: {
  workOrderId: string;
  comments: CommentItem[];
  canComment: boolean;
  currentUserId: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [text, setText] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [preview, setPreview] = useState<{ url: string; fileName: string; mimeType: string } | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setPreview(null);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  async function uploadFileToComment(commentId: string, file: File): Promise<boolean> {
    const formData = new FormData();
    formData.set("file", file);
    const res = await uploadCommentAttachment(commentId, formData);
    return !res?.error;
  }

  function submit() {
    setErr(null);
    const value = text.trim();
    if (!value) return;

    const filesToUpload = [...selectedFiles];

    startTransition(async () => {
      const res = await createWorkOrderComment(workOrderId, value);
      if ((res as any)?.error) {
        setErr((res as any).error);
        return;
      }

      const commentId = (res as any)?.data?.id;
      if (commentId && filesToUpload.length > 0) {
        let uploadFailed = false;
        for (const file of filesToUpload) {
          const ok = await uploadFileToComment(commentId, file);
          if (!ok) uploadFailed = true;
        }
        if (uploadFailed) setErr("Comment saved, but some file uploads failed. Check storage configuration.");
      }

      setText("");
      setSelectedFiles([]);
      if (fileInputRef.current) fileInputRef.current.value = "";
      router.refresh();
    });
  }

  function remove(commentId: string) {
    setErr(null);
    startTransition(async () => {
      const res = await deleteWorkOrderComment(commentId);
      if ((res as any)?.error) {
        setErr((res as any).error);
        return;
      }
      router.refresh();
    });
  }

  async function openAttachment(att: CommentAttachment) {
    setErr(null);
    let url: string | null = null;

    if (att.url && typeof att.url === "string" && att.url.startsWith("http")) {
      url = att.url;
    } else {
      setPreviewLoading(true);
      const res = await getCommentDownloadUrl(att.id);
      setPreviewLoading(false);
      if ((res as any)?.error) {
        setErr((res as any).error);
        return;
      }
      const u = (res as any)?.data?.url;
      if (u && typeof u === "string" && u.startsWith("http")) url = u;
    }

    if (url) {
      setPreview({ url, fileName: att.fileName, mimeType: att.mimeType });
    } else {
      setErr("Invalid download URL");
    }
  }

  const isImage = (mime: string) =>
    mime.startsWith("image/");
  const isPdf = (mime: string) =>
    mime === "application/pdf" || mime === "application/x-pdf";

  return (
    <>
    {previewLoading ? (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div className="rounded-2xl bg-[var(--apple-bg-elevated)] px-6 py-4 text-sm text-[var(--apple-text-secondary)]">
          Loading…
        </div>
      </div>
    ) : null}

    {(preview && !previewLoading) ? (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
        onClick={() => setPreview(null)}
        role="dialog"
        aria-modal="true"
        aria-label="Attachment preview"
      >
        <div
          className="relative flex max-h-[90vh] max-w-[90vw] flex-col rounded-2xl border border-[var(--apple-border)] bg-[var(--apple-bg-elevated)] shadow-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex shrink-0 items-center justify-between gap-3 border-b border-[var(--apple-border)] bg-[var(--apple-bg-subtle)] px-4 py-3">
            <span className="truncate text-sm font-medium text-[var(--apple-text-primary)]">
              {preview.fileName}
            </span>
            <div className="flex items-center gap-2 shrink-0">
              <a
                href={preview.url}
                download={preview.fileName}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg px-3 py-1.5 text-sm font-medium text-[var(--apple-accent)] hover:bg-[var(--apple-accent-muted)]"
              >
                Download
              </a>
              <button
                type="button"
                onClick={() => setPreview(null)}
                className="rounded-lg p-1.5 text-[var(--apple-text-tertiary)] hover:bg-[var(--apple-bg-elevated)] hover:text-[var(--apple-text-primary)]"
                aria-label="Close"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
          <div className="flex min-h-0 flex-1 items-center justify-center overflow-auto bg-[var(--apple-bg)] p-4">
            {isImage(preview.mimeType) ? (
              <img
                src={preview.url}
                alt={preview.fileName}
                className="max-h-[70vh] max-w-full object-contain"
              />
            ) : isPdf(preview.mimeType) ? (
              <iframe
                src={preview.url}
                title={preview.fileName}
                className="h-[70vh] w-full min-w-[min(90vw,600px)] rounded-lg border-0"
              />
            ) : (
              <div className="flex flex-col items-center gap-3 text-center">
                <p className="text-sm text-[var(--apple-text-secondary)]">
                  Preview not available for this file type.
                </p>
                <a
                  href={preview.url}
                  download={preview.fileName}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="apple-btn-primary px-4 py-2 text-sm"
                >
                  Download {preview.fileName}
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    ) : null}

    <div className="overflow-hidden rounded-[var(--apple-radius-lg)] border border-[var(--apple-border)] bg-[var(--apple-bg-elevated)] shadow-[var(--apple-shadow-sm)] transition-shadow hover:shadow-[var(--apple-shadow)]">
      <div className="flex items-center gap-3 bg-navy px-5 py-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-[var(--apple-radius)] bg-white/10">
          <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </div>
        <div>
          <div className="text-sm font-semibold text-white">Comments</div>
          <div className="text-xs text-white">
            Notes and file attachments
          </div>
        </div>
      </div>

      <div className="p-5">
        {canComment ? (
          <div className="grid gap-2">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={3}
              className="apple-input w-full px-4 py-3 text-sm"
              placeholder="Add a comment…"
              disabled={isPending}
            />
            <div className="flex flex-wrap items-center justify-between gap-3">
              <label className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-[var(--apple-radius)] border border-[var(--apple-border)] bg-[var(--apple-bg-subtle)] text-[var(--apple-text-secondary)] transition-colors hover:border-[var(--apple-accent)] hover:bg-[var(--apple-accent-muted)] hover:text-[var(--apple-accent)]" title="Attach file" aria-label="Attach file">
                <PaperClipIcon className="h-4 w-4" />
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  multiple
                  accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
                  onChange={(e) => {
                    const files = Array.from(e.target.files ?? []);
                    setSelectedFiles((prev) => [...prev, ...files]);
                    e.target.value = "";
                  }}
                />
              </label>
              {selectedFiles.length > 0 && (
                <div className="flex flex-wrap items-center gap-2">
                  {selectedFiles.map((f, i) => (
                    <span
                      key={`${f.name}-${i}`}
                      className="flex items-center gap-1 rounded-[var(--apple-radius)] bg-[var(--apple-accent-muted)] px-2 py-1 text-xs font-medium text-[var(--apple-accent)]"
                    >
                      {f.name}
                      <button
                        type="button"
                        onClick={() => setSelectedFiles((p) => p.filter((_, idx) => idx !== i))}
                        className="ml-0.5 rounded p-0.5 hover:bg-[var(--apple-accent-muted-hover)]"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
              <button
                type="button"
                onClick={submit}
                disabled={isPending || !text.trim()}
                aria-label={isPending ? "Saving…" : "Post comment"}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--apple-radius)] border border-[var(--apple-accent)] bg-[var(--apple-accent)] text-white transition-colors hover:bg-[var(--apple-accent-hover)] disabled:opacity-60 disabled:hover:bg-[var(--apple-accent)]"
              >
                <CheckIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        ) : (
          <div className="text-sm text-[var(--apple-text-tertiary)]">
            You don’t have permission to comment.
          </div>
        )}

        {err ? (
          <div className="mt-3 rounded-[var(--apple-radius-sm)] bg-red-50 px-3 py-2 text-sm text-red-600">
            {err}
          </div>
        ) : null}

        <div className="mt-6 grid gap-4">
          {(comments ?? []).length === 0 ? (
            <div className="rounded-[var(--apple-radius)] border border-dashed border-[var(--apple-border)] bg-[var(--apple-bg-subtle)] py-8 text-center text-sm text-[var(--apple-text-tertiary)]">
              No comments yet. Add the first one above.
            </div>
          ) : (
            comments.map((c) => {
              const canDelete = c.author?.id === currentUserId;

              return (
                <div
                  key={c.id}
                  className="rounded-[var(--apple-radius)] border border-[var(--apple-border)] bg-[var(--apple-bg-subtle)] p-4 transition-colors hover:border-[var(--apple-border-strong)]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-medium text-[var(--apple-text-primary)]">
                        {c.author?.name ?? "Unknown"}
                      </div>
                      <div className="mt-0.5 text-xs text-[var(--apple-text-tertiary)]">
                        {formatDateDDMMYY(c.createdAt)}
                      </div>
                    </div>

                    {canDelete ? (
                      <button
                        type="button"
                        onClick={() => remove(c.id)}
                        disabled={isPending}
                        className="rounded-lg border border-[var(--apple-border)] bg-[var(--apple-bg-elevated)] px-2 py-1 text-xs font-medium text-[var(--apple-text-primary)] hover:bg-[var(--apple-bg-subtle)] disabled:opacity-60"
                      >
                        Delete
                      </button>
                    ) : null}
                  </div>

                  <div className="mt-2 whitespace-pre-wrap text-sm text-[var(--apple-text-secondary)]">
                    {c.text}
                  </div>

                  <div className="mt-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-xs font-semibold uppercase tracking-wider text-[var(--apple-text-tertiary)]">
                        Attachments
                      </div>

                      {canComment ? (
                        <CommentAttachmentUploader
                          commentId={c.id}
                          onDone={() => router.refresh()}
                        />
                      ) : null}
                    </div>

                    <div className="mt-2 grid gap-2">
                      {(c.attachments ?? []).length === 0 ? (
                        <div className="text-xs text-[var(--apple-text-tertiary)]">None</div>
                      ) : (
                        (c.attachments ?? []).map((a) => (
                          <button
                            key={a.id}
                            type="button"
                            onClick={() => openAttachment(a)}
                            className="flex items-center justify-between gap-3 rounded-[12px] border border-[var(--apple-border)] bg-[var(--apple-bg-elevated)] px-3 py-2 text-left text-xs transition-colors hover:bg-[var(--apple-bg-subtle)]"
                            title={`View/download ${a.fileName}`}
                          >
                            <span className="flex min-w-0 items-center gap-2">
                              <svg className="h-4 w-4 shrink-0 text-[var(--apple-text-tertiary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                              </svg>
                              <span className="truncate font-medium text-[var(--apple-text-primary)]">
                                {a.fileName}
                              </span>
                            </span>
                            <span className="shrink-0 text-[10px] text-[var(--apple-accent)]">View</span>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
    </>
  );
}