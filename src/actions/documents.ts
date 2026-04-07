"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { isManagerOrAbove } from "@/lib/rbac";

function isValidHttpUrl(value: string) {
  try {
    const u = new URL(value);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

/** Folders */
export async function listFolders(opts?: { yachtId?: string | null }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return { error: "Unauthorized", data: null };

  const folders = await prisma.documentFolder.findMany({
    where: {
      yachtId: opts?.yachtId === undefined ? undefined : opts?.yachtId,
    },
    orderBy: [{ name: "asc" }],
    include: {
      _count: { select: { documents: true } },
      yacht: { select: { id: true, name: true } },
    },
  });

  return { error: null, data: folders };
}

export async function createFolder(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return { error: "Unauthorized" };

  if (!isManagerOrAbove((session.user as any).role)) return { error: "Forbidden" };

  const name = String(formData.get("name") ?? "").trim();
  const yachtIdRaw = String(formData.get("yachtId") ?? "").trim();
  const yachtId = yachtIdRaw ? yachtIdRaw : null;

  if (!name) return { error: "Folder name is required" };

  // ✅ Robust user id resolution (session id OR lookup by email)
  const sessionUserId = (session.user as any).id as string | undefined;
  const sessionEmail = (session.user as any).email as string | undefined;

  let userId = sessionUserId;

  if (!userId && sessionEmail) {
    const u = await prisma.user.findUnique({
      where: { email: sessionEmail },
      select: { id: true },
    });
    userId = u?.id;
  }

  if (!userId) {
    // Esto te dice EXACTAMENTE qué está mal sin romper todo
    console.error("createFolder: missing userId in session", {
      sessionUser: session.user,
    });
    return { error: "Auth session missing user id. Please re-login." };
  }

  try {
    await prisma.documentFolder.create({
      data: {
        name,
        yachtId,
        createdByUserId: userId,
      },
    });
  } catch (e: any) {
    // Prisma unique constraint
    if (e?.code === "P2002") {
      return { error: "Folder already exists for that yacht/scope" };
    }

    // ✅ Debug real (déjalo mientras estás desarrollando)
    console.error("createFolder failed:", e);
    return { error: "Failed to create folder" };
  }

  revalidatePath("/documents");
  return { error: null };
}

export async function renameFolder(folderId: string, formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return { error: "Unauthorized" };
  if (!isManagerOrAbove((session.user as any).role)) return { error: "Forbidden" };

  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Name required" };

  await prisma.documentFolder.update({
    where: { id: folderId },
    data: { name },
  });

  revalidatePath("/documents");
  revalidatePath(`/documents/${folderId}`);
  return { error: null };
}

export async function deleteFolder(folderId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return { error: "Unauthorized" };
  if (!isManagerOrAbove((session.user as any).role)) return { error: "Forbidden" };

  await prisma.documentFolder.delete({ where: { id: folderId } });

  revalidatePath("/documents");
  return { error: null };
}

/** Documents (links) */
export async function listDocuments(folderId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return { error: "Unauthorized", data: null };

  const docs = await prisma.document.findMany({
    where: { folderId },
    orderBy: [{ createdAt: "desc" }],
    include: {
      createdBy: { select: { id: true, name: true } },
    },
  });

  return { error: null, data: docs };
}

export async function createDocument(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return { error: "Unauthorized" };

  // Aquí puedes permitir TECH también (porque solo agrega links)
  const folderId = String(formData.get("folderId") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const externalUrl = String(formData.get("externalUrl") ?? "").trim();

  if (!folderId || !title || !externalUrl) return { error: "Missing required fields" };
  if (!isValidHttpUrl(externalUrl)) return { error: "URL must start with http(s)://" };

  await prisma.document.create({
    data: {
      folderId,
      title,
      description: description || null,
      externalUrl,
      createdByUserId: (session.user as any).id,
    },
  });

  revalidatePath("/documents");
  revalidatePath(`/documents/${folderId}`);
  return { error: null };
}

export async function updateDocument(docId: string, formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return { error: "Unauthorized" };

  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const externalUrl = String(formData.get("externalUrl") ?? "").trim();

  if (!title || !externalUrl) return { error: "Title and URL required" };
  if (!isValidHttpUrl(externalUrl)) return { error: "URL must start with http(s)://" };

  await prisma.document.update({
    where: { id: docId },
    data: {
      title,
      description: description || null,
      externalUrl,
    },
  });

  revalidatePath("/documents");
  return { error: null };
}

export async function deleteDocument(docId: string, folderId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return { error: "Unauthorized" };

  // Simple: cualquiera puede borrar lo que subió; managers pueden borrar todo
  const doc = await prisma.document.findUnique({ where: { id: docId }, select: { id: true, createdByUserId: true } });
  if (!doc) return { error: "Not found" };

  const role = (session.user as any).role;
  const userId = (session.user as any).id;

  if (doc.createdByUserId !== userId && !isManagerOrAbove(role)) {
    return { error: "Forbidden" };
  }

  await prisma.document.delete({ where: { id: docId } });

  revalidatePath("/documents");
  revalidatePath(`/documents/${folderId}`);
  return { error: null };
}