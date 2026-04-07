import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { requireOrganizationId } from "@/lib/organization";
import Link from "next/link";
import { notFound } from "next/navigation";
import { listDocuments } from "@/actions/documents";
import { DocumentCreatePanel } from "./DocumentCreatePanel";
import { DocumentsClient } from "./DocumentsClient";

export default async function FolderPage(props: { params?: any }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) throw new Error("Unauthorized");

  const organizationId = requireOrganizationId(session);
  if (!organizationId) throw new Error("Unauthorized");

  const params = await props.params;

  const folderId =
    params?.folderId ??
    params?.folderID ??
    params?.id ??
    (params && typeof params === "object" ? Object.values(params)[0] : undefined);

  if (!folderId || typeof folderId !== "string") {
    console.error("Missing folderId param. params =", params);
    return notFound();
  }

  const folder = await prisma.documentFolder.findFirst({
    where: { id: folderId, organizationId },
    include: {
      yacht: { select: { id: true, name: true } },
      createdBy: { select: { id: true, name: true } },
    },
  });

  if (!folder) return notFound();

  const docsRes = await listDocuments(folderId);
  const docs = (docsRes as any)?.data ?? [];
  const error = (docsRes as any)?.error ?? null;

  return (
    <div>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-[var(--apple-text-primary)]">{folder.name}</h1>
          <p className="mt-2 text-base text-[var(--apple-text-tertiary)]">
            {folder.yacht?.name ? `Yacht: ${folder.yacht.name}` : "Global folder"}
          </p>
        </div>

        <Link
          href="/documents"
          aria-label="Back to documents"
          className="flex h-10 w-10 items-center justify-center rounded-[var(--apple-radius)] border border-[var(--apple-border)] bg-[var(--apple-bg-elevated)] text-[var(--apple-text-secondary)] transition-colors hover:border-[var(--apple-accent)] hover:bg-[var(--apple-accent-muted)] hover:text-[var(--apple-accent)]"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
      </div>

      {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}

      <DocumentCreatePanel folderId={folder.id} />

      <div className="mt-6 overflow-hidden rounded-[var(--apple-radius)] border border-[var(--apple-border)] bg-[var(--apple-bg-elevated)] shadow-[var(--apple-shadow-sm)]">
        <div className="border-b border-[var(--apple-border)] bg-[var(--apple-bg-subtle)] px-4 py-3 text-sm font-medium text-[var(--apple-text-secondary)]">
          Documents
        </div>

        {docs.length === 0 ? (
          <div className="p-6 text-sm text-[var(--apple-text-secondary)]">No documents yet. Add a link above.</div>
        ) : (
          <DocumentsClient docs={docs} folderId={folder.id} />
        )}
      </div>
    </div>
  );
}