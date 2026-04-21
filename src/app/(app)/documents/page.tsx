import { getServerSession } from "next-auth";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { canCreateFolder, isManagerOrAbove } from "@/lib/rbac";
import { listFolders } from "@/actions/documents";
import { prisma } from "@/lib/db";
import { requireOrganizationId } from "@/lib/organization";
import FolderCreatePanel from "./FolderCreatePanel";
import { FolderDeleteButton } from "./FolderDeleteButton";
import { FolderEditButton } from "./FolderEditButton";
import { ChevronRightIcon } from "@/components/ui/Icons";

export default async function DocumentsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) throw new Error("Unauthorized");

  const organizationId = requireOrganizationId(session);
  if (!organizationId) throw new Error("Unauthorized");

  const role = (session.user as any).role;
  const me = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { permissionOverrides: true },
  });
  const canManageFolders = isManagerOrAbove(role) && canCreateFolder(role, me?.permissionOverrides as Record<string, boolean> | null);

  const [foldersRes, yachts] = await Promise.all([
    listFolders(),
    prisma.yacht.findMany({
      where: { organizationId },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const folders = (foldersRes as any)?.data ?? [];
  const error = (foldersRes as any)?.error ?? null;

  return (
    <div>
      <h1 className="text-3xl font-semibold tracking-tight text-[var(--apple-text-primary)]">Documents</h1>
      <p className="mt-2 text-base text-[var(--apple-text-tertiary)]">Folders and shared links</p>

      {error ? <p className="mt-3 text-base text-red-600">{error}</p> : null}

      {canManageFolders ? <div className="mt-8"><FolderCreatePanel yachts={yachts} /></div> : null}

      <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {folders.length === 0 ? (
          <div className="col-span-full rounded-[var(--apple-radius-lg)] border border-[var(--apple-border)] bg-[var(--apple-bg-elevated)] p-10 text-center text-base text-[var(--apple-text-secondary)]">
            No folders yet
          </div>
        ) : (
          folders.map((f: any) => (
            <div
              key={f.id}
              className="rounded-[var(--apple-radius-lg)] border border-[var(--apple-border)] bg-[var(--apple-bg-elevated)] p-5 shadow-[var(--apple-shadow-sm)] transition-all duration-200 hover:shadow-[var(--apple-shadow)] hover:border-[var(--apple-border-strong)]"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <Link
                    href={`/documents/${f.id}`}
                    className="block truncate font-semibold text-[var(--apple-text-primary)] hover:underline"
                    title={f.name}
                  >
                    {f.name}
                  </Link>

                  <p className="mt-0.5 text-xs text-[var(--apple-text-tertiary)]">
                    {f.yacht?.name ? `Yacht: ${f.yacht.name}` : "Global"}
                  </p>
                </div>

                <div className="flex shrink-0 items-start gap-2">
                  <span className="rounded-[var(--apple-radius-full)] bg-[var(--apple-bg-subtle)] px-2.5 py-1 text-xs font-medium text-[var(--apple-text-secondary)]">
                    {f._count?.documents ?? 0}
                  </span>

                  {canManageFolders ? (
                    <>
                      <FolderEditButton folderId={f.id} currentName={f.name} />
                      <FolderDeleteButton folderId={f.id} folderName={f.name} />
                    </>
                  ) : null}
                </div>
              </div>

              <div className="mt-3">
                <Link
                  href={`/documents/${f.id}`}
                  aria-label="Open folder"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-[var(--apple-radius)] border border-[var(--apple-border-strong)] bg-[var(--apple-bg-elevated)] text-[var(--apple-text-primary)] transition-colors hover:bg-[var(--apple-bg-subtle)] hover:border-[var(--apple-accent)] hover:text-[var(--apple-accent)]"
                >
                  <ChevronRightIcon className="h-4 w-4" />
                </Link>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}