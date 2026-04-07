// src/actions/workOrderAttachments.ts
"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isManagerOrAbove } from "@/lib/rbac";
import {
  supabaseAdmin,
  SUPABASE_STORAGE_BUCKET,
  ensureStorageBucket,
} from "@/lib/supabaseStorage";
import { requireOrganizationId } from "@/lib/organization";

function safeFileName(name: string) {
  return name.replaceAll("/", "_").replaceAll("\\", "_").trim();
}

async function canAccessWorkOrder(user: any, workOrderId: string, organizationId: string) {
  const wo = await prisma.workOrder.findFirst({
    where: { id: workOrderId, yacht: { organizationId } },
    select: { id: true, createdByUserId: true, assignedToUserId: true },
  });
  if (!wo) return { ok: false as const, error: "Work order not found" };

  const role = user.role as string;
  const userId = user.id as string;

  const can =
    isManagerOrAbove(role) ||
    wo.createdByUserId === userId ||
    wo.assignedToUserId === userId;

  if (!can) return { ok: false as const, error: "Forbidden" };
  return { ok: true as const };
}

export async function uploadWorkOrderAttachment(
  workOrderId: string,
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

  const access = await canAccessWorkOrder(session.user as any, workOrderId, organizationId);
  if (!access.ok) return { error: access.error, data: null };

  if (!supabaseAdmin) {
    return {
      error: "Storage is not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.",
      data: null,
    };
  }

  const MAX = 25 * 1024 * 1024; // 25MB
  if (file.size > MAX) return { error: "File too large (max 25MB)", data: null };

  const uploaderUserId = (session.user as any).id as string;
  const safeName = safeFileName(file.name);
  const storagePath = `work-orders/${workOrderId}/${Date.now()}-${safeName}`;

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

  const att = await prisma.workOrderAttachment.create({
    data: {
      workOrderId,
      uploaderUserId,
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

/** @deprecated Use uploadWorkOrderAttachment instead */
export async function getWorkOrderUploadUrl(input: {
  workOrderId: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
}) {
  return {
    error: "Use uploadWorkOrderAttachment with FormData instead",
    data: null,
  };
}

export async function listWorkOrderAttachments(workOrderId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return { error: "Unauthorized", data: null };

  const organizationId = requireOrganizationId(session);
  if (!organizationId) return { error: "Unauthorized", data: null };

  const access = await canAccessWorkOrder(session.user as any, workOrderId, organizationId);
  if (!access.ok) return { error: access.error, data: null };

  const items = await prisma.workOrderAttachment.findMany({
    where: { workOrderId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      fileName: true,
      mimeType: true,
      sizeBytes: true,
      storageKey: true,
      url: true,
      createdAt: true,
      uploader: { select: { id: true, name: true } },
    },
  });

  return { error: null, data: items };
}

export async function getWorkOrderDownloadUrl(attachmentId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return { error: "Unauthorized", data: null };

  const organizationId = requireOrganizationId(session);
  if (!organizationId) return { error: "Unauthorized", data: null };

  const att = await prisma.workOrderAttachment.findFirst({
    where: { id: attachmentId, workOrder: { yacht: { organizationId } } },
    select: { id: true, workOrderId: true, storageKey: true, url: true, fileName: true },
  });
  if (!att) return { error: "Not found", data: null };

  const access = await canAccessWorkOrder(session.user as any, att.workOrderId, organizationId);
  if (!access.ok) return { error: access.error, data: null };

  if (att.url && typeof att.url === "string" && att.url.startsWith("http")) {
    return { error: null, data: { url: att.url } };
  }

  if (!supabaseAdmin) {
    return { error: "Storage is not configured", data: null };
  }

  try {
    const { data, error } = await supabaseAdmin.storage
      .from(SUPABASE_STORAGE_BUCKET)
      .createSignedUrl(att.storageKey, 60 * 5);

    if (error || !data?.signedUrl) {
      return { error: error?.message ?? "Failed to generate download URL", data: null };
    }
    return { error: null, data: { url: data.signedUrl } };
  } catch (e) {
    console.error("createSignedUrl failed:", e);
    return { error: "Failed to generate download URL", data: null };
  }
}
