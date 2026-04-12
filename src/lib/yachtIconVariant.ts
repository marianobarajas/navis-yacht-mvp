export const YACHT_ICON_VARIANT_COUNT = 6;

/** Persisted 0..5 for yacht silhouette art */
export function normalizeYachtIconVariant(raw: unknown): number {
  const n = typeof raw === "number" ? raw : parseInt(String(raw ?? ""), 10);
  if (!Number.isFinite(n)) return 0;
  const m = Math.floor(n) % YACHT_ICON_VARIANT_COUNT;
  return m < 0 ? m + YACHT_ICON_VARIANT_COUNT : m;
}
