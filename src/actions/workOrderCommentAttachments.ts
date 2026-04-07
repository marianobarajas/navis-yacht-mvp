// src/actions/workOrderCommentAttachments.ts
"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isManagerOrAbove } from "@/lib/rbac";
import {
  supabaseAdmin,
  SUPABASE_STORAGE_BUCKET,
  isSupabaseStorageConfigured,
  ensureStorageBucket,
} from "@/lib/supabaseStorage";
import { requireOrganizationId } from "@/lib/organization";

export async function uploadCommentAttachment(
  commentId: string,
  formData: FormData
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return { error: "Unauthorized", data: null };

  const organizationId = requireOrganizationId(session);
  if (!organizationId) return { error: "Unauthorized", data: null };

  const file = formData.get("file") as File | null;
  if (!file || !(file instanceof File)) {
    return { error: "No file provided", data: null };
  }

  const role = (session.user as any).role as string;
  const userId = (session.user as any).id as string;

  const comment = await prisma.workOrderComment.findFirst({
    where: { id: commentId, workOrder: { yacht: { organizationId } } },
    select: {
      id: true,
      workOrderId: true,
      workOrder: { select: { assignedToUserId: true } },
    },
  });

  if (!comment) return { error: "Comment not found", data: null };

  const canManage = isManagerOrAbove(role);
  const canSee = canManage || comment.workOrder?.assignedToUserId === userId;
  if (!canSee) return { error: "Forbidden", data: null };

  if (!isSupabaseStorageConfigured()) {
    return {
      error: "Storage is not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.",
      data: null,
    };
  }

  const MAX = 25 * 1024 * 1024;
  if (file.size > MAX) return { error: "File too large (max 25MB)", data: null };

  const safeName = file.name.replaceAll("/", "_");
  const storagePath = `work-orders/${comment.workOrderId}/comments/${commentId}/${Date.now()}-${safeName}`;

  if (!supabaseAdmin) return { error: "Storage not configured", data: null };

  const ok = await ensureStorageBucket();
  if (!ok) {
    return { error: "Storage bucket not available. Create bucket in Supabase Dashboard → Storage.", data: null };
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const { error: uploadError } = await supabaseAdmin.storage
    .from(SUPABASE_STORAGE_BUCKET)
    .upload(storagePath, buffer, {
      contentType: file.type || "application/octet-stream",
      upsert: false,
    });

  if (uploadError) {
    console.error("Supabase upload failed:", uploadError);
    return { error: uploadError.message ?? "Upload failed", data: null };
  }

  const publicUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${SUPABASE_STORAGE_BUCKET}/${storagePath}`
    : null;

  const att = await prisma.workOrderCommentAttachment.create({
    data: {
      commentId,
      uploaderUserId: userId,
      fileName: safeName,
      mimeType: file.type || "application/octet-stream",
      sizeBytes: file.size,
      storageKey: storagePath,
      url: publicUrl,
    },
    select: { id: true },
  });

  return { error: null, data: { id: att.id } };
}

export async function listCommentAttachments(commentId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return { error: "Unauthorized", data: null };

  const organizationId = requireOrganizationId(session);
  if (!organizationId) return { error: "Unauthorized", data: null };

  const commentOk = await prisma.workOrderComment.findFirst({
    where: { id: commentId, workOrder: { yacht: { organizationId } } },
    select: { id: true },
  });
  if (!commentOk) return { error: "Not found", data: null };

  const items = await prisma.workOrderCommentAttachment.findMany({
    where: { commentId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      fileName: true,
      mimeType: true,
      sizeBytes: true,
      url: true,
      createdAt: true,
      uploader: { select: { id: true, name: true } },
    },
  });

  return { error: null, data: items };
}

export async function getCommentDownloadUrl(attachmentId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return { error: "Unauthorized", data: null };

  const organizationId = requireOrganizationId(session);
  if (!organizationId) return { error: "Unauthorized", data: null };

  const att = await prisma.workOrderCommentAttachment.findFirst({
    where: {
      id: attachmentId,
      comment: { workOrder: { yacht: { organizationId } } },
    },
    select: { id: true, storageKey: true, url: true },
  });

  if (!att) return { error: "Not found", data: null };

  if (att.url && typeof att.url === "string" && att.url.startsWith("http")) {
    return { error: null, data: { url: att.url } };
  }

  if (!isSupabaseStorageConfigured()) {
    return { error: "Storage is not configured", data: null };
  }

  if (!supabaseAdmin) return { error: "Storage not configured", data: null };

  try {
    const { data, error } = await supabaseAdmin.storage
      .from(SUPABASE_STORAGE_BUCKET)
      .createSignedUrl(att.storageKey, 60 * 5);

    if (error || !data?.signedUrl) {
      return { error: error?.message ?? "Failed to generate download URL", data: null };
    }
    if (!data.signedUrl.startsWith("http")) {
      return { error: "Invalid download URL", data: null };
    }
    return { error: null, data: { url: data.signedUrl } };
  } catch (e) {
    console.error("createSignedUrl failed:", e);
    return { error: "Failed to generate download URL", data: null };
  }
}
