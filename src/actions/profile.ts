"use server";

import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  supabaseAdmin,
  SUPABASE_STORAGE_BUCKET,
  ensureStorageBucket,
} from "@/lib/supabaseStorage";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE = 2 * 1024 * 1024; // 2MB

function extFromMime(mime: string): string {
  if (mime === "image/jpeg" || mime === "image/jpg") return "jpg";
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  return "jpg";
}

export async function uploadProfileImage(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { error: "Unauthorized", url: null };

  const file = formData.get("file") as File | null;
  if (!file || !(file instanceof File)) {
    return { error: "No file provided", url: null };
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return { error: "Please choose a JPEG, PNG, or WebP image", url: null };
  }
  if (file.size > MAX_SIZE) {
    return { error: "Image must be 2MB or smaller", url: null };
  }

  if (!supabaseAdmin) {
    return {
      error: "Storage is not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.",
      url: null,
    };
  }

  const ok = await ensureStorageBucket();
  if (!ok) {
    return {
      error: "Storage bucket not available. Create bucket in Supabase Dashboard → Storage.",
      url: null,
    };
  }

  const userId = session.user.id;
  const ext = extFromMime(file.type);
  const storagePath = `profile/${userId}.${ext}`;

  const buffer = Buffer.from(await file.arrayBuffer());
  const { error: uploadError } = await supabaseAdmin.storage
    .from(SUPABASE_STORAGE_BUCKET)
    .upload(storagePath, buffer, {
      contentType: file.type,
      upsert: true,
    });

  if (uploadError) {
    console.error("Profile image upload failed:", uploadError);
    return { error: uploadError.message ?? "Upload failed", url: null };
  }

  const publicUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${SUPABASE_STORAGE_BUCKET}/${storagePath}`
    : null;

  if (publicUrl) {
    await prisma.user.update({
      where: { id: userId },
      data: { profileImage: publicUrl },
    });
  }

  revalidatePath("/", "layout");
  return { error: null, url: publicUrl };
}

export async function removeProfileImage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { error: "Unauthorized" };

  await prisma.user.update({
    where: { id: session.user.id },
    data: { profileImage: null },
  });

  revalidatePath("/", "layout");
  return { error: null };
}
