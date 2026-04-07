import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

function createSupabaseAdmin(): SupabaseClient | null {
  if (!supabaseUrl?.trim() || !supabaseServiceKey?.trim()) return null;
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false },
  });
}

export const supabaseAdmin = createSupabaseAdmin();

export const SUPABASE_STORAGE_BUCKET =
  process.env.SUPABASE_STORAGE_BUCKET ?? "attachments";

export function isSupabaseStorageConfigured(): boolean {
  return supabaseAdmin !== null;
}

let bucketEnsurePromise: Promise<boolean> | null = null;

/** Ensures the storage bucket exists, creating it if needed. */
export async function ensureStorageBucket(): Promise<boolean> {
  if (!supabaseAdmin) return false;
  if (bucketEnsurePromise) return bucketEnsurePromise;

  bucketEnsurePromise = (async () => {
    const { data: buckets } = await supabaseAdmin.storage.listBuckets();
    const exists = buckets?.some((b) => b.name === SUPABASE_STORAGE_BUCKET);
    if (exists) return true;

    const { error } = await supabaseAdmin.storage.createBucket(
      SUPABASE_STORAGE_BUCKET,
      { public: true }
    );
    if (error) {
      // Bucket may have been created by another request
      const { data: recheck } = await supabaseAdmin.storage.listBuckets();
      if (recheck?.some((b) => b.name === SUPABASE_STORAGE_BUCKET)) {
        return true;
      }
      console.error("Failed to create storage bucket:", error);
      bucketEnsurePromise = null;
      return false;
    }
    return true;
  })();

  return bucketEnsurePromise;
}
