import {
  supabaseAdmin,
  SUPABASE_STORAGE_BUCKET,
  ensureStorageBucket,
} from "@/lib/supabaseStorage";

export const YACHT_COVER_MAX_BYTES = 5 * 1024 * 1024; // 5MB
const YACHT_COVER_MIMES = new Set(["image/jpeg", "image/png", "image/webp"]);

function publicUrlForStoragePath(storagePath: string): string | null {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  if (!base) return null;
  return `${base}/storage/v1/object/public/${SUPABASE_STORAGE_BUCKET}/${storagePath}`;
}

/** Returns object path inside bucket if this URL points at our public bucket; otherwise null. */
export function storagePathFromYachtCoverUrl(url: string | null | undefined): string | null {
  if (!url?.trim()) return null;
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  if (!base) return null;
  const prefix = `${base}/storage/v1/object/public/${SUPABASE_STORAGE_BUCKET}/`;
  if (!url.startsWith(prefix)) return null;
  return url.slice(prefix.length);
}

export async function uploadYachtCoverFile(
  yachtId: string,
  file: File
): Promise<{ url: string | null; error: string | null }> {
  if (!YACHT_COVER_MIMES.has(file.type)) {
    return { url: null, error: "Please use a JPEG, PNG, or WebP image" };
  }
  if (file.size > YACHT_COVER_MAX_BYTES) {
    return { url: null, error: "Cover image must be 5MB or smaller" };
  }
  if (!supabaseAdmin) {
    return {
      url: null,
      error: "Storage is not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.",
    };
  }
  const bucketOk = await ensureStorageBucket();
  if (!bucketOk) {
    return { url: null, error: "Storage bucket not available. Check Supabase Storage." };
  }

  const storagePath = `yachts/${yachtId}/cover`;
  const buffer = Buffer.from(await file.arrayBuffer());
  const { error: uploadError } = await supabaseAdmin.storage
    .from(SUPABASE_STORAGE_BUCKET)
    .upload(storagePath, buffer, {
      contentType: file.type,
      upsert: true,
    });

  if (uploadError) {
    return { url: null, error: uploadError.message ?? "Upload failed" };
  }
  return { url: publicUrlForStoragePath(storagePath), error: null };
}

export async function removeYachtCoverFromStorage(publicUrl: string | null | undefined): Promise<void> {
  const path = storagePathFromYachtCoverUrl(publicUrl);
  if (!path || !supabaseAdmin) return;
  await supabaseAdmin.storage.from(SUPABASE_STORAGE_BUCKET).remove([path]);
}
